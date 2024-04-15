import * as Minio from 'minio';
import internal from 'stream';

import { config, log } from '../config';
import { isNotNullishEntry, readStream } from './utils';

const client = new Minio.Client({
  endPoint: config.minioEndpoint,
  port: config.minioEndpointPort,
  useSSL: config.minioEndpointSSL,
  accessKey: config.minioAccessKey,
  secretKey: config.minioSecretKey,
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

export class Bucket {
  static ping = async () => {
    try {
      await client.bucketExists(config.minioBucketName);
      log.info({ event: 'Bucket.ping', status: 'success' });
      return true;
    } catch (error) {
      log.error({ event: 'Bucket.ping', error, bucket: config.minioBucketName });
      return false;
    }
  };

  static getTags = async (name: string): Promise<Minio.TagList | null> => {
    try {
      const result = await client.getObjectTagging(config.minioBucketName, name);
      const tags = flattenTagList(result.flat());
      log.info({ event: 'Bucket.getTags', name, tags });
      return tags;
    } catch (error) {
      log.error({ event: 'Bucket.getTags', error, name });
      return null;
    }
  };

  static setTags = async (name: string, tags: TagInput): Promise<boolean> => {
    if (Object.keys(tags).length < 1) {
      log.info({ event: 'Bucket.setTags', name, message: 'no tags to set' });
      return true;
    }

    try {
      const normalised = encodeTagList(tags);
      await client.setObjectTagging(config.minioBucketName, name, normalised);
      return true;
    } catch (error) {
      log.error({ event: 'Bucket.setTags', error, name, tags });
      return false;
    }
  };

  static list = async (prefix: string, recursive = true): Promise<Minio.BucketItem[] | null> => {
    try {
      const stream = client.listObjectsV2(config.minioBucketName, prefix, recursive);
      const results = await readStream<Minio.BucketItem>(stream);
      log.info({ event: 'Bucket.list', prefix, count: results.length });
      return results;
    } catch (error) {
      log.error({ event: 'Bucket.list', error, prefix });
      return null;
    }
  };

  static put = async (src: string, dest: string): Promise<boolean> => {
    try {
      const result = await client.fPutObject(config.minioBucketName, dest, src);
      log.info({ event: 'Bucket.put', src, dest, result });
      return true;
    } catch (error) {
      log.error({ event: 'Bucket.put', error, src, dest });
      return false;
    }
  };

  static stat = async (name: string): Promise<Minio.BucketItemStat | null> => {
    try {
      const stats = await client.statObject(config.minioBucketName, name);
      log.info({ event: 'Bucket.stat', name, stats });
      return stats;
    } catch (error) {
      if (!(error as any).message.includes('Not Found')) {
        log.error({ event: 'Bucket.stat', error, name });
      }

      return null;
    }
  };

  static getStream = async (name: string): Promise<internal.Readable | null> => {
    try {
      const stats = await client.statObject(config.minioBucketName, name);
      if (!stats) {
        throw new Error(`object does not exist: "${name}"`);
      }

      const contentType = stats?.metaData?.['content-type'];
      if (!contentType) {
        throw new Error(
          `object does not have a content-type: "${name}", ${JSON.stringify(stats.metaData)}`,
        );
      }

      const stream = await client.getObject(config.minioBucketName, name);
      log.info({ event: 'Bucket.getStream', name, contentType });
      return stream;
    } catch (error) {
      log.error({ event: 'Bucket.getStream', error, name });
      return null;
    }
  };

  static get = async (name: string): Promise<Buffer | null> => {
    try {
      const stream = await client.getObject(config.minioBucketName, name);
      const chunks = await readStream(stream);
      const data = chunks.reduce((result, current) => Buffer.concat([result, current]));
      log.info({ event: 'Bucket.get', name, size: data.length });
      return data;
    } catch (error) {
      log.error({ event: 'Bucket.get', error, name });
      return null;
    }
  };
}
