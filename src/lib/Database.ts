import { Collection, MongoClient } from 'mongodb';

import { config } from '../config';
import { logError, logEvent } from './utils';

const auth = `${config.mongoUser}:${config.mongoPass}`;
const tenant = `${config.mongoHost}:${config.mongoPort}`;
const uri = `mongodb://${auth}@${tenant}`;
const client = new MongoClient(uri);

export const pollMongoConnection = (timeout = 30000) => {
  if (!config.mongoWaitFor) {
    logEvent('database', 'not attempting connection to poll connection');
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Timed out waiting for a Mongo Connection'));
    }, timeout);

    const interval = setInterval(() => {
      logEvent('database', 'pinging');
      client.connect()
        .then(() => {
          clearInterval(interval);
          clearTimeout(timer);
          logEvent('database', 'successfully connected');
          resolve();
        })
        .catch(() => { /* ignore */ });
    }, 1000);
  });
};

export const getCollection = async (name: string): Promise<Collection | null> => {
  try {
    await client.connect();
    return client.db(config.mongoDbName).collection(name);
  } catch (error) {
    logError('database', error, 'failed to connect');
    return null;
  }
};

export const clearCollection = async (name: string): Promise<void> => {
  try {
    logEvent('database', 'dropping collection', name);
    await client.connect();
    await client.db(config.mongoDbName).dropCollection(name);
  } catch (error) {
    logError('database', error, 'failed to clear collection', `${config.mongoDbName}.${name}`);
  }
};

const disconnect = () =>
  client
    .close()
    .catch((error) => logError('database', error, 'failed to disconnect'));

export const db = { disconnect };
