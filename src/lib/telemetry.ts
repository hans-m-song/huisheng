import 'reflect-metadata';

import { Attributes, Span, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';
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
import { config } from '../config';

export const telemetrySdk = new NodeSDK({
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

export const addSpanAttributes = (attributes: Attributes) => {
  trace.getActiveSpan()?.setAttributes(attributes);
};

export const addSpanError = (error: unknown) => {
  if (error instanceof Error) {
    trace.getActiveSpan()?.recordException(error);
  }
  trace.getActiveSpan()?.setStatus({ code: SpanStatusCode.ERROR });
};

export const traceFn = <T extends (span: Span) => Promise<any>>(
  tracer: Tracer,
  name: string,
  fn: T,
) =>
  tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  });

export const TraceMethod =
  (tracer: Tracer, name?: string): MethodDecorator =>
  (_target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const traceName = name ?? String(propertyKey);
    const originalMethod = descriptor.value;

    descriptor.value = (...args: any[]) =>
      tracer.startActiveSpan(traceName, async (span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          if (error instanceof Error) {
            span.recordException(error);
          }
          throw error;
        } finally {
          span.end();
        }
      });
  };
