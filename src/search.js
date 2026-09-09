'use strict';

const { moviesCollection } = require('./db');

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(text) {
  return text.replace(REGEX_SPECIAL_CHARS, '\\$&');
}

function normalizeQuery(query) {
  if (typeof query !== 'string') return '';
  return query.trim();
}

function buildPipeline(term, options = {}) {
  const escaped = escapeRegExp(term);
  const pipeline = [
    {
      $match: {
        title: { $regex: `.*${escaped}.*`, $options: 'i' },
      },
    },
    {
      $addFields: {
        __score: {
          $cond: [
            { $regexMatch: { input: { $toLower: '$title' }, regex: `^${escaped}`, options: 'i' } },
            2,
            1,
          ],
        },
      },
    },
    {
      $sort: { __score: -1, title: 1, _id: 1 },
    },
  ];
  if (options.limit) {
    pipeline.push({ $limit: options.limit });
  }
  pipeline.push({
    $project: options.fields || { _id: 1, title: 1 },
  });
  return pipeline;
}

async function searchMovies(query, options = {}) {
  const term = normalizeQuery(query);
  if (term.length === 0) {
    return [];
  }
  const collection = moviesCollection();
  return collection.aggregate(buildPipeline(term, options)).toArray();
}

module.exports = { searchMovies, normalizeQuery, escapeRegExp, buildPipeline };