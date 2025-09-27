import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { ConnectInstrumentation } from '@opentelemetry/instrumentation-connect';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { logs, NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { config } from './config';

const diagLogLevels: Record<string, DiagLogLevel> = {
  none: DiagLogLevel.NONE,
  error: DiagLogLevel.ERROR,
  warn: DiagLogLevel.WARN,
  info: DiagLogLevel.INFO,
  debug: DiagLogLevel.DEBUG,
  verbose: DiagLogLevel.VERBOSE,
  all: DiagLogLevel.ALL,
};

diag.setLogger(new DiagConsoleLogger(), {
  logLevel: diagLogLevels[config.OTEL_LOG_LEVEL ?? 'none'] ?? diagLogLevels.none,
});

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'huisheng',
    [ATTR_SERVICE_VERSION]: config.GITHUB_SHA,
  }),
  logRecordProcessors: [
    new logs.BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: config.OTLP_LOGS_ENDPOINT,
        headers: config.OTLP_LOGS_TOKEN ? { bearer: config.OTLP_LOGS_TOKEN } : undefined,
      }),
    ),
  ],
  traceExporter: new OTLPTraceExporter({
    url: config.OTLP_TRACES_ENDPOINT,
    headers: config.OTLP_TRACES_TOKEN ? { bearer: config.OTLP_TRACES_TOKEN } : undefined,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: config.OTLP_METRICS_ENDPOINT,
      headers: config.OTLP_METRICS_TOKEN ? { bearer: config.OTLP_METRICS_TOKEN } : undefined,
    }),
  }),
  instrumentations: [
    new AwsInstrumentation(),
    new ConnectInstrumentation(),
    new HttpInstrumentation(),
    new PinoInstrumentation({
      logKeys: { spanId: 'spanId', traceId: 'traceId', traceFlags: 'traceFlags' },
    }),
    new RuntimeNodeInstrumentation(),
  ],
});

sdk.start();
