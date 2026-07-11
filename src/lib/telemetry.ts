import 'reflect-metadata';

import { Attributes, Span, SpanOptions, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';

export const addSpanAttributes = (attributes: Attributes) => {
  trace.getActiveSpan()?.setAttributes(attributes);
};

export const addSpanError = (error: unknown) => {
  if (error instanceof Error) {
    trace.getActiveSpan()?.recordException(error);
  }
  trace.getActiveSpan()?.setStatus({ code: SpanStatusCode.ERROR });
};

const tracerCache: Record<string, Tracer> = {};

const getTracer = (name: string) => (tracerCache[name] ??= trace.getTracer(name));

export const traceFn = <T extends (span: Span) => Promise<any>>(
  tracerName: string,
  spanName: string,
  opts: SpanOptions,
  fn: T,
) => {
  const tracer = getTracer(tracerName);
  const traceName = `${tracerName}.${spanName}`;

  return tracer.startActiveSpan(traceName, opts, async (span) => {
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
};

export const TraceMethod =
  (opts?: SpanOptions): MethodDecorator =>
  (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const className = typeof target === 'function' ? target.name : target.constructor.name;

    descriptor.value = function (this: unknown, ...args: any[]) {
      return traceFn(className, propertyKey.toString(), opts ?? {}, () =>
        originalMethod.apply(this, args),
      );
    };
  };
