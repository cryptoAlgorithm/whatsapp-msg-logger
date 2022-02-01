import { MongoClient } from 'mongodb';
import { DB_IP, DB_NAME, DB_PASS, DB_PORT, DB_USER } from './config';

export const DB_CURL = `mongodb://${DB_USER}:${DB_PASS}@${DB_IP}:${DB_PORT}/?authSource=${DB_NAME}`; // Connection URL

// Create a new MongoClient and db
export const client = new MongoClient(DB_CURL);
export const db = client.db(DB_NAME);