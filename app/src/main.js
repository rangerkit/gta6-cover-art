// Wires Vice Poster Studio: photo tray, layout and grade pickers, caption inputs, panel
// cropping by drag and zoom, and PNG export at the three post sizes. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).
import { drawCover } from './cover.js';
import { LAYOUTS, pointInPanel } from './layouts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const sizeSelect = document.getElementById('size');
const statusEl = document.getElementById('status');
const trayEl = document.getElementById('tray');
const zoomInput = document.getElementById('zoom');
const panelLabel = document.getElementById('panel-label');

const SIZES = { '1920x1080': [1920, 1080], '1080x1080': [1080, 1080], '1080x1350': [1080, 1350] };

const state = {
  layout: 'five',
  grade: 'sunset',
  caption: captionInput.value,
  subtitle: '',
  panels: [],
};

let photos = []; // { name, img }
let selectedPanel = 0;
let selectedPhoto = 0;

/** Rebuilds state.panels for the current layout, keeping crops where a panel survives. */
function resetPanels(keep) {
  const count = LAYOUTS[state.layout](1, 1).length;
  const next = [];
  for (let i = 0; i < count; i++) {
    next.push(keep && state.panels[i] ? state.panels[i] : { photo: null, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels = next;
  if (selectedPanel >= count) selectedPanel = 0;
}

function previewSize() {
  const [w, h] = SIZES[sizeSelect.value];
  const scale = 960 / w;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  panelLabel.textContent = String(selectedPanel + 1);
  const crop = state.panels[selectedPanel];
  if (crop) zoomInput.value = String(crop.zoom || 1);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function renderTray() {
  trayEl.innerHTML = '';
  if (photos.length === 0) {
    const span = document.createElement('span');
    span.className = 'empty';
    span.textContent = 'No photos yet — the two samples are loaded below.';
    trayEl.appendChild(span);
    return;
  }
  photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.img.src;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (i === selectedPhoto) thumb.classList.add('selected');
    thumb.addEventListener('click', () => {
      selectedPhoto = i;
      assignPhoto(i, selectedPanel);
      renderTray();
    });
    trayEl.appendChild(thumb);
  });
}

function assignPhoto(photoIndex, panelIndex) {
  const crop = state.panels[panelIndex];
  if (!crop) return;
  crop.photo = photos[photoIndex];
  crop.zoom = 1;
  crop.ox = 0;
  crop.oy = 0;
  redraw();
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    photos.push({ name: file.name, img });
  }
  if (photos.length > 0) {
    selectedPhoto = photos.length - 1;
    if (!state.panels[selectedPanel]?.photo) assignPhoto(selectedPhoto, selectedPanel);
  }
  renderTray();
  redraw();
}

document.getElementById('photo-input').addEventListener('change', (e) => {
  addFiles([...e.target.files]);
  e.target.value = '';
});
document.getElementById('fill-all').addEventListener('click', () => {
  if (photos.length === 0) return;
  const photo = photos[selectedPhoto];
  for (const crop of state.panels) {
    crop.photo = photo;
    crop.zoom = 1;
    crop.ox = 0;
    crop.oy = 0;
  }
  redraw();
  statusEl.textContent = 'One photo now fills every panel.';
});

document.getElementById('layouts').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.layout = btn.dataset.layout;
  resetPanels(true);
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  document.querySelectorAll('#grades button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.grade = btn.dataset.grade;
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
sizeSelect.addEventListener('change', redraw);
zoomInput.addEventListener('input', () => {
  const crop = state.panels[selectedPanel];
  if (!crop) return;
  crop.zoom = Number(zoomInput.value);
  redraw();
});

// Panel picking and cropping on the preview: click selects, drag pans, wheel zooms.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const panels = LAYOUTS[state.layout](canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPanel(panels[i], p.x, p.y)) {
      selectedPanel = i;
      drag = { start: p, moved: false };
      canvas.setPointerCapture(e.pointerId);
      redraw();
      break;
    }
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const crop = state.panels[selectedPanel];
  if (!crop || !crop.photo) return;
  const dx = (p.x - drag.start.x) / canvas.width;
  const dy = (p.y - drag.start.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  crop.ox = (crop.ox || 0) + dx;
  crop.oy = (crop.oy || 0) + dy;
  drag.start = p;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const crop = state.panels[selectedPanel];
  if (!crop || !crop.photo) return;
  crop.zoom = Math.min(3, Math.max(1, (crop.zoom || 1) * (e.deltaY < 0 ? 1.1 : 0.9)));
  redraw();
}, { passive: false });

/** Renders the cover at full export size and resolves with its PNG blob. */
export function exportCover() {
  const [w, h] = SIZES[sizeSelect.value];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

/** Same export as a data URL, for the headless screenshot driver. */
window.__exportCover = async () => {
  const blob = await exportCover();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

document.getElementById('export').addEventListener('click', async () => {
  const [w, h] = SIZES[sizeSelect.value];
  const blob = await exportCover();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-poster-${w}x${h}.png`;
  a.click();
  statusEl.textContent = `Saved vice-poster-${w}x${h}.png`;
});

/** Applies a fixed scene (layout, grade, caption, photos) from the ?shot= driver. */
function applyScene(scene) {
  if (scene.layout) state.layout = scene.layout;
  if (scene.grade) state.grade = scene.grade;
  if (scene.caption !== undefined) { state.caption = scene.caption; captionInput.value = scene.caption; }
  if (scene.subtitle !== undefined) { state.subtitle = scene.subtitle; subtitleInput.value = scene.subtitle; }
  if (scene.size) sizeSelect.value = scene.size;
  resetPanels(false);
  const order = scene.photos || [];
  state.panels.forEach((crop, i) => {
    const pick = order.length ? order[i % order.length] : i;
    const photo = photos[pick % photos.length];
    if (photo) crop.photo = photo;
  });
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  redraw();
}

// Published for the ?shot= driver in shots.js (which imports nothing from this module).
window.__applyScene = applyScene;

const shot = new URLSearchParams(location.search).get('shot');
(async () => {
  resetPanels(false);
  const boulevard = await loadImage('samples/boulevard.jpg');
  const pier = await loadImage('samples/pier.jpg');
  photos = [{ name: 'boulevard.jpg', img: boulevard }, { name: 'pier.jpg', img: pier }];
  state.panels.forEach((crop, i) => { crop.photo = photos[i % photos.length]; });
  renderTray();
  redraw();
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search));
  }
})();
