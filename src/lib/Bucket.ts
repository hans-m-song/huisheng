import * as Minio from 'minio';
import internal from 'stream';

import { config } from '../config';
import { isNotNullishEntry, logError, logEvent, readStream } from './utils';

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
      .map(([key, value]) => [key, Buffer.from(`${value}`).toString('base64')]),
  );

const flattenTagList = (tags: Minio.Tag[]): Minio.TagList =>
  Object.fromEntries(tags.map(({ Key, Value }) => [Key, Buffer.from(Value).toString('ascii')]));

export class Bucket {
  static ping = async () => {
    try {
      await client.bucketExists(config.minioBucketName);
      logEvent('Bucket.ping', 'success');
      return true;
    } catch (error) {
      logError('Bucket.ping', error, { bucket: config.minioBucketName });
      return false;
    }
  };

  static getTags = async (name: string): Promise<Minio.TagList | null> => {
    try {
      const result = await client.getObjectTagging(config.minioBucketName, name);
      const tags = flattenTagList(result.flat());
      logEvent('Bucket.getTags', { name, tags });
      return tags;
    } catch (error) {
      logError('Bucket.getTags', error, { name });
      return null;
    }
  };

  static setTags = async (name: string, tags: TagInput): Promise<boolean> => {
    if (Object.keys(tags).length < 1) {
      logEvent('Bucket.setTags', 'no tags to set', { name });
      return true;
    }

    try {
      const normalised = encodeTagList(tags);
      await client.setObjectTagging(config.minioBucketName, name, normalised);
      return true;
    } catch (error) {
      logError('Bucket.setTags', error, { name, tags });
      return false;
    }
  };

  static list = async (prefix: string, recursive = true): Promise<Minio.BucketItem[] | null> => {
    try {
      const stream = client.listObjectsV2(config.minioBucketName, prefix, recursive);
      const results = await readStream<Minio.BucketItem>(stream);
      logEvent('Bucket.list', { prefix, count: results.length });
      return results;
    } catch (error) {
      logError('Bucket.list', error, { prefix });
      return null;
    }
  };

  static put = async (src: string, dest: string): Promise<boolean> => {
    try {
      const result = await client.fPutObject(config.minioBucketName, dest, src);
      logEvent('Bucket.put', { src, dest, result });
      return true;
    } catch (error) {
      logError('Bucket.put', error, { src, dest });
      return false;
    }
  };

  static stat = async (name: string): Promise<Minio.BucketItemStat | null> => {
    try {
      const stats = await client.statObject(config.minioBucketName, name);
      logEvent('Bucket.stat', { name, stats });
      return stats;
    } catch (error) {
      if (!(error as any).message.includes('Not Found')) {
        logError('Bucket.stat', error, { name });
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
      logEvent('Bucket.getStream', { name, contentType });
      return stream;
    } catch (error) {
      logError('Bucket.getStream', error, { name });
      return null;
    }
  };

  static get = async (name: string): Promise<Buffer | null> => {
    try {
      const stream = await client.getObject(config.minioBucketName, name);
      const chunks = await readStream(stream);
      const data = chunks.reduce((result, current) => Buffer.concat([result, current]));
      logEvent('Bucket.get', { name, size: data.length });
      return data;
    } catch (error) {
      logError('Bucket.get', error, { name });
      return null;
    }
  };
}
