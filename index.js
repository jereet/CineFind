'use strict';

const { connect, disconnect } = require('./src/db');
const { searchMovies } = require('./src/search');

async function main() {
  const query = process.argv[2] || '';
  await connect();
  const results = await searchMovies(query);
  console.log(`Query: "${query}" -> ${results.length} result(s)`);
  for (const r of results) {
    console.log(`  - ${r.title}`);
  }
  await disconnect();
}

main().catch((err) => {
  console.error('Search failed:', err.message);
  process.exit(1);
});