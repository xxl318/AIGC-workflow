/* Small, dependency-free scene model. Shared by the UI and regression tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SceneModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, lo, hi, fallback) => Number.isFinite(Number(n)) ? Math.max(lo, Math.min(hi, Number(n))) : fallback;
  const clone = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({ version: 1, background: null, character: null, transform: { x: .5, y: .54, scale: .78, flip: false } });
  function asset(value) {
    if (!value || value.kind !== 'image' || typeof value.id !== 'string' || typeof value.url !== 'string') return null;
    if (!/^\/(?:api|static)\//.test(value.url) || /[\x00-\x1f]/.test(value.url)) return null;
    const result = { id: value.id, url: value.url, name: String(value.name || '未命名素材'), kind: 'image', category: value.category };
    if (typeof value.cutoutUrl === 'string' && /^\/api\/scene\/cutout\/[a-f0-9]{64}$/.test(value.cutoutUrl)) {
      result.cutoutUrl = value.cutoutUrl; result.useCutout = value.useCutout === true;
    }
    return result;
  }
  function sanitize(value) {
    const base = empty();
    if (!value || value.version !== 1) return base;
    const t = value.transform || {};
    return { version: 1, background: asset(value.background), character: asset(value.character), transform: {
      x: clamp(t.x, 0, 1, .5), y: clamp(t.y, 0, 1, .54), scale: clamp(t.scale, .15, 1.5, .78), flip: t.flip === true,
    } };
  }
  function parse(text) { try { return sanitize(JSON.parse(text)); } catch { return empty(); } }
  function sync(state, background, character) {
    const next = sanitize(state), b = asset(background), c = asset(character);
    // Replacing a character preserves the chosen position and size.
    if (c && next.character?.id === c.id && next.character?.url === c.url && next.character.cutoutUrl) {
      c.cutoutUrl = next.character.cutoutUrl; c.useCutout = next.character.useCutout;
    }
    next.background = b; next.character = c;
    return next;
  }
  function change(state, patch) { return sanitize({ ...state, transform: { ...state.transform, ...patch } }); }
  function rect(state, width, height, imageWidth, imageHeight) {
    if (!(width > 0 && height > 0 && imageWidth > 0 && imageHeight > 0)) throw Error('Invalid image dimensions');
    const t = sanitize(state).transform;
    const h = height * t.scale, w = h * imageWidth / imageHeight;
    return { x: width * t.x - w / 2, y: height * t.y - h / 2, width: w, height: h };
  }
  function cover(width, height, iw, ih) {
    if (!(width > 0 && height > 0 && iw > 0 && ih > 0)) throw Error('Invalid image dimensions');
    const r = Math.max(width / iw, height / ih);
    return { x: (width - iw * r) / 2, y: (height - ih * r) / 2, width: iw * r, height: ih * r };
  }
  function size(quality) { return ({ fast: [768, 448], standard: [1056, 608], hd: [1344, 768], ultra: [1344, 768] })[quality] || [1344, 768]; }
  function command(state, text) {
    const s = String(text).trim().replace(/[。！!，,\s]/g, '');
    const t = state.transform;
    const actions = {
      '左一点': { x: t.x - .05 }, '往左一点': { x: t.x - .05 }, '右一点': { x: t.x + .05 }, '往右一点': { x: t.x + .05 },
      '上移': { y: t.y - .05 }, '下移': { y: t.y + .05 }, '大一点': { scale: t.scale + .08 }, '小一点': { scale: t.scale - .08 },
      '放大': { scale: t.scale + .08 }, '缩小': { scale: t.scale - .08 }, '居中': { x: .5, y: .5 }, '镜像': { flip: !t.flip },
    };
    return Object.prototype.hasOwnProperty.call(actions, s) ? change(state, actions[s]) : null;
  }
  function history(initial, limit = 40) {
    let current = sanitize(initial), past = [], future = [];
    return {
      get: () => clone(current),
      commit(next) { next = sanitize(next); if (JSON.stringify(next) === JSON.stringify(current)) return false; past.push(current); past = past.slice(-limit); current = next; future = []; return true; },
      undo() { if (!past.length) return false; future.push(current); current = past.pop(); return true; },
      redo() { if (!future.length) return false; past.push(current); current = future.pop(); return true; },
      canUndo: () => !!past.length, canRedo: () => !!future.length,
    };
  }
  return { empty, parse, sanitize, sync, change, rect, cover, size, command, history };
});
