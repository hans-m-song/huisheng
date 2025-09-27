import 'reflect-metadata';

import { Attributes, Span, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';

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
