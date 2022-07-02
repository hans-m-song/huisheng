import * as Minio from 'minio';
import internal from 'stream';

import { config } from '../config';
import { logError, logEvent, readStream } from './utils';

const client = new Minio.Client({
  endPoint: 'api.minio.k8s.axatol.xyz',
  useSSL: true,
  accessKey: config.minioAccessKey,
  secretKey: config.minioSecretKey,
});

type TagInput = Record<string, string | number | boolean | undefined | null>;

const encodeTagList = (tags: TagInput): Minio.TagList =>
  Object.entries(tags).reduce(
    (result, [key, value]) =>
      value === undefined || value === null
        ? result
        : { ...result, [key]: encodeURIComponent(value) },
    {} as Minio.TagList,
  );

const flattenTagList = (tags: Minio.Tag[]): Minio.TagList =>
  tags.reduce((result, { Key, Value }) => ({ ...result, [Key]: decodeURIComponent(Value) }), {});

export class Bucket {
  static ping = async () => {
    try {
      await client.bucketExists(config.minioBucketName);
      logEvent('database.ping', 'success');
      return true;
    } catch (error) {
      logError('database.ping', error);
      return false;
    }
  };

  static getTags = async (name: string): Promise<Minio.TagList> => {
    const result = await client.getObjectTagging(config.minioBucketName, name);
    return flattenTagList(result);
  };

  static setTags = async (name: string, tags?: TagInput): Promise<void> => {
    if (tags && Object.keys(tags).length > 0) {
      const normalised = encodeTagList(tags);
      await client.setObjectTagging(config.minioBucketName, name, normalised);
    }
  };

  static list = async (prefix: string, recursive = true): Promise<Minio.BucketItem[] | null> => {
    try {
      const stream = client.listObjectsV2(config.minioBucketName, prefix, recursive);
      const results = await readStream<Minio.BucketItem>(stream);
      logEvent('database.list', { count: results.length });
      return results;
    } catch (error) {
      logError('database.list', error);
      return null;
    }
  };

  static put = async (src: string, dest: string, tags?: TagInput): Promise<boolean> => {
    try {
      const result = await client.fPutObject(config.minioBucketName, dest, src);
      await this.setTags(dest, tags);
      logEvent('database.put', { src, dest, result });
      return true;
    } catch (error) {
      logError('database.put', error, { src, dest, tags });
      return false;
    }
  };

  static stat = async (
    name: string,
  ): Promise<{
    stats: Minio.BucketItemStat;
    tags: Minio.TagList;
  } | null> => {
    try {
      const [stats, tags] = await Promise.all([
        client.statObject(config.minioBucketName, name),
        this.getTags(name),
      ]);
      logEvent('database.stat', { stats, tags });
      return { stats, tags };
    } catch (error) {
      logError('database.stat', error);
      return null;
    }
  };

  static getStream = async (name: string): Promise<internal.Readable | null> => {
    try {
      const stream = await client.getObject(config.minioBucketName, name);
      logEvent('database.getStream', { name });
      return stream;
    } catch (error) {
      logError('database.getStream', error);
      return null;
    }
  };

  static get = async (name: string): Promise<Buffer | null> => {
    try {
      const stream = await client.getObject(config.minioBucketName, name);
      const chunks = await readStream(stream);
      const data = chunks.reduce((result, current) => Buffer.concat([result, current]));
      logEvent('database.get', { name, size: data.length });
      return data;
    } catch (error) {
      logError('database.get', error);
      return null;
    }
  };
}
