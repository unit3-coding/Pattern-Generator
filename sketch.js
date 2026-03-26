// ════════════════════════════════════════════════════
//  Concentric Rings  ·  p5.js
// ════════════════════════════════════════════════════

let sl_rings, sl_thick, sl_density, sl_speed, sl_center, sl_intro;
let sl_cx, sl_cy;
let colorPicker;
let RING_COLOR;

let gapsList = [];
let patSeed  = 1;

let animating      = false;
let animStartFrame = 0;
let offset         = 0;
let allRings       = [];
let extraCount     = 0;

let THICK, N, NG, MING, MAXG, SPD, CENTER_R, INTRO, DENSITY;
let CX_OFF, CY_OFF;

function rd() {
  N        = sl_rings.value();
  THICK    = sl_thick.value();
  DENSITY  = sl_density.value();
  NG       = floor(map(DENSITY, 1, 10,  2, 12));
  MAXG     = floor(map(DENSITY, 1, 10, 60, 12));
  MING     = floor(map(DENSITY, 1, 10, 25,  5));
  SPD      = sl_speed.value() * 0.25;
  CENTER_R = sl_center.value() * 3;
  INTRO    = sl_intro.value() * 1.2;
  CX_OFF   = sl_cx.value();
  CY_OFF   = sl_cy.value();
  RING_COLOR = colorPicker ? colorPicker.value() : '#00ff78';
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  buildUI();
  genPattern();
  noLoop();
}

// ════════════════════════════════════════════════════
//  UI
// ════════════════════════════════════════════════════
function buildUI() {
  let panel = createDiv('');
  panel.style(`
    position:fixed; top:22px; left:22px;
    background:rgba(5,5,20,0.93);
    border:1px solid #00ff7840; border-radius:18px;
    padding:16px 18px; display:flex; flex-direction:column; gap:10px;
    font-family:monospace; font-size:12px;
    backdrop-filter:blur(12px); z-index:999;
    box-shadow:0 0 32px rgba(0,255,120,0.08);
    min-width:240px; max-height:90vh; overflow-y:auto;
  `);

  // ── Title ──────────────────────────────────────────
  let title = createDiv('PATTERN GENERATOR');
  title.parent(panel);
  title.style(`color:#00ff78;font-size:13px;font-weight:bold;
    letter-spacing:3px;padding-bottom:10px;
    border-bottom:1px solid #00ff7830;`);

  // ── Sections ───────────────────────────────────────
  mkExpandable(panel, 'STYLE', true, (body) => {
    mkColorRow(body);
    sl_thick   = mkSl(body, 'Thickness', 30, 140, 80, 1);
    sl_density = mkSl(body, 'Density',    1,  10,  4, 1);
    sl_rings   = mkSl(body, 'Rings',      3,  30,  6, 1);
  });

  mkExpandable(panel, 'TRANSFORM', true, (body) => {
    sl_center = mkSl(body, 'Center R',   5, 200,  30, 1);
    sl_cx     = mkSl(body, 'Position X',-500, 500,  0, 1);
    sl_cy     = mkSl(body, 'Position Y',-500, 500,  0, 1);
  });

  mkExpandable(panel, 'ANIMATION', true, (body) => {
    sl_speed = mkSl(body, 'Speed',      1,  10,  5, 1);
    sl_intro = mkSl(body, 'Trim Speed',10, 180, 90, 1);
  });

  // ── Buttons ───────────────────────────────────────
  let bRow = createDiv(''); bRow.parent(panel);
  bRow.style('display:flex;gap:8px;padding-top:4px;');

  let bN = createButton('⟳  New');
  bN.parent(bRow);
  bN.style(btnSt('#00ff78','#05051a'));
  bN.mousePressed(() => { stopAnim(); genPattern(); redraw(); });

  let bA = createButton('▶  Animate');
  bA.parent(bRow);
  bA.style(btnSt('transparent','#00ff78'));
  bA.mousePressed(startAnim);
}

