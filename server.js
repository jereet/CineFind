'use strict';

const path = require('path');
const express = require('express');
const { connect, disconnect } = require('./src/db');
const { searchMovies } = require('./src/search');

const PORT = process.env.PORT || 3000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

function parseLimit(raw) {
  if (raw === undefined || raw === '') return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return DEFAULT_LIMIT;
  return Math.min(Math.max(n, 1), MAX_LIMIT);
}

function toResult(doc) {
  return {
    _id: doc._id,
    title: doc.title,
    poster: doc.poster ?? null,
    year: doc.year ?? null,
    genres: Array.isArray(doc.genres) ? doc.genres : [],
  };
}

app.get('/api/search', async (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchMovies(query, {
      limit: parseLimit(req.query.limit),
      fields: { _id: 1, title: 1, poster: 1, year: 1, genres: 1 },
    });
    res.json({ query: query.trim(), results: results.map(toResult) });
  } catch (err) {
    console.error('Search API error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await connect(undefined, 'samples_mflix');
  app.listen(PORT, () => {
    console.log(`Movie search server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});