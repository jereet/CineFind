'use strict';

const { connect, disconnect, moviesCollection } = require('../src/db');

const MOVIES = [
  'Star Wars',
  'A Star Is Born',
  'The Dark Knight',
  'Dark Shadows',
  'Titanic',
  'Interstellar',
  'Fantastic',
];

async function seed() {
  const db = await connect();
  const collection = moviesCollection();
  const maybe = await collection.find({}).limit(1).toArray();
  if (maybe.length > 0) {
    const count = await collection.countDocuments();
    console.log(`Collection 'movies' already populated (${count} documents). Skipping seed.`);
    await disconnect();
    return;
  }
  await collection.insertMany(MOVIES.map((title) => ({ title })));
  const count = await collection.countDocuments();
  console.log(`Seeded ${MOVIES.length} movies. Total documents in 'movies': ${count}`);

  if (count !== MOVIES.length) {
    throw new Error(`Expected ${MOVIES.length} documents but found ${count}`);
  }
  await disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});