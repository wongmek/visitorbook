// Handwriting canvas module ported from prototype
export const INKS = ['#14284b','#1c1c1c','#7a1f2b','#1f5a3f'];

/**
 * Draw strokes on a canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} strokes - Array of stroke objects
 * @param {number} scale - Scale factor for drawing
 */
export function drawS(ctx, st, sc) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  st.forEach(s => {
    if (s.e) {
      ctx.font = s.z * sc + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.e, s.x * sc, s.y * sc);
      return;
    }
    const p = s.p;
    ctx.strokeStyle = ctx.fillStyle = s.c;
    ctx.lineWidth = s.w * sc;
    ctx.beginPath();
    if (p.length === 1) {
      ctx.arc(p[0][0] * sc, p[0][1] * sc, s.w * sc / 2, 0, 7);
      ctx.fill();
      return;
    }
    ctx.moveTo(p[0][0] * sc, p[0][1] * sc);
    for (let i = 1; i < p.length - 1; i++) {
      ctx.quadraticCurveTo(
        p[i][0] * sc,
        p[i][1] * sc,
        (p[i][0] + p[i + 1][0]) / 2 * sc,
        (p[i][1] + p[i + 1][1]) / 2 * sc
      );
    }
    const l = p[p.length - 1];
    ctx.lineTo(l[0] * sc, l[1] * sc);
    ctx.stroke();
  });
}

/**
 * Create a handwriting pad instance
 * @param {HTMLCanvasElement> cv - The canvas element
 * @param {HTMLElement} hint - Hint element to show when no strokes
 * @param {string} defaultColor - Default ink color
 * @param {number} defaultWidth - Default line width multiplier
 * @returns {Object} Pad instance with methods: fit, undo, clear, png, and properties: strokes, cur, c, w
 */
export function pad(cv, hint, c, w) {
  const ctx = cv.getContext('2d');
  const S = {
    strokes: [],
    cur: null,
    c: c,
    w: w
  };

  const redraw = () => {
    const r = cv.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    drawS(ctx, S.strokes, 1);
    hint.style.display = S.strokes.length ? 'none' : 'block';
  };

  const pt = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  cv.onpointerdown = e => {
    if (S.onStart) S.onStart();
    if (S.stamp) {
      const q = pt(e);
      S.strokes.push({ e: S.stamp, x: q[0], y: q[1], z: 46 });
      redraw();
      return;
    }
    cv.setPointerCapture(e.pointerId);
    S.cur = { c: S.c, w: S.w, p: [pt(e)] };
    S.strokes.push(S.cur);
    redraw();
  };

  cv.onpointermove = e => {
    if (S.cur) {
      S.cur.p.push(pt(e));
      redraw();
    }
  };

  cv.onpointerup = cv.onpointercancel = () => {
    S.cur = null;
  };

  S.fit = () => {
    const r = cv.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    redraw();
  };

  S.undo = () => {
    S.strokes.pop();
    redraw();
  };

  S.clear = () => {
    S.strokes = [];
    redraw();
  };

  /**
   * Get PNG image of the canvas
   * @param {number} W - Width of the output image
   * @param {string} bg - Background color (optional)
   * @returns {string} PNG data URL
   */
  S.png = (W, bg) => {
    const r = cv.getBoundingClientRect();
    const sc = W / r.width;
    const o = document.createElement('canvas');
    o.width = W;
    o.height = Math.round(r.height * sc);
    if (bg) {
      const x = o.getContext('2d');
      x.fillStyle = bg;
      x.fillRect(0, 0, o.width, o.height);
    }
    drawS(o.getContext('2d'), S.strokes, sc);
    return o.toDataURL('image/png');
  };

  return S;
}