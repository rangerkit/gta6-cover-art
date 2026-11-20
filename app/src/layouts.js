// Poster panel layouts for Vice Poster Studio. Each layout is a function of the cover's
// width and height returning an array of panels; a panel is a quad (four [x, y] corners,
// clockwise from the top-left) so dividers can slant like a comic-book poster.

/** The slanted hero divider on the left edge of a panel's right side. */
function quad(x0, y0, x1, y1, slant = 0) {
  return [[x0, y0], [x1, y0], [x1 + slant, y1], [x0, y1]];
}

export const LAYOUTS = {
  // Five panels: a big hero on the left, a top strip and a split middle and foot on the right.
  // The hero's right edge slants from split+s at the top to split-s at the bottom, so every
  // neighbouring panel's left edge follows the same line: x(y) = split + s * (1 - 2y/h).
  five(w, h) {
    const s = w * 0.04; // how far the hero's right edge slants inward by the bottom
    const split = 0.52 * w;
    const edge = (y) => split + s * (1 - (2 * y) / h);
    return [
      [[0, 0], [split + s, 0], [split - s, h], [0, h]],
      [[split + s, 0], [w, 0], [w, 0.36 * h], [edge(0.36 * h), 0.36 * h]],
      [[edge(0.36 * h), 0.36 * h], [0.75 * w, 0.36 * h], [0.75 * w, 0.68 * h], [edge(0.68 * h), 0.68 * h]],
      [[0.75 * w, 0.36 * h], [w, 0.36 * h], [w, 0.68 * h], [0.75 * w, 0.68 * h]],
      [[edge(0.68 * h), 0.68 * h], [w, 0.68 * h], [w, h], [split - s, h]],
    ];
  },
  // Three tall strips with slanted dividers.
  three(w, h) {
    const s = w * 0.03;
    return [
      [[0, 0], [0.36 * w, 0], [0.32 * w, h], [0, h]],
      [[0.36 * w, 0], [0.68 * w, 0], [0.64 * w, h], [0.32 * w, h]],
      [[0.68 * w, 0], [w, 0], [w, h], [0.64 * w, h]],
    ];
  },
  // Two panels, one wide, one narrow, split by a slant.
  duo(w, h) {
    const s = w * 0.035;
    return [
      [[0, 0], [0.62 * w, 0], [0.58 * w, h], [0, h]],
      [[0.62 * w, 0], [w, 0], [w, h], [0.58 * w, h]],
    ];
  },
  // One full-bleed photo.
  hero(w, h) {
    return [[[0, 0], [w, 0], [w, h], [0, h]]];
  },
};

/** Human-readable names for the layout picker. */
export const LAYOUT_NAMES = { five: 'Vice Five', three: 'Three Up', duo: 'Duo', hero: 'Hero' };

/** Bounding box of a quad, used for cover-fitting a photo inside it. */
export function panelBounds(panel) {
  const xs = panel.map((p) => p[0]);
  const ys = panel.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** True when point (x, y) falls inside the quad (convex panels only). */
export function pointInPanel(panel, x, y) {
  let inside = false;
  for (let i = 0, j = panel.length - 1; i < panel.length; j = i++) {
    const [xi, yi] = panel[i];
    const [xj, yj] = panel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
