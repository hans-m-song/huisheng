import * as Minio from 'minio';
import internal from 'stream';

import { trace } from '@opentelemetry/api';
import { config, log } from '../config';
import { addSpanAttributes, addSpanError, TraceMethod } from './telemetry';
import { isNotNullishEntry, readStream } from './utils';

const client = new Minio.Client({
  endPoint: config.S3_ENDPOINT,
  port: config.S3_ENDPOINT_PORT,
  useSSL: config.S3_ENDPOINT_SSL,
  accessKey: config.S3_ACCESS_KEY,
  secretKey: config.S3_SECRET_KEY,
});

type TagInput = Record<string, string | number | boolean | undefined | null>;

const encodeTagList = (tags: TagInput): Minio.TagList =>
  Object.fromEntries(
    Object.entries(tags)
      .filter(isNotNullishEntry)
      .map(([key, value]) => [key, Buffer.from(`${value}`).toString('hex')]),
  );

const flattenTagList = (tags: Minio.Tag[]): Minio.TagList =>
  Object.fromEntries(
    tags.map(({ Key, Value }) => {
      const value = Buffer.from(`${Value}`, 'hex').toString();

      const asNumber = parseInt(value);
      if (/^[0-9]+$/.test(value) && !isNaN(asNumber)) {
        return [Key, asNumber];
      }

      if (['true', 'false'].includes(Value)) {
        return [Key, Value === 'true'];
      }

      return [Key, value];
    }),
  );

const tracer = trace.getTracer('bucket');

export class Bucket {
  @TraceMethod(tracer, 'bucket/ping')
  static async ping() {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME });
      const exists = await client.bucketExists(config.S3_BUCKET_NAME);
      log.info({ event: 'Bucket.ping', status: 'success' });
      return exists;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.ping', error, bucket: config.S3_BUCKET_NAME });
      return false;
    }
  }

  @TraceMethod(tracer, 'bucket/get_tags')
  static async getTags(name: string): Promise<Minio.TagList | null> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: name });
      const result = await client.getObjectTagging(config.S3_BUCKET_NAME, name);
      const tags = flattenTagList(result.flat());
      log.info({ event: 'Bucket.getTags', name, tags });
      return tags;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.getTags', error, name });
      return null;
    }
  }

  @TraceMethod(tracer, 'bucket/set_tags')
  static async setTags(name: string, tags: TagInput): Promise<boolean> {
    if (Object.keys(tags).length < 1) {
      log.info({ event: 'Bucket.setTags', name, message: 'no tags to set' });
      return true;
    }

    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: name });
      const normalised = encodeTagList(tags);
      await client.setObjectTagging(config.S3_BUCKET_NAME, name, normalised);
      return true;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.setTags', error, name, tags });
      return false;
    }
  }

  @TraceMethod(tracer, 'bucket/list')
  static async list(prefix: string, recursive = true): Promise<Minio.BucketItem[] | null> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, prefix, recursive });
      const stream = client.listObjectsV2(config.S3_BUCKET_NAME, prefix, recursive);
      const results = await readStream<Minio.BucketItem>(stream);
      log.info({ event: 'Bucket.list', prefix, count: results.length });
      return results;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.list', error, prefix });
      return null;
    }
  }

  @TraceMethod(tracer, 'bucket/put')
  static async put(src: string, dest: string): Promise<boolean> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: dest, filename: src });
      const result = await client.fPutObject(config.S3_BUCKET_NAME, dest, src);
      log.info({ event: 'Bucket.put', src, dest, result });
      return true;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.put', error, src, dest });
      return false;
    }
  }

  @TraceMethod(tracer, 'bucket/stat')
  static async stat(name: string): Promise<Minio.BucketItemStat | null> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: name });
      const stats = await client.statObject(config.S3_BUCKET_NAME, name);
      log.info({ event: 'Bucket.stat', name, stats });
      return stats;
    } catch (error) {
      addSpanError(error);
      if (!(error as any).message.includes('Not Found')) {
        log.error({ event: 'Bucket.stat', error, name });
      }

      return null;
    }
  }

  @TraceMethod(tracer, 'bucket/get_stream')
  static async getStream(name: string): Promise<internal.Readable | null> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: name });
      const stats = await client.statObject(config.S3_BUCKET_NAME, name);
      if (!stats) {
        throw new Error(`object does not exist: "${name}"`);
      }

      const contentType = stats?.metaData?.['content-type'];
      if (!contentType) {
        throw new Error(
          `object does not have a content-type: "${name}", ${JSON.stringify(stats.metaData)}`,
        );
      }

      const stream = await client.getObject(config.S3_BUCKET_NAME, name);
      log.info({ event: 'Bucket.getStream', name, contentType });
      return stream;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.getStream', error, name });
      return null;
    }
  }

  @TraceMethod(tracer, 'bucket/get')
  static async get(name: string): Promise<Buffer | null> {
    try {
      addSpanAttributes({ bucket_name: config.S3_BUCKET_NAME, object_name: name });
      const stream = await client.getObject(config.S3_BUCKET_NAME, name);
      const chunks = await readStream(stream);
      const data = chunks.reduce((result, current) => Buffer.concat([result, current]));
      log.info({ event: 'Bucket.get', name, size: data.length });
      return data;
    } catch (error) {
      addSpanError(error);
      log.error({ event: 'Bucket.get', error, name });
      return null;
    }
  }
}