// ── Expandable section ─────────────────────────────
function mkExpandable(parent, title, openByDefault, buildFn) {
  let wrap = createDiv(''); wrap.parent(parent);
  wrap.style('display:flex;flex-direction:column;gap:0px;');

  // Header row (clickable)
  let hdr = createDiv('');
  hdr.parent(wrap);
  hdr.style(`
    display:flex; justify-content:space-between; align-items:center;
    padding:7px 0; cursor:pointer; user-select:none;
    border-bottom:1px solid #00ff7825;
  `);

  let hdrLabel = createDiv(title);
  hdrLabel.parent(hdr);
  hdrLabel.style('color:#00ff78;font-size:10px;font-weight:bold;letter-spacing:2px;');

  let arrow = createDiv(openByDefault ? '▾' : '▸');
  arrow.parent(hdr);
  arrow.style('color:#00ff7866;font-size:12px;transition:transform .2s;');

  // Body
  let body = createDiv('');
  body.parent(wrap);
  body.style(`
    display:${openByDefault ? 'flex' : 'none'};
    flex-direction:column; gap:10px;
    padding:12px 0 4px 0;
    overflow:hidden;
  `);

  // Toggle logic
  let open = openByDefault;
  hdr.mousePressed(() => {
    open = !open;
    body.style('display', open ? 'flex' : 'none');
    arrow.html(open ? '▾' : '▸');
  });

  buildFn(body);
}

// ── Color picker row ───────────────────────────────
function mkColorRow(parent) {
  let row = createDiv(''); row.parent(parent);
  row.style('display:flex;align-items:center;gap:10px;');

  let lbl = createP('Color'); lbl.parent(row);
  lbl.style('margin:0;font-size:10px;color:#00ff7877;min-width:60px;');

  colorPicker = createColorPicker('#00ff78');
  colorPicker.parent(row);
  colorPicker.style(`
    width:40px; height:28px; border:1px solid #00ff7840;
    border-radius:6px; cursor:pointer; background:none; padding:2px;
  `);
  colorPicker.input(() => { if (!animating) redraw(); });

  // Hex input
  let hexInput = createElement('input');
  hexInput.parent(row);
  hexInput.attribute('type','text');
  hexInput.attribute('placeholder','#00ff78');
  hexInput.attribute('maxlength','7');
  hexInput.style(`
    background:rgba(0,255,120,0.06); border:1px solid #00ff7840;
    border-radius:6px; color:#00ff78; font-family:monospace;
    font-size:11px; padding:4px 8px; width:80px; outline:none;
  `);

  // Sync hex → picker
  hexInput.input(() => {
    let val = hexInput.value();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      colorPicker.value(val);
      if (!animating) redraw();
    }
  });

  // Sync picker → hex
  colorPicker.input(() => {
    hexInput.value(colorPicker.value());
    if (!animating) redraw();
  });
}

// ── Slider helper ──────────────────────────────────
function mkSl(par, lbl, mn, mx, val, s) {
  let row = createDiv(''); row.parent(par);
  row.style('display:flex;align-items:center;gap:10px;');

  let l = createP(lbl); l.parent(row);
  l.style('margin:0;font-size:10px;color:#00ff7877;min-width:72px;white-space:nowrap;');

  let sl = createSlider(mn, mx, val, s); sl.parent(row);
  sl.style('flex:1;accent-color:#00ff78;');
  sl.input(() => { if (!animating) { genPattern(); redraw(); } });
  return sl;
}

function btnSt(bg, c) {
  return `background:${bg};color:${c};border:1px solid #00ff78;
    border-radius:8px;padding:8px 0;cursor:pointer;flex:1;
    font-family:monospace;font-size:11px;font-weight:bold;`;
}

function genPattern() {
  rd();
  patSeed  = floor(random(99999));
  gapsList = [];
  randomSeed(patSeed);
  for (let i = 0; i < N; i++) gapsList.push(mkGaps());
}

function mkGaps() {
  let gaps=[], tries=0;
  let n = floor(random(max(1,NG-1), NG+2));
  while (gaps.length<n && tries<2000) {
    tries++;
    let s=random(0,360), e=s+random(MING,MAXG);
    let ok=true;
    for (let g of gaps){if(s<g.e+6&&e>g.s-6){ok=false;break;}}
    if(ok) gaps.push({s,e});
  }
  return gaps;
}

// ── رسم قوس واحد بأمان ──────────────────────────────
function safeArc(cx, cy, d, s, e) {
  let span = e - s;
  if (span < 0.5) return;           // أقل من نص درجة → لا ترسم
  if (span >= 360) span = 359.9;    // منع الدائرة الكاملة فقط
  arc(cx, cy, d, d, s, s + span);
}

function drawRing(cx, cy, r, gaps, sw, alpha, progress, rotation) {
  if (r < 1 || alpha <= 0 || progress <= 0) return;

  // حوّل الـ gaps إلى أقواس
  let sorted = gaps.slice().sort((a,b)=>a.s-b.s);
  let arcs = [], prev = 0;
  for (let g of sorted) {
    if (g.s > prev + 0.2) arcs.push({s: prev, e: g.s});
    prev = g.e;
  }
  if (prev < 360) arcs.push({s: prev, e: 360});

  let n = arcs.length;
  if (n === 0) return;

  let c = color(RING_COLOR);
  c.setAlpha(alpha);
  stroke(c);
  strokeWeight(sw);
  strokeCap(SQUARE);
  noFill();

  let overlap = 0.4;
  for (let i = 0; i < n; i++) {
    let staggerStart = (i / n) * (1 - overlap);
    let denom = 1 - staggerStart;
    if (denom < 0.001) continue;
    let localT     = constrain((progress - staggerStart) / denom, 0, 1);
    let easedLocal = easeInOut(localT);
    if (easedLocal <= 0.001) continue;

    let a      = arcs[i];
    let arcLen = (a.e - a.s) * easedLocal;
    let s      = a.s + rotation;
    safeArc(cx, cy, r*2, s, s + arcLen);
  }
}

function easeInOut(t) {
  return t < 0.5 ? 2*t*t : 1 - pow(-2*t+2,2)/2;
}

function draw() {
  background(5, 5, 20);
  rd();
  let cx = width/2  + CX_OFF;
  let cy = height/2 + CY_OFF;
  let sw = THICK + 1;

  if (!animating) {
    for (let i=0; i<gapsList.length; i++) {
      let r = CENTER_R + THICK/2 + i*THICK;
      drawRing(cx, cy, r, gapsList[i], sw, 255, 1, 0);
    }
  } else {
    offset += SPD;

    // ── توليد حلقات جديدة ──────────────────────────
    // offset يبدأ من -THICK حتى أول حلقة تظهر فوراً
    let needed = floor(offset / THICK);
    while (extraCount < needed) {
      extraCount++;
      randomSeed(patSeed + extraCount * 31337);
      allRings.unshift({
        gaps:      mkGaps(),
        birth:     frameCount,
        baseIndex: -(extraCount)
      });
    }

    let maxR      = max(width, height) * 0.85;
    let fadeStart = maxR * 0.55;
    let animAge   = frameCount - animStartFrame;

    for (let ring of allRings) {
      let r = CENTER_R + THICK/2 + ring.baseIndex * THICK + offset;

      if (r < CENTER_R + THICK * 0.1) continue;
      if (r > maxR) continue;

      // الـ alpha المستهدف بناءً على الموقع الحالي
      let targetAlpha = r > fadeStart ? map(r, fadeStart, maxR, 255, 0) : 255;

      let alphaOut;
      if (ring.birth < 0) {
        // حلقة أصلية: احسب موقعها الابتدائي لتحديد مدة الـ fade
        let r0 = CENTER_R + THICK/2 + ring.baseIndex * THICK;
        // الحلقات الأبعد تحتاج مدة أطول حتى لا تختفي مفاجأة
        let distRatio  = constrain(r0 / maxR, 0, 1);
        let fadeDur    = lerp(INTRO, INTRO * 3, distRatio);
        let fadeT      = constrain(animAge / fadeDur, 0, 1);
        let eased      = easeInOut(fadeT);
        // ابدأ من alpha الحلقة لحظة ما كانت ثابتة
        let startAlpha = r0 > fadeStart ? map(r0, fadeStart, maxR, 255, 0) : 255;
        alphaOut       = lerp(startAlpha, targetAlpha, eased);
      } else {
        alphaOut = targetAlpha;
      }

      if (alphaOut <= 0) continue;

      let age    = ring.birth < 0 ? INTRO + 1 : (frameCount - ring.birth);
      let introT = constrain(age / INTRO, 0, 1);
      let easedT = easeInOut(introT);

      let alpha    = min(easedT * 255, alphaOut);
      let progress = easedT;
      let rotation = -(1 - easedT) * 25;

      drawRing(cx, cy, r, ring.gaps, sw, alpha, progress, rotation);
    }
  }

  // المركز
  noStroke();
  fill(5, 5, 20);
  circle(cx, cy, CENTER_R * 2);
}

function startAnim() {
  if (animating) return;
  rd();
  randomSeed(patSeed);
  gapsList = [];
  for (let i=0; i<N; i++) gapsList.push(mkGaps());

  // الحلقات الأصلية تبدأ مكتملة (birth سالب)
  allRings = gapsList.map((gaps, i) => ({
    gaps,
    birth:     -9999,
    baseIndex:  i
  }));

  offset         = 0;
  extraCount     = 0;
  animStartFrame = frameCount;
  animating      = true;
  loop();
}

function stopAnim() {
  animating  = false;
  allRings   = [];
  offset     = 0;
  extraCount = 0;
  noLoop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!animating) redraw();
}
function keyPressed() {
  if(key==='q'||key==='q') saveCanvas('rings','png');
}
