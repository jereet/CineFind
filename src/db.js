'use strict';

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'movie_search';
const MOVIES_COLLECTION = 'movies';

let client;
let db;

async function connect(uri = MONGO_URI, dbName = MONGO_DB) {
  if (client && db) return db;
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, monitorCommands: true });
  await client.connect();
  db = client.db(dbName);
  return db;
}

async function disconnect() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

function moviesCollection() {
  if (!db) {
    throw new Error('Not connected. Call connect() first.');
  }
  return db.collection(MOVIES_COLLECTION);
}

function getClient() {
  return client;
}

module.exports = {
  connect,
  disconnect,
  moviesCollection,
  getClient,
  MONGO_URI,
  MONGO_DB,
  MOVIES_COLLECTION,
};