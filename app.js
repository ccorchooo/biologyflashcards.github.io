'use strict';

// No build framework, network requests, account or backend required.
const UNITS = UNIT_META.map(unit => ({
  ...unit,
  cards: CARD_CONTENT[unit.id].map(([question, answer], index) => ({
    id: `u${unit.id}-c${index + 1}`, question, answer
  }))
}));
const STORAGE_KEY = 'biology-recalled-v1';
const APP_ID = 'biology-recalled';
const ALL_CARD_IDS = new Set(UNITS.flatMap(unit => unit.cards.map(card => card.id)));
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let progress = emptyProgress();
let activeUnit = null;
let deck = [];
let position = 0;
let answerVisible = false;
let reviewOnly = false;
let spinning = false;
let flipMidpoint = null;
let flipFallback = null;
let toastTimer = null;
let currentFilter = 'all';

function emptyProgress() {
  return { completed: [], known: [], seen: [], positions: {}, lastUnit: 1, theme: 'system' };
}

function validateBackup(payload) {
  if (!payload || typeof payload !== 'object' || payload.app !== APP_ID || payload.version !== 1 || !payload.progress) {
    throw new Error('Choose a progress file downloaded from Biology, recalled.');
  }
  const p = payload.progress;
  if (!Array.isArray(p.completed) || !Array.isArray(p.known) || !Array.isArray(p.seen) || !p.positions || typeof p.positions !== 'object' || Array.isArray(p.positions)) {
    throw new Error('This progress file is incomplete. Your current progress has been kept.');
  }
  const validUnit = value => Number.isInteger(value) && value >= 1 && value <= UNITS.length;
  const uniqueCards = items => [...new Set(items.filter(id => typeof id === 'string' && ALL_CARD_IDS.has(id)))];
  const positions = {};
  for (const unit of UNITS) {
    const cardId = p.positions[unit.id];
    if (unit.cards.some(card => card.id === cardId)) positions[unit.id] = cardId;
  }
  const known = uniqueCards(p.known);
  return {
    completed: [...new Set(p.completed.filter(validUnit))],
    known,
    seen: [...new Set([...uniqueCards(p.seen), ...known])],
    positions,
    lastUnit: validUnit(p.lastUnit) ? p.lastUnit : 1,
    theme: ['light', 'dark', 'system'].includes(p.theme) ? p.theme : 'system'
  };
}

function storageWarning(message) {
  $('#save-warning').textContent = message;
  $('#save-warning').hidden = false;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) progress = validateBackup(JSON.parse(raw));
  } catch (_) {
    storageWarning('Saved progress could not be read. You can still study; restore a downloaded progress file if you have one.');
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ app: APP_ID, version: 1, progress }));
    return true;
  } catch (_) {
    storageWarning('Changes cannot be saved in this browser. Download your progress before leaving this page.');
    return false;
  }
}

function setMembership(key, value, include) {
  const values = new Set(progress[key]);
  if (include) values.add(value); else values.delete(value);
  progress[key] = [...values];
}

function knownIn(unit) {
  const known = new Set(progress.known);
  return unit.cards.filter(card => known.has(card.id)).length;
}

function seenIn(unit) {
  const seen = new Set(progress.seen);
  return unit.cards.some(card => seen.has(card.id));
}

function applyTheme() {
  const theme = progress.theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : progress.theme;
  document.documentElement.dataset.theme = theme;
  $$('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#11151c' : '#f5f6f8';
}

function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderDashboard() {
  const completed = progress.completed.length;
  $('#completed-count').textContent = completed;
  $('#unit-ring').setAttribute('aria-label', `${completed} of ${UNITS.length} units complete`);
  $('#ring-value').style.strokeDashoffset = 100 - completed / UNITS.length * 100;
  $('#known-count').textContent = progress.known.length;
  $('#total-count').textContent = ALL_CARD_IDS.size;
  $('#continue').innerHTML = `${progress.seen.length || completed ? 'Continue studying' : 'Start studying'} <span aria-hidden="true">→</span>`;
  const query = $('#unit-search').value.trim().toLocaleLowerCase();
  const filtered = UNITS.filter(unit => {
    const complete = progress.completed.includes(unit.id);
    const filterMatch = currentFilter === 'all' || (currentFilter === 'completed' ? complete : !complete && seenIn(unit));
    const haystack = `${unit.id} ${unit.title} ${unit.cards.map(card => card.question + ' ' + card.answer).join(' ')}`.toLocaleLowerCase();
    return filterMatch && (!query || haystack.includes(query));
  });
  $('#unit-grid').replaceChildren();
  filtered.forEach((unit, index) => {
    const complete = progress.completed.includes(unit.id);
    const known = knownIn(unit);
    const article = make('article', `unit-tile${complete ? ' is-complete' : ''}`);
    article.style.setProperty('--i', Math.min(index, 8));
    const link = make('a', 'unit-link');
    link.href = `#unit-${unit.id}`;
    link.setAttribute('aria-label', `Study unit ${unit.id}: ${unit.title}, ${unit.cards.length} cards`);
    link.append(make('span', 'unit-number', String(unit.id).padStart(2, '0')));
    const title = make('span');
    title.append(make('span', 'unit-title', unit.title), make('span', 'unit-subtitle', `${unit.cards.length} flashcards`));
    link.append(title);
    const bottom = make('div', 'tile-bottom');
    bottom.append(make('span', '', `${known} / ${unit.cards.length} known`));
    if (GraphLibrary.has(unit.id)) {
      const graphLink = make('a', 'tile-graph-link', `${GraphLibrary.count(unit.id)} ${GraphLibrary.count(unit.id) === 1 ? 'graph' : 'graphs'} ↗`);
      graphLink.href = `#graphs-${unit.id}`;
      graphLink.setAttribute('aria-label', `View graphs for unit ${unit.id}`);
      bottom.append(graphLink);
    }
    if (DiagramLibrary.has(unit.id)) {
      const diagramLink = make('a', 'tile-graph-link', `${DiagramLibrary.count(unit.id)} ${DiagramLibrary.count(unit.id) === 1 ? 'diagram' : 'diagrams'} ↗`);
      diagramLink.href = `#diagrams-${unit.id}`;
      diagramLink.setAttribute('aria-label', `View diagrams for unit ${unit.id}`);
      bottom.append(diagramLink);
    }
    const label = make('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = complete;
    checkbox.dataset.completeUnit = unit.id;
    checkbox.setAttribute('aria-label', `Unit ${unit.id} complete`);
    label.append(checkbox, make('span', '', complete ? 'Completed' : 'Complete'));
    bottom.append(label);
    const bar = make('div', 'bar');
    bar.setAttribute('aria-hidden', 'true');
    const fill = make('span');
    fill.style.transform = `scaleX(${known / unit.cards.length})`;
    bar.append(fill);
    article.append(link, bottom, bar);
    $('#unit-grid').append(article);
  });
  $('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'unit' : 'units'}`;
  $('#no-results').hidden = filtered.length > 0;
  $('#no-results-text').textContent = query ? 'No matching topics. Try another search.' : currentFilter === 'completed' ? 'Mark a unit complete when you feel ready.' : 'Reveal a card to start a unit, then find it here.';
}

function markUnit(unitId, complete) {
  setMembership('completed', unitId, complete);
  saveProgress();
  if (activeUnit) {
    $('#study-complete').checked = progress.completed.includes(activeUnit.id);
    updateEnd();
  }
}

function cancelFlip() {
  clearTimeout(flipMidpoint);
  clearTimeout(flipFallback);
  $('#card-rotor').classList.remove('turning');
  spinning = false;
}

function renderStudyMeta() {
  const known = knownIn(activeUnit);
  $('#unit-known').textContent = `${known} of ${activeUnit.cards.length} cards known`;
  $('#study-bar').style.transform = `scaleX(${known / activeUnit.cards.length})`;
  $('#study-complete').checked = progress.completed.includes(activeUnit.id);
  $('#review-only').setAttribute('aria-pressed', String(reviewOnly));
  $('#review-only').textContent = reviewOnly ? 'Show all cards' : 'Review unknown';
  $('#card-position').textContent = position < deck.length ? `Card ${position + 1} of ${deck.length}` : `${deck.length} cards in this deck`;
}

function updateCardFace(contentNode, captionNode, text, isAnswer) {
  contentNode.textContent = text;
  contentNode.classList.toggle('answer', isAnswer);
  captionNode.textContent = isAnswer ? 'Answer' : 'Recall';
}

function renderCard() {
  cancelFlip();
  answerVisible = false;
  renderStudyMeta();
  const atEnd = position >= deck.length;
  $('#card-area').hidden = atEnd;
  $('#deck-end').hidden = !atEnd;
  if (atEnd) {
    updateEnd();
    renderIndex();
    return;
  }
  const card = deck[position];
  progress.positions[activeUnit.id] = card.id;
  saveProgress();
  updateCardFace($('#front-content'), $('#front-caption'), card.question, false);
  updateCardFace($('#back-content'), $('#back-caption'), card.answer, true);
  $('#front-cue').textContent = 'Tap to reveal';
  $('#flashcard').setAttribute('aria-pressed', 'false');
  $('#flashcard').setAttribute('aria-label', `Reveal answer. ${card.question}`);
  $('#reveal').hidden = false;
  $('#rating-controls').hidden = true;
  $('#previous').disabled = position === 0;
  $('#next').setAttribute('aria-label', position === deck.length - 1 ? 'Finish deck' : 'Next card');
  $('#shuffle').disabled = deck.length < 2;
  renderIndex();
}

function updateEnd() {
  if (!activeUnit) return;
  const known = knownIn(activeUnit);
  const allKnown = known === activeUnit.cards.length;
  $('#end-title').textContent = allKnown ? 'Every card is marked known.' : deck.length === 0 ? 'Nothing left in this review.' : 'A good place to pause.';
  $('#end-description').textContent = `${known} of ${activeUnit.cards.length} cards known. ${allKnown ? 'You can revisit the deck whenever you like.' : 'Revisit the cards you are still learning, or return to your units.'}`;
  $('#finish-unit').textContent = progress.completed.includes(activeUnit.id) ? 'Back to dashboard' : 'Mark unit complete';
}

function renderIndex() {
  $('#card-index').replaceChildren();
  activeUnit.cards.forEach((card, index) => {
    const li = make('li');
    const button = make('button');
    button.type = 'button';
    button.dataset.cardIndex = index;
    button.setAttribute('aria-current', String(position < deck.length && deck[position].id === card.id));
    button.append(make('span', 'index-status', progress.known.includes(card.id) ? '✓' : String(index + 1)), make('span', '', card.question));
    button.setAttribute('aria-label', `${progress.known.includes(card.id) ? 'Known. ' : ''}${card.question}`);
    li.append(button);
    $('#card-index').append(li);
  });
}

function setStudyUnit(unit) {
  activeUnit = unit;
  reviewOnly = false;
  deck = [...unit.cards];
  const savedIndex = deck.findIndex(card => card.id === progress.positions[unit.id]);
  position = Math.max(savedIndex, 0);
  progress.lastUnit = unit.id;
  $('#study-title').textContent = unit.title;
  $('#unit-number').textContent = `Unit ${String(unit.id).padStart(2, '0')}`;
  $('#source-link').href = unit.source;
  $('#study-graphs-link').hidden = !GraphLibrary.has(unit.id);
  $('#study-graphs-link').href = `#graphs-${unit.id}`;
  if (DiagramLibrary.has(unit.id)) {
    $('#study-graphs-link').hidden = false;
    $('#study-graphs-link').textContent = GraphLibrary.has(unit.id) ? 'Graphs & diagrams →' : 'Unit diagrams →';
    if (!GraphLibrary.has(unit.id)) $('#study-graphs-link').href = `#diagrams-${unit.id}`;
  } else $('#study-graphs-link').textContent = 'Unit graphs →';
  $('#unit-jump').value = String(unit.id);
  $('#card-index').hidden = true;
  $('#toggle-index').setAttribute('aria-expanded', 'false');
  $('#toggle-index').innerHTML = 'Browse cards <span aria-hidden="true">↓</span>';
  renderCard();
}

function route() {
  cancelFlip();
  DiagramLibrary.close();
  const graphMatch = location.hash.match(/^#graphs(?:-(all|\d+))?$/);
  const diagramMatch = location.hash.match(/^#diagrams(?:-(all|\d+))?$/);
  const visualMatch = graphMatch || diagramMatch;
  const match = location.hash.match(/^#unit-(\d+)$/);
  const unit = match ? UNITS.find(item => item.id === Number(match[1])) : null;
  $('#graphs').hidden = !visualMatch;
  $('#graph-panel').hidden = !graphMatch;
  $('#diagram-panel').hidden = !diagramMatch;
  $('#dashboard').hidden = Boolean(unit || visualMatch);
  $('#study').hidden = !unit;
  $('.overview-link').setAttribute('aria-current', unit || visualMatch ? 'false' : 'page');
  $('.graph-nav-link').setAttribute('aria-current', visualMatch ? 'page' : 'false');
  $('#show-graphs').setAttribute('aria-current', graphMatch ? 'page' : 'false');
  $('#show-diagrams').setAttribute('aria-current', diagramMatch ? 'page' : 'false');
  $('#show-diagrams').href = graphMatch && DiagramLibrary.has(Number(graphMatch[1])) ? `#diagrams-${graphMatch[1]}` : '#diagrams';
  $('#show-graphs').href = diagramMatch && GraphLibrary.has(Number(diagramMatch[1])) ? `#graphs-${diagramMatch[1]}` : '#graphs';
  document.title = visualMatch ? 'Graphs & diagrams | Biology, recalled.' : unit ? `${unit.id}. ${unit.title} | Biology, recalled.` : 'Biology, recalled.';
  if (graphMatch) { activeUnit = null; GraphLibrary.render(graphMatch[1]); }
  else if (diagramMatch) { activeUnit = null; DiagramLibrary.render(diagramMatch[1]); }
  else if (unit) setStudyUnit(unit);
  else { activeUnit = null; renderDashboard(); }
  $('#main').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function flipCard() {
  if (!activeUnit || position >= deck.length || spinning) return;
  const card = deck[position];
  const targetAnswer = !answerVisible;
  const targetText = targetAnswer ? card.answer : card.question;
  if (targetAnswer) {
    setMembership('seen', card.id, true);
    saveProgress();
  }
  function midpoint() {
    updateCardFace($('#front-content'), $('#front-caption'), targetText, targetAnswer);
    $('#front-cue').textContent = targetAnswer ? 'Tap to return to the question' : 'Tap to reveal';
  }
  function finish() {
    midpoint();
    answerVisible = targetAnswer;
    cancelFlip();
    $('#flashcard').setAttribute('aria-pressed', String(answerVisible));
    $('#flashcard').setAttribute('aria-label', `${answerVisible ? 'Show question' : 'Reveal answer'}. ${targetText}`);
    $('#reveal').hidden = answerVisible;
    $('#rating-controls').hidden = !answerVisible;
    if (answerVisible) $('#card-announcement').textContent = `Answer: ${card.answer}`;
  }
  updateCardFace($('#back-content'), $('#back-caption'), targetText, targetAnswer);
  if (reducedMotion.matches) { finish(); return; }
  spinning = true;
  // The hidden front face changes halfway through a complete CSS 360° turn.
  $('#card-rotor').classList.add('turning');
  flipMidpoint = setTimeout(midpoint, 360);
  flipFallback = setTimeout(finish, 760);
}

function moveCard(direction) {
  if (!activeUnit) return;
  const next = Math.max(0, Math.min(deck.length, position + direction));
  if (next === position) return;
  position = next;
  renderCard();
  if (position >= deck.length) $('#end-title').setAttribute('tabindex', '-1');
  if (position >= deck.length) $('#end-title').focus({ preventScroll: true });
}

function rateCard(known) {
  if (!answerVisible || spinning || position >= deck.length) return;
  const card = deck[position];
  setMembership('known', card.id, known);
  setMembership('seen', card.id, true);
  saveProgress();
  moveCard(1);
  if (position < deck.length) $('#flashcard').focus({ preventScroll: true });
}

function shuffleDeck() {
  if (deck.length < 2) return;
  cancelFlip();
  for (let i = deck.length - 1; i > 0; i--) {
    const sample = new Uint32Array(1);
    crypto.getRandomValues(sample);
    const j = Math.floor(sample[0] / 4294967296 * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  position = 0;
  renderCard();
  notify('Deck shuffled. Your progress is kept.');
}

function downloadProgress() {
  const payload = { app: APP_ID, version: 1, savedAt: new Date().toISOString(), progress };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = make('a');
  link.href = url;
  link.download = `biology-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#backup-message').textContent = 'Progress download ready.';
}

async function restoreProgress(file) {
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('This file is too large to be a progress backup.');
    const nextProgress = validateBackup(JSON.parse(await file.text()));
    cancelFlip();
    progress = nextProgress;
    saveProgress();
    applyTheme();
    route();
    $('#backup-message').textContent = 'Progress restored.';
    notify('Your progress has been restored.');
  } catch (error) {
    $('#backup-message').textContent = error instanceof SyntaxError ? 'This is not a valid JSON progress file. Your current progress has been kept.' : error.message;
  } finally {
    $('#import-file').value = '';
  }
}

loadProgress();
applyTheme();
UNITS.forEach(unit => {
  const option = make('option', '', `${String(unit.id).padStart(2, '0')} · ${unit.title}`);
  option.value = unit.id;
  $('#unit-jump').append(option);
});
$$('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
  progress.theme = button.dataset.themeChoice;
  applyTheme();
  saveProgress();
}));
systemTheme.addEventListener('change', () => { if (progress.theme === 'system') applyTheme(); });
reducedMotion.addEventListener('change', () => { if (spinning) renderCard(); });
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderDashboard();
}));
$('#unit-search').addEventListener('input', renderDashboard);
$('#clear-filters').addEventListener('click', () => {
  $('#unit-search').value = '';
  currentFilter = 'all';
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
  renderDashboard();
  $('#unit-search').focus();
});
$('#unit-grid').addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('[data-complete-unit]')) return;
  const unitId = Number(input.dataset.completeUnit);
  markUnit(unitId, input.checked);
  renderDashboard();
  const focusTarget = $(`[data-complete-unit="${unitId}"]`) || $(`[data-filter="${currentFilter}"]`);
  focusTarget?.focus({ preventScroll: true });
});
$('#continue').addEventListener('click', () => { location.hash = `unit-${progress.lastUnit}`; });
$('#unit-jump').addEventListener('change', event => { location.hash = `unit-${event.target.value}`; });
$('#study-complete').addEventListener('change', event => { markUnit(activeUnit.id, event.target.checked); });
$('#flashcard').addEventListener('click', flipCard);
$('#reveal').addEventListener('click', () => { flipCard(); $('#flashcard').focus({ preventScroll: true }); });
$('#previous').addEventListener('click', () => moveCard(-1));
$('#next').addEventListener('click', () => moveCard(1));
$('#again').addEventListener('click', () => rateCard(false));
$('#got-it').addEventListener('click', () => rateCard(true));
$('#shuffle').addEventListener('click', shuffleDeck);
$('#review-only').addEventListener('click', () => {
  reviewOnly = !reviewOnly;
  deck = activeUnit.cards.filter(card => !reviewOnly || !progress.known.includes(card.id));
  position = 0;
  renderCard();
});
$('#restart').addEventListener('click', () => {
  reviewOnly = false;
  deck = [...activeUnit.cards];
  position = 0;
  renderCard();
  $('#flashcard').focus({ preventScroll: true });
});
$('#finish-unit').addEventListener('click', () => {
  const unit = activeUnit;
  if (!progress.completed.includes(unit.id)) {
    markUnit(unit.id, true);
    const next = UNITS.find(item => !progress.completed.includes(item.id));
    if (next) { progress.lastUnit = next.id; saveProgress(); }
    notify(`Unit ${unit.id} marked complete.`);
  }
  location.hash = 'dashboard';
});
$('#toggle-index').addEventListener('click', () => {
  const open = $('#card-index').hidden;
  $('#card-index').hidden = !open;
  $('#toggle-index').setAttribute('aria-expanded', String(open));
  $('#toggle-index').innerHTML = `${open ? 'Hide cards' : 'Browse cards'} <span aria-hidden="true">${open ? '↑' : '↓'}</span>`;
});
$('#card-index').addEventListener('click', event => {
  const button = event.target.closest('[data-card-index]');
  if (!button) return;
  const card = activeUnit.cards[Number(button.dataset.cardIndex)];
  if (!deck.some(item => item.id === card.id)) { reviewOnly = false; deck = [...activeUnit.cards]; }
  position = deck.findIndex(item => item.id === card.id);
  renderCard();
  $('#flashcard').focus({ preventScroll: true });
  $('#flashcard').scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
$('#export').addEventListener('click', downloadProgress);
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#main').focus();
  window.scrollTo({ top: 0, behavior: 'instant' });
});
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', event => restoreProgress(event.target.files[0]));
window.addEventListener('hashchange', route);
document.addEventListener('keydown', event => {
  if (!activeUnit || event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input, select, textarea') || event.target.isContentEditable) return;
  if (event.key === 'Escape') { event.preventDefault(); location.hash = 'dashboard'; }
  if (position >= deck.length) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); moveCard(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveCard(-1); }
  if ((event.key === ' ' || event.key === 'Enter') && !event.target.closest('button, a')) { event.preventDefault(); flipCard(); }
  if (event.key === '1') { event.preventDefault(); rateCard(false); }
  if (event.key === '2') { event.preventDefault(); rateCard(true); }
});
route();
