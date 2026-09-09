'use strict';

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const button = document.getElementById('search-button');
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('results');

const DEBOUNCE_MS = 250;

let requestToken = 0;
let debounceTimer = null;

function placeholderPoster() {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">' +
    '<rect width="100%" height="100%" fill="#2b2f36"/>' +
    '<text x="150" y="210" font-family="sans-serif" font-size="24" fill="#9aa2ad" text-anchor="middle">Sin poster</text>' +
    '</svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function loadingStatus(term) {
  gridEl.innerHTML = '';
  setStatus(`Buscando «${term}»…`);
}

function search() {
  const term = input.value.trim();
  const token = ++requestToken;

  if (!term) {
    gridEl.innerHTML = '';
    setStatus('Escribí un término para buscar.');
    return;
  }

  loadingStatus(term);

  fetch(`/api/search?q=${encodeURIComponent(term)}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (token !== requestToken) return;
      const results = data.results || [];
      if (results.length === 0) {
        setStatus(`Sin resultados para «${term}».`);
        return;
      }
      setStatus(`${results.length} resultado(s) para «${term}».`);
      renderResults(results);
    })
    .catch((err) => {
      if (token !== requestToken) return;
      setStatus('No se pudo completar la búsqueda.');
      console.error(err);
    });
}

function renderResults(results) {
  const fragment = document.createDocumentFragment();

  for (const movie of results) {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'card-poster';
    img.alt = movie.title;
    img.loading = 'lazy';
    if (movie.poster) {
      img.src = movie.poster;
      img.addEventListener('error', () => {
        img.src = placeholderPoster();
      }, { once: true });
    } else {
      img.src = placeholderPoster();
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = movie.title;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = movie.year ? String(movie.year) : '—';

    const genres = document.createElement('div');
    genres.className = 'card-genres';
    genres.textContent = (movie.genres || []).join(' · ') || '—';

    body.append(title, meta, genres);
    card.append(img, body);
    fragment.append(card);
  }

  gridEl.innerHTML = '';
  gridEl.append(fragment);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(debounceTimer);
  search();
});

input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, DEBOUNCE_MS);
});

input.focus();