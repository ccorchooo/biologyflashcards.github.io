'use strict';

// Downloaded, credited images are local assets; the portable build embeds them.
const DiagramLibrary = (() => {
  const data = DIAGRAM_LIBRARY_DATA;
  const unitIds = [...new Set(data.map(item => item.unit))].sort((a,b) => a-b);
  const el = selector => document.querySelector(selector);
  const count = id => data.filter(item => item.unit === id).length;
  let selection = 9;
  let initialized = false;
  let zoom = 1;
  let opener = null;

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function link(text, href) {
    const a = node('a', '', text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }

  function credit(item) {
    const box = node('div', 'diagram-credit');
    box.append(node('p', '', `${item.author} · ${item.sourceTitle}`));
    const links = node('p', 'diagram-credit-links');
    links.append(link('Image source ↗', item.source));
    links.append(link(item.license, item.licenseUrl));
    box.append(links, node('p', 'diagram-changes', item.changes));
    return box;
  }

  function setZoom(next) {
    zoom = Math.max(1, Math.min(4, next));
    el('#viewer-image').style.width = `${zoom * 100}%`;
    el('#viewer-scale').textContent = zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`;
    el('#viewer-minus').disabled = zoom === 1;
    el('#viewer-plus').disabled = zoom === 4;
    if (zoom === 1) el('#viewer-viewport').scrollTo(0, 0);
  }

  function open(item, button) {
    opener = button;
    el('#viewer-title').textContent = item.title;
    el('#viewer-unit').textContent = `Unit ${String(item.unit).padStart(2, '0')}`;
    el('#viewer-image').src = item.image;
    el('#viewer-image').alt = item.alt;
    el('#viewer-download').href = item.image;
    el('#viewer-download').download = item.imageName;
    el('#viewer-credit').replaceChildren(credit(item));
    setZoom(1);
    el('#diagram-viewer').showModal();
    el('#viewer-viewport').scrollTo(0, 0);
  }

  function close() {
    const dialog = el('#diagram-viewer');
    if (dialog.open) dialog.close();
  }

  function card(item) {
    const article = node('article', 'diagram-card');
    article.id = `diagram-${item.id}`;
    article.setAttribute('aria-labelledby', `${item.id}-diagram-title`);
    const visual = node('figure', 'diagram-figure');
    const button = node('button', 'diagram-image-button');
    button.type = 'button';
    button.setAttribute('aria-label', `Enlarge diagram: ${item.title}`);
    button.setAttribute('aria-haspopup', 'dialog');
    const img = node('img', 'diagram-image');
    img.src = item.image; img.alt = item.alt; img.decoding = 'async';
    img.width = item.width; img.height = item.height;
    button.append(img, node('span', 'diagram-enlarge', 'Enlarge diagram ↗'));
    button.addEventListener('click', () => open(item, button));
    const caption = node('figcaption', 'diagram-caption', item.caption);
    visual.append(button, caption);
    const info = node('div', 'diagram-info');
    const title = node('h3', '', item.title);
    title.id = `${item.id}-diagram-title`;
    info.append(title, node('p', 'diagram-summary', item.summary));
    const focus = node('div', 'diagram-focus');
    focus.append(node('h4', '', 'Focus on'));
    const labels = node('ul', 'diagram-labels');
    for (const label of item.focus) labels.append(node('li', '', label));
    focus.append(labels);
    const recall = node('div', 'diagram-recall');
    recall.append(node('h4', '', 'Try explaining'), node('p', '', item.prompt));
    info.append(focus, recall, node('p', 'diagram-scope', item.scope), credit(item));
    article.append(visual, info);
    return article;
  }

  function init() {
    if (initialized) return;
    initialized = true;
    GraphLibrary.init();
    const all = node('option', '', 'All diagram units'); all.value = 'all';
    el('#diagram-unit-select').append(all);
    for (const id of unitIds) {
      const meta = UNIT_META.find(unit => unit.id === id);
      const option = node('option', '', `${String(id).padStart(2,'0')} · ${meta.title} (${count(id)})`);
      option.value = id; el('#diagram-unit-select').append(option);
    }
    el('#diagram-unit-select').addEventListener('change', event => { location.hash = `diagrams-${event.target.value}`; });
    el('#diagram-prev').addEventListener('click', () => { location.hash = `diagrams-${unitIds[unitIds.indexOf(selection)-1]}`; });
    el('#diagram-next').addEventListener('click', () => { location.hash = `diagrams-${unitIds[unitIds.indexOf(selection)+1]}`; });
    el('#viewer-close').addEventListener('click', close);
    el('#viewer-minus').addEventListener('click', () => setZoom(zoom-0.5));
    el('#viewer-plus').addEventListener('click', () => setZoom(zoom+0.5));
    el('#viewer-fit').addEventListener('click', () => setZoom(1));
    const dialog = el('#diagram-viewer');
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
  }

  function render(next) {
    init();
    if (next === 'all') selection = 'all';
    else if (unitIds.includes(Number(next))) selection = Number(next);
    const selectedIds = selection === 'all' ? unitIds : [selection];
    el('#diagram-unit-select').value = String(selection);
    el('#diagram-unit-count').textContent = selection === 'all' ? `${data.length} diagrams across ${unitIds.length} units` : `${count(selection)} ${count(selection) === 1 ? 'diagram' : 'diagrams'} in this unit`;
    const content = el('#diagrams-content'); content.replaceChildren();
    for (const id of selectedIds) {
      const meta = UNIT_META.find(unit => unit.id === id);
      const section = node('section', 'diagram-unit-section');
      section.setAttribute('aria-labelledby', `diagram-unit-title-${id}`);
      const header = node('div', 'graph-unit-heading');
      const heading = node('div');
      heading.append(node('p', 'course-label', `Unit ${String(id).padStart(2,'0')}`));
      const h2 = node('h2', '', meta.title); h2.id = `diagram-unit-title-${id}`; heading.append(h2);
      const study = node('a', 'back-link', 'Study flashcards →'); study.href = `#unit-${id}`;
      header.append(heading, study); section.append(header);
      for (const item of data.filter(item => item.unit === id)) section.append(card(item));
      content.append(section);
    }
    const index = unitIds.indexOf(selection);
    el('#diagram-prev').disabled = selection === 'all' || index === 0;
    el('#diagram-next').disabled = selection === 'all' || index === unitIds.length-1;
  }

  return {render, close, has: id => unitIds.includes(id), count, total: data.length};
})();
