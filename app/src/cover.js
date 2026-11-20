// Renders a Vice Poster Studio cover onto a canvas 2D context at the canvas's own size.
// The whole poster — panels, colour grade, caption band — is drawn here, so the live preview
// and the exported PNG are the same picture at different sizes.
import { LAYOUTS, panelBounds } from './layouts.js';

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon',
  dusk: 'Dusk',
};

/** A tiny seeded generator, so the grain is identical on every render of a cover. */
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Draws one photo cover-fitted inside a panel quad, honouring zoom and pan. */
function drawPanelPhoto(ctx, photo, panel, crop) {
  const b = panelBounds(panel);
  const img = photo.img;
  const base = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight);
  const scale = base * (crop.zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = b.x + b.w / 2 + (crop.ox || 0) * b.w;
  const cy = b.y + b.h / 2 + (crop.oy || 0) * b.h;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(panel[0][0], panel[0][1]);
  for (let i = 1; i < panel.length; i++) ctx.lineTo(panel[i][0], panel[i][1]);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** The colour grade: warm sunset, teal-pink neon, or deep dusk, plus vignette and grain. */
function applyGrade(ctx, w, h, grade) {
  const overlays = {
    sunset: [
      ['overlay', 'rgba(255, 110, 45, 0.16)'],
      ['soft-light', 'rgba(255, 60, 140, 0.20)'],
    ],
    neon: [
      ['overlay', 'rgba(255, 0, 130, 0.16)'],
      ['soft-light', 'rgba(0, 220, 255, 0.16)'],
      ['overlay', 'rgba(255, 180, 40, 0.08)'],
    ],
    dusk: [
      ['overlay', 'rgba(70, 45, 170, 0.22)'],
      ['soft-light', 'rgba(10, 10, 40, 0.18)'],
    ],
  }[grade] || [];
  for (const [mode, colour] of overlays) {
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  // A warm wash rising from the foot, the poster's sunset.
  const wash = ctx.createLinearGradient(0, h * 0.55, 0, h);
  wash.addColorStop(0, 'rgba(255, 120, 60, 0)');
  wash.addColorStop(1, grade === 'neon' ? 'rgba(255, 40, 130, 0.22)' : 'rgba(255, 90, 40, 0.20)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  // Vignette.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(15, 5, 30, 0)');
  vig.addColorStop(1, grade === 'dusk' ? 'rgba(10, 5, 30, 0.5)' : 'rgba(15, 5, 30, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  // Grain, seeded so two renders of the same cover match byte for byte.
  const rnd = makeRandom(20261119);
  const dots = Math.floor((w * h) / 900);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  }
  ctx.restore();
}

/** The caption band: a dark foot band, a gradient rule, bold poster lettering, optional subtitle. */
function drawCaption(ctx, w, h, caption, subtitle) {
  const bandH = h * 0.17;
  const y0 = h - bandH;
  const bg = ctx.createLinearGradient(0, y0, 0, h);
  bg.addColorStop(0, 'rgba(12, 6, 20, 0)');
  bg.addColorStop(0.35, 'rgba(12, 6, 20, 0.82)');
  bg.addColorStop(1, 'rgba(12, 6, 20, 0.94)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, y0, w, h);
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, '#ff7a3c');
  rule.addColorStop(0.5, '#ff2e88');
  rule.addColorStop(1, '#22d3ee');
  ctx.fillStyle = rule;
  ctx.fillRect(0, y0, w, Math.max(3, h * 0.006));

  const text = (caption || '').trim().toUpperCase();
  if (!text) return;
  let size = h * 0.115;
  const font = (s) => `900 ${s}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeStyle = 'rgba(20, 5, 25, 0.9)';
  const fill = ctx.createLinearGradient(0, y0 + bandH * 0.18, 0, y0 + bandH * 0.85);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(1, '#ffd9a0');
  const cy = y0 + bandH * (subtitle ? 0.42 : 0.52);
  ctx.shadowColor = 'rgba(255, 46, 136, 0.45)';
  ctx.shadowBlur = size * 0.25;
  ctx.strokeText(text, w / 2, cy);
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, cy);
  ctx.shadowBlur = 0;

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    let subSize = h * 0.032;
    ctx.font = `700 ${subSize}px 'Arial Black', Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.18)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(sub).width > w * 0.86 && subSize > 10) {
      subSize -= 1;
      ctx.font = `700 ${subSize}px 'Arial Black', Arial, sans-serif`;
    }
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(sub, w / 2, y0 + bandH * 0.8);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the whole cover. `state` holds layout, grade, caption, subtitle and one crop per
 * panel: { photo: <image|null>, zoom, ox, oy }. `photos` is unused here; kept for clarity.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#140a1e';
  ctx.fillRect(0, 0, w, h);

  const panels = LAYOUTS[state.layout](w, h);
  panels.forEach((panel, i) => {
    const crop = state.panels[i] || {};
    if (crop.photo) {
      drawPanelPhoto(ctx, crop.photo, panel, crop);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(panel[0][0], panel[0][1]);
      for (let j = 1; j < panel.length; j++) ctx.lineTo(panel[j][0], panel[j][1]);
      ctx.closePath();
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#3a1c4d');
      g.addColorStop(1, '#1c0f2a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  });

  // White gutters between the panels, the poster's comic-book seams.
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.lineJoin = 'round';
  for (const panel of panels) {
    ctx.beginPath();
    ctx.moveTo(panel[0][0], panel[0][1]);
    for (let i = 1; i < panel.length; i++) ctx.lineTo(panel[i][0], panel[i][1]);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  applyGrade(ctx, w, h, state.grade);
  drawCaption(ctx, w, h, state.caption, state.subtitle);
}
