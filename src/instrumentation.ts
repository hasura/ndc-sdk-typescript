import * as opentelemetry from "@opentelemetry/sdk-node";
import * as traceHttpProto from "@opentelemetry/exporter-trace-otlp-proto";
import * as metricsHttpProto from "@opentelemetry/exporter-metrics-otlp-proto";
import * as traceGrpc from "@opentelemetry/exporter-trace-otlp-grpc";
import * as metricsGrpc from "@opentelemetry/exporter-metrics-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { Attributes, Span, SpanStatusCode, Tracer } from "@opentelemetry/api";
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { B3Propagator, B3InjectEncoding } from "@opentelemetry/propagator-b3"
import { LIB_VERSION } from './version'

let sdk: opentelemetry.NodeSDK | null = null;

export type Protocol = "grpc" | "http/protobuf";

export function initTelemetry(
  defaultServiceName: string = "hasura-ndc",
  defaultEndpoint: string = "http://localhost:4317",
  defaultProtocol: Protocol = "grpc",
) {
  if (isInitialized()) {
    throw new Error("Telemetry has already been initialized!");
  }

  const serviceName = process.env["OTEL_SERVICE_NAME"] || defaultServiceName;
  const endpoint =
    process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] || defaultEndpoint;
  const protocol = process.env["OTEL_EXPORTER_OTLP_PROTOCOL"] || defaultProtocol;

  const connectorName = process.env["HASURA_CONNECTOR_NAME"] || "unknown-connector";
  const connectorVersion = process.env["HASURA_CONNECTOR_VERSION"] || "unknown-version";

  let exporters = getExporters(protocol, endpoint);

  sdk = new opentelemetry.NodeSDK({
    serviceName,
    traceExporter: exporters.traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: exporters.metricsExporter,
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
          record["resource.service.version"] = LIB_VERSION;
          record["resource.service.connector.name"] = connectorName;
          record["resource.service.connector.version"] = connectorVersion;
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

type Exporters = {
  traceExporter: opentelemetry.node.SpanExporter,
  metricsExporter: opentelemetry.metrics.PushMetricExporter,
}

function getExporters(protocol: Protocol | string, endpoint: string): Exporters {
  switch (protocol) {
    case "grpc":
      return {
        traceExporter: new traceGrpc.OTLPTraceExporter({
          url: endpoint,
        }),
        metricsExporter: new metricsGrpc.OTLPMetricExporter({
          url: endpoint,
        })
      };
    case "http/protobuf":
      return {
        traceExporter: new traceHttpProto.OTLPTraceExporter({
          url: `${endpoint}/v1/traces`,
        }),
        metricsExporter: new metricsHttpProto.OTLPMetricExporter({
          url: `${endpoint}/v1/metrics`,
        })
      };
    default:
      throw new Error(`Unsupported protocol: {protocol}`);
  }
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
