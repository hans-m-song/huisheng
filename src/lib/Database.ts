import { Collection, MongoClient } from 'mongodb';

import { config } from '../config';
import { logError } from './utils';

const auth = `${config.mongoUser}:${config.mongoPass}`;
const tenant = `${config.mongoHost}:${config.mongoPort}`;
const uri = `mongodb://${auth}@${tenant}`;
const client = new MongoClient(uri);

export const getCollection = async (name: string): Promise<Collection | null> => {
  try {
    await client.connect();
    return client.db(config.mongoDbName).collection(name);
  } catch (error) {
    logError('database', error, 'failed to connect');
    return null;
  }
};

const disconnect = () =>
  client
    .close()
    .catch((error) => logError('database', error, 'failed to disconnect'));

export const db = { disconnect };
