/*instrumentation.ts*/
import * as opentelemetry from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";

import {
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

export function initTelemetry(serviceName: string, endpoint: string) {
  const sdk = new opentelemetry.NodeSDK({
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
      new HttpInstrumentation(),
      new FastifyInstrumentation(),
      // the pino instrumentation adds trace information to pino logs
      new PinoInstrumentation({
        logHook: (span, record, level) => {
          record["resource.service.name"] = serviceName;
        },
      }),
    ],
  });

  process.on("beforeExit", async () => {
    await sdk.shutdown();
  });

  sdk.start();
}

