import * as opentelemetry from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { Attributes, Span, SpanStatusCode, Tracer } from "@opentelemetry/api";
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { B3Propagator, B3InjectEncoding } from "@opentelemetry/propagator-b3"

let sdk: opentelemetry.NodeSDK | null = null;

export function initTelemetry(
  defaultServiceName: string = "hasura-ndc",
  defaultEndpoint: string = "http://localhost:4318"
) {
  if (isInitialized()) {
    throw new Error("Telemetry has already been initialized!");
  }

  const serviceName = process.env["OTEL_SERVICE_NAME"] || defaultServiceName;
  const endpoint =
    process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] || defaultEndpoint;

  sdk = new opentelemetry.NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${endpoint}/v1/metrics`,
      }),
    }),
    instrumentations: [
      new HttpInstrumentation({
        applyCustomAttributesOnSpan: (span, request, response) => {
          span.setAttributes(USER_VISIBLE_SPAN_ATTRIBUTE);
        },
      }),
      new FastifyInstrumentation({
        requestHook: (span, info) => {
          span.setAttributes(USER_VISIBLE_SPAN_ATTRIBUTE);
        },
      }),
      new FetchInstrumentation({
        applyCustomAttributesOnSpan: (span, request, response) => {
          span.setAttributes(USER_VISIBLE_SPAN_ATTRIBUTE);;
        },
      }),
      // the pino instrumentation adds trace information to pino logs
      new PinoInstrumentation({
        logHook: (span, record, level) => {
          record["resource.service.name"] = serviceName;
          // This logs the parent span ID in the pino logs, useful for debugging propagation.
          // parentSpanId is an internal property, hence the cast to any, because I can't
          // seem to find a way to get at it through a supported API 😭
          record["parent_span_id"] = (span as any).parentSpanId;
        },
      }),
    ],
    textMapPropagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
        new B3Propagator(),
        new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
      ]
    }),
  });

  process.on("beforeExit", async () => {
    await sdk?.shutdown();
  });

  sdk.start();
}

export function isInitialized(): boolean {
  return sdk !== null;
}

export const USER_VISIBLE_SPAN_ATTRIBUTE: Attributes = {
  "internal.visibility": "user",
};

export function withActiveSpan<TReturn>(
  tracer: Tracer,
  name: string,
  func: (span: Span) => TReturn,
  attributes?: Attributes
): TReturn {
  return withInternalActiveSpan(tracer, name, func, attributes ? { ...USER_VISIBLE_SPAN_ATTRIBUTE, ...attributes } : USER_VISIBLE_SPAN_ATTRIBUTE);
}

export function withInternalActiveSpan<TReturn>(
  tracer: Tracer,
  name: string,
  func: (span: Span) => TReturn,
  attributes?: Attributes
): TReturn {
  return tracer.startActiveSpan(name, (span) => {
    if (attributes) span.setAttributes(attributes);

    const handleError = (err: unknown) => {
      if (err instanceof Error || typeof err === "string") {
        span.recordException(err);
      }
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
    };

    try {
      const retval = func(span);
      // If the function returns a Promise, then wire up the span completion to
      // the completion of the promise
      if (
        typeof retval === "object" &&
        retval !== null &&
        "then" in retval &&
        typeof retval.then === "function"
      ) {
        return (retval as PromiseLike<unknown>).then(
          (successVal) => {
            span.end();
            return successVal;
          },
          (errorVal) => {
            handleError(errorVal);
            throw errorVal;
          }
        ) as TReturn;
      }
      // Not a promise, just end the span and return
      else {
        span.end();
        return retval;
      }
    } catch (e) {
      handleError(e);
      throw e;
    }
  });
}
