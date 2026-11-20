// Fixed scenes for screenshots: ?shot=cover shows the cover alone, filling the viewport;
// ?shot=editor shows the page with a sample cover composed. The query picks the layout,
// grade, caption and size, e.g. ?shot=cover&layout=five&grade=sunset&caption=Sunset%20Heist.
// window.__shotReady is set once the scene has painted. The scene is applied through the
// hook main.js publishes on window, so this module imports nothing from it.
export async function runShot(shot, query) {
  const scene = {
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    caption: query.get('caption') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    size: query.get('size') || undefined,
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  window.__applyScene(scene);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
