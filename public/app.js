'use strict';

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const button = document.getElementById('search-button');
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('results');
const resultCountEl = document.getElementById('result-count');

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

function setResultCount(count) {
  resultCountEl.textContent = `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
  resultCountEl.classList.toggle('hidden', count === 0);
}

function loadingStatus(term) {
  gridEl.innerHTML = '';
  setResultCount(0);
  setStatus(`Buscando «${term}»…`);
}

function search() {
  const term = input.value.trim();
  const token = ++requestToken;

  if (!term) {
    gridEl.innerHTML = '';
    setResultCount(0);
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
        setResultCount(0);
        setStatus(`Sin resultados para «${term}».`);
        gridEl.innerHTML = `
          <div class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center">
            <span class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-slate-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4M8 8l6 6M14 8l-6 6"></path></svg>
            </span>
            <h2 class="text-base font-medium text-slate-300">No encontramos esa película</h2>
            <p class="mt-2 text-sm text-slate-500">Probá con otro título o una palabra más corta.</p>
          </div>`;
        return;
      }
      setResultCount(results.length);
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
    card.className = 'group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]';

    const img = document.createElement('img');
    img.className = 'aspect-[2/3] w-full bg-slate-900 object-cover transition duration-300 group-hover:scale-[1.03]';
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
    body.className = 'flex min-h-[112px] flex-1 flex-col gap-2 p-4';

    const title = document.createElement('h2');
    title.className = 'line-clamp-2 text-sm font-medium leading-5 text-slate-200';
    title.textContent = movie.title;

    const meta = document.createElement('div');
    meta.className = 'text-xs font-semibold text-violet-300';
    meta.textContent = movie.year ? String(movie.year) : '—';

    const genres = document.createElement('div');
    genres.className = 'mt-auto line-clamp-2 text-xs leading-4 text-slate-500';
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