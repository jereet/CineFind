'use strict';

const { connect, disconnect, moviesCollection, getClient } = require('../src/db');
const { searchMovies, escapeRegExp, normalizeQuery } = require('../src/search');

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

function titles(results) {
  return results.map((r) => r.title);
}

async function run() {
  await connect();
  const collection = moviesCollection();
  const total = await collection.countDocuments();
  check('1.3 collection movies accessible (count/sample query)', total > 0, `count=${total}`);

  // --- 3.1 + 3.2 subcadena ---
  const tResults = await searchMovies('t');
  check(
    '3.1 "t" returns every movie whose title contains t',
    tResults.length > 0 && tResults.every((r) => r.title.toLowerCase().includes('t')),
    `count=${tResults.length}`
  );

  const darkResults = await searchMovies('dark');
  const darkTitles = titles(darkResults);
  check(
    '3.2 "dark" matches "The Dark Knight"',
    darkTitles.includes('The Dark Knight'),
    darkTitles.join(', ')
  );
  check('3.2 "dark" matches "Dark Shadows"', darkTitles.includes('Dark Shadows'), darkTitles.join(', '));

  const ticResults = await searchMovies('tic');
  check('3.2 "tic" matches "Fantastic" (ends in tic)', titles(ticResults).includes('Fantastic'));
  check(
    '3.2 "zzzzzz" returns empty list',
    (await searchMovies('zzzzzz')).length === 0
  );

  // --- 3.3 case-insensitive ---
  const upper = titles(await searchMovies('DARK')).sort();
  const lower = titles(await searchMovies('dark')).sort();
  const mixed = titles(await searchMovies('Dark')).sort();
  check(
    '3.3 "DARK", "dark" and "Dark" produce same results',
    JSON.stringify(upper) === JSON.stringify(lower) && JSON.stringify(lower) === JSON.stringify(mixed)
  );
  check('3.3 "dark" matches title with mixed case ("The Dark Knight")', lower.includes('The Dark Knight'));

  // --- prefijo ---
  const titaResults = titles(await searchMovies('Tita'));
  check('"Tita" returns "Titanic"', titaResults.includes('Titanic'), titaResults.join(', '));

  const interResults = await searchMovies('Inter');
  check('"Inter" returns non-empty including prefix matches', interResults.length > 0);
  check(
    '"Inter" returns titles starting with "Inter"',
    interResults.some((r) => r.title.toLowerCase().startsWith('inter')),
    titles(interResults).join(', ')
  );

  // --- 4.1 + 4.2 orden por relevancia ---
  const starResults = titles(await searchMovies('star'));
  const starIdx = starResults.indexOf('Star Wars');
  const bornIdx = starResults.indexOf('A Star Is Born');
  check('4.2 "star" lists "Star Wars" before "A Star Is Born"', starIdx !== -1 && bornIdx > starIdx, starResults.join(', '));
  check('4.1 prefix match ranked first ("Star Wars" is first result)', starIdx === 0, starResults.join(', '));

  // --- 4.3 determinismo ---
  const run1 = titles(await searchMovies('star'));
  const run2 = titles(await searchMovies('star'));
  check('4.3 same query twice returns same order', JSON.stringify(run1) === JSON.stringify(run2));

  // --- 5.1 proyección ---
  const sample = await searchMovies('star');
  check(
    '5.1 results expose only _id and title',
    sample.length > 0 && sample.every((r) => Object.keys(r).length === 2 && r._id && typeof r.title === 'string'),
    sample.length ? JSON.stringify(sample[0]) : 'no results'
  );

  // --- 5.2 una sola operación de agregación ---
  const counts = { aggregate: 0, find: 0, other: 0 };
  const collector = (ev) => {
    if (ev.commandName === 'aggregate') counts.aggregate += 1;
    else if (ev.commandName === 'find') counts.find += 1;
    else counts.other += 1;
  };
  getClient().on('commandStarted', collector);
  await searchMovies('star');
  getClient().removeListener('commandStarted', collector);
  check(
    '5.2 single aggregation operation, no extra find calls',
    counts.aggregate === 1 && counts.find === 0 && counts.other === 0,
    JSON.stringify(counts)
  );

  // --- consulta vacía ---
  check('empty string returns empty list', (await searchMovies('')).length === 0);
  check('whitespace-only query returns empty list', (await searchMovies('   ')).length === 0);
  check('normalizeQuery trims input', normalizeQuery('  star  ') === 'star');

  // --- 2.2 escape de caracteres especiales ---
  check('escapeRegExp escapes "*"', escapeRegExp('t*') === 't\\*');
  check('escapeRegExp escapes "."', escapeRegExp('a.b') === 'a\\.b');
  check('escapeRegExp escapes "$"', escapeRegExp('a$') === 'a\\$');
  const starAst = await searchMovies('t*');
  check(
    '2.2 "t*" treated as literal text (no wildcard)',
    Array.isArray(starAst) && starAst.every((r) => r.title.includes('t*')),
    `count=${starAst.length}`
  );
  check('2.2 "t*" returns only "t*" matches (here empty)', starAst.length === 0);

  await disconnect();
}

run()
  .then(() => {
    console.log(`\nVerification: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Verification crashed:', err);
    process.exit(1);
  });