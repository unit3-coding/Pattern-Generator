// ════════════════════════════════════════════════════
//  PATTERN GENERATOR  ·  p5.js
// ════════════════════════════════════════════════════

// ── UI refs ──────────────────────────────────────────
let sl_thick, sl_density, sl_rings, sl_deadzone;
let sl_center, sl_cx, sl_cy, sl_scale, sl_rotation;
let sl_speed, sl_intro;
let colorPicker;

// ── Default values (for reset) ───────────────────────
const DEF = {
  thick:8, density:4, rings:6, deadzone:80,
  center:30, cx:0, cy:0, scale:100, rotation:0,
  speed:5, intro:90,
  color:'#00ff78'
};

// زوايا دوران الحلقات (تتراكم مع الوقت)
let ringAngles = {}; // key = baseIndex → زاوية مراكمة

// ── Anim state ───────────────────────────────────────
let animating = false, animStartFrame = 0, paused = false;
let offset = 0, allRings = [], extraCount = 0;
// كل حلقة أصلية تخزن alphaStart لحظة بداية الأنيميشن
// allRings[i] = { gaps, birth, baseIndex, alphaStart }

// ── Computed values ──────────────────────────────────
let THICK, N, NG, MING, MAXG, SPD, CENTER_R, INTRO, DENSITY;
let CX_OFF, CY_OFF, RING_COLOR, DEADZONE, SCALE, ROT_SPD;

function rd() {
  THICK    = sl_thick    ? sl_thick.value() * 10  : DEF.thick * 10;
  N        = sl_rings    ? sl_rings.value()        : DEF.rings;
  DENSITY  = sl_density  ? sl_density.value()      : DEF.density;
  NG       = floor(map(DENSITY,1,10, 2,12));
  MAXG     = floor(map(DENSITY,1,10,60,12));
  MING     = floor(map(DENSITY,1,10,25, 5));
  SPD      = sl_speed    ? sl_speed.value() * 0.25 : DEF.speed * 0.25;
  CENTER_R = sl_center   ? sl_center.value() * 3   : DEF.center * 3;
  INTRO    = sl_intro    ? sl_intro.value() * 1.2  : DEF.intro * 1.2;
  CX_OFF   = sl_cx       ? sl_cx.value()           : DEF.cx;
  CY_OFF   = sl_cy       ? sl_cy.value()           : DEF.cy;
  SCALE    = sl_scale    ? sl_scale.value() / 100  : 1;
  ROT_SPD  = sl_rotation ? sl_rotation.value() * 0.002 : 0;
  DEADZONE = sl_deadzone ? sl_deadzone.value()/100  : 1;
  RING_COLOR = colorPicker ? colorPicker.value() : DEF.color;
}

// ════════════════════════════════════════════════════
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  angleMode(DEGREES);
  buildUI();
  genPattern();
  noLoop();
}

// ════════════════════════════════════════════════════
//  UI BUILD
// ════════════════════════════════════════════════════
function buildUI() {
  // inject CSS for font + scrollbar
  let style = createElement('style', `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
    * { box-sizing:border-box; }
    #pg-panel::-webkit-scrollbar { width:4px; }
    #pg-panel::-webkit-scrollbar-track { background:transparent; }
    #pg-panel::-webkit-scrollbar-thumb { background:#00ff7840; border-radius:4px; }
    input[type=range] { cursor:pointer; }
    input[type=color] { cursor:pointer; }
    .pg-hex:focus { border-color:#00ff78 !important; outline:none; }
  `);
  style.parent(document.head);

  let panel = createDiv('');
  panel.id('pg-panel');
  panel.style(`
    position:fixed; top:22px; left:22px;
    background:rgba(5,5,18,0.95);
    border:1px solid #00ff7835; border-radius:20px;
    padding:18px 18px 14px; display:flex; flex-direction:column; gap:8px;
    font-family:'Space Grotesk',monospace; font-size:12px;
    backdrop-filter:blur(16px); z-index:999;
    box-shadow:0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,120,0.05);
    width:260px; max-height:92vh; overflow-y:auto;
  `);

  // ── Logo + Title ────────────────────────────────
  let titleRow = createDiv('');
  titleRow.parent(panel);
  titleRow.style('display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #00ff7820;');

  // Logo SVG placeholder (حلقة صغيرة)
  let logo = createDiv('');
  logo.parent(titleRow);
  logo.html(`<svg width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="11" fill="none" stroke="#00ff78" stroke-width="2.5" stroke-dasharray="22 8" stroke-linecap="square"/>
    <circle cx="14" cy="14" r="6" fill="none" stroke="#00ff78" stroke-width="2" stroke-dasharray="12 5" stroke-linecap="square"/>
    <circle cx="14" cy="14" r="2.5" fill="#00ff78"/>
  </svg>`);

  let titleTxt = createDiv('PATTERN<br>GENERATOR');
  titleTxt.parent(titleRow);
  titleTxt.style(`color:#00ff78;font-size:11px;font-weight:700;
    letter-spacing:2px;line-height:1.5;`);

  // ── Sections ────────────────────────────────────
  mkSection(panel, 'STYLE', [
    ['color'],
    ['Thickness', 'sl_thick',   3, 14, DEF.thick,    1],
    ['Density',   'sl_density', 1, 10, DEF.density,  1],
    ['Rings',     'sl_rings',   3, 30, DEF.rings,    1],
    ['Deadzone',  'sl_deadzone', 0,100, DEF.deadzone, 1],
  ], {
    color: DEF.color,
    thick: DEF.thick, density: DEF.density, rings: DEF.rings, deadzone: DEF.deadzone
  });

  mkSection(panel, 'TRANSFORM', [
    ['Center R',   'sl_center',   5,  200, DEF.center,   1],
    ['Scale',      'sl_scale',   10,  300, DEF.scale,    1],
    ['Position X', 'sl_cx',    -500,  500, DEF.cx,       1],
    ['Position Y', 'sl_cy',    -500,  500, DEF.cy,       1],
  ], { center: DEF.center, scale: DEF.scale, cx: DEF.cx, cy: DEF.cy });

  mkSection(panel, 'ANIMATION', [
    ['Speed',          'sl_speed',    1,  10, DEF.speed,    1],
    ['Trim Speed',     'sl_intro',   10, 180, DEF.intro,    1],
    ['Rotation Speed', 'sl_rotation', 0, 100, DEF.rotation, 1],
  ], { speed: DEF.speed, intro: DEF.intro, rotation: DEF.rotation });

  mkSection(panel, 'EXPORT', [['export']], {});

  // ── Action buttons ──────────────────────────────
  let bRow = createDiv(''); bRow.parent(panel);
  bRow.style('display:flex;gap:8px;padding-top:6px;');

  mkBtn(bRow, '⟳  New', '#00ff78', '#05051a', () => { stopAnim(); genPattern(); redraw(); });

  let bA = mkBtn(bRow, '▶  Animate', 'transparent', '#00ff78', startAnim);

  let bRow2 = createDiv(''); bRow2.parent(panel);
  bRow2.style('display:flex;gap:8px;');

  let bP = mkBtn(bRow2, '⏸  Pause', 'transparent', '#00ff7899', () => {
    if (!animating) return;
    paused = !paused;
    if (paused) {
      noLoop();
      bP.html('▶  Resume');
      bP.style('color:#00ff78');
    } else {
      // عند الاستئناف نعوّض الـ animStartFrame حتى الـ fade يكمل من حيث توقف
      animStartFrame += frameCount - animStartFrame - (frameCount - animStartFrame);
      loop();
      bP.html('⏸  Pause');
      bP.style('color:#00ff7899');
    }
  });

  mkBtn(bRow2, '■  Stop', 'transparent', '#ff4d4d88', () => {
    stopAnim();
    bP.html('⏸  Pause');
    bP.style('color:#00ff7899');
    genPattern(); redraw();
  });

  // ── Reset All ─────────────────────────────────────
  let bRow3 = createDiv(''); bRow3.parent(panel);
  bRow3.style('display:flex;gap:8px;border-top:1px solid #00ff7818;padding-top:8px;');

  mkBtn(bRow3, '↺  Reset All', '#ff4d4d15', '#ff4d4d', () => {
    stopAnim();
    // reset كل السلايدرات
    sl_thick.value(DEF.thick);
    sl_density.value(DEF.density);
    sl_rings.value(DEF.rings);
    sl_deadzone.value(DEF.deadzone);
    sl_center.value(DEF.center);
    sl_scale.value(DEF.scale);
    if (sl_rotation) sl_rotation.value(DEF.rotation);
    sl_cx.value(DEF.cx);
    sl_cy.value(DEF.cy);
    sl_speed.value(DEF.speed);
    sl_intro.value(DEF.intro);
    if (colorPicker) {
      colorPicker.value(DEF.color);
      let hexEl = document.querySelector('.pg-hex');
      if (hexEl) hexEl.value = DEF.color;
    }
    bP.html('⏸  Pause');
    bP.style('color:#00ff7899');
    genPattern(); redraw();
  });
}

// ── Section factory ──────────────────────────────────
function mkSection(panel, title, fields, defaults) {
  let wrap = createDiv(''); wrap.parent(panel);
  wrap.style('border-bottom:1px solid #00ff7818;');

  // header
  let hdr = createDiv(''); hdr.parent(wrap);
  hdr.style(`display:flex;justify-content:space-between;align-items:center;
    padding:8px 0;cursor:pointer;user-select:none;`);

  let lRow = createDiv(''); lRow.parent(hdr);
  lRow.style('display:flex;align-items:center;gap:6px;');

  let arrow = createSpan('▸'); arrow.parent(lRow);
  arrow.style('color:#00ff7855;font-size:11px;');

  let lbl = createDiv(title); lbl.parent(lRow);
  lbl.style('color:#00ff78;font-size:10px;font-weight:700;letter-spacing:2px;');

  // reset btn
  let rst = createDiv('↺'); rst.parent(hdr);
  rst.style(`color:#00ff7844;font-size:13px;padding:2px 6px;
    border-radius:5px;cursor:pointer;transition:color .15s;`);
  rst.elt.onmouseenter = () => rst.style('color:#00ff78');
  rst.elt.onmouseleave = () => rst.style('color:#00ff7844');

  // body
  let body = createDiv(''); body.parent(wrap);
  body.style('display:none;flex-direction:column;gap:9px;padding:8px 0 12px;');

  // toggle
  let open = false;
  hdr.mousePressed((e) => {
    if (e.target === rst.elt) return;
    open = !open;
    body.style('display', open ? 'flex' : 'none');
    arrow.html(open ? '▾' : '▸');
  });

  // build fields
  let sliders = {};
  for (let f of fields) {
    if (f[0] === 'color') {
      mkColorRow(body);
    } else if (f[0] === 'export') {
      mkExportRow(body);
    } else {
      let [lbl2, varName, mn, mx, val, step] = f;
      let sl = mkSlider(body, lbl2, mn, mx, val, step);
      sliders[varName] = sl;
      // assign to global
      if (varName === 'sl_thick')    sl_thick    = sl;
      if (varName === 'sl_density')  sl_density  = sl;
      if (varName === 'sl_rings')    sl_rings    = sl;
      if (varName === 'sl_deadzone') sl_deadzone = sl;
      if (varName === 'sl_center')   sl_center   = sl;
      if (varName === 'sl_scale')    sl_scale    = sl;
      if (varName === 'sl_rotation') sl_rotation = sl;
      if (varName === 'sl_cx')       sl_cx       = sl;
      if (varName === 'sl_cy')       sl_cy       = sl;
      if (varName === 'sl_speed')    sl_speed    = sl;
      if (varName === 'sl_intro')    sl_intro    = sl;
    }
  }

  // reset action
  rst.mousePressed(() => {
    // reset sliders
    for (let [varName, sl] of Object.entries(sliders)) {
      let key = varName.replace('sl_','');
      if (defaults[key] !== undefined) sl.value(defaults[key]);
    }
    // reset color if in style section
    if (defaults.color && colorPicker) {
      colorPicker.value(defaults.color);
      document.querySelector('.pg-hex').value = defaults.color;
    }
    if (!animating) { genPattern(); redraw(); }
  });
}

// ── Color row ────────────────────────────────────────
function mkColorRow(parent) {
  let row = createDiv(''); row.parent(parent);
  row.style('display:flex;align-items:center;gap:8px;');

  let lbl = createDiv('Color'); lbl.parent(row);
  lbl.style('font-size:10px;color:#00ff7866;min-width:72px;');

  colorPicker = createColorPicker('#00ff78');
  colorPicker.parent(row);
  colorPicker.style(`
    width:32px; height:32px; border-radius:6px;
    border:1px solid #00ff7840; cursor:pointer;
    padding:0; background:none; flex-shrink:0;
  `);

  let hex = createElement('input'); hex.parent(row);
  hex.attribute('type','text');
  hex.attribute('value','#00ff78');
  hex.attribute('maxlength','7');
  hex.attribute('class','pg-hex');
  hex.style(`
    width:76px; background:rgba(0,255,120,0.05);
    border:1px solid #00ff7830; border-radius:6px;
    color:#00ff78; font-family:'Space Grotesk',monospace;
    font-size:11px; padding:4px 8px; flex-shrink:0;
  `);

  colorPicker.input(() => {
    hex.elt.value = colorPicker.value();
    if (!animating) redraw();
  });
  hex.input(() => {
    let v = hex.elt.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorPicker.value(v);
      if (!animating) redraw();
    }
  });
}

// ── Export row ───────────────────────────────────────


function mkExportRow(parent) {
  let col = createDiv(''); col.parent(parent);
  col.style('display:flex;flex-direction:column;gap:7px;');

  let hint = createDiv('Export current view');
  hint.parent(col);
  hint.style('font-size:10px;color:#00ff7855;');

  let row1 = createDiv(''); row1.parent(col);
  row1.style('display:flex;gap:7px;');

  mkBtn(row1, 'PNG', '#00ff7822', '#00ff78', exportPNG);
  mkBtn(row1, 'SVG', '#00ff7822', '#00ff78', exportSVG);

  let row2 = createDiv(''); row2.parent(col);
  row2.style('display:flex;gap:7px;');

  // GIF button — يسجل 3 ثوان
  let gifBtn = mkBtn(row2, '⏺  Record Video', '#00ff7822', '#00ff78', () => {
    if (!animating) {
      alert('Start animation first, then record GIF.');
      return;
    }
    if (gifRecording) return;
    startGIFRecording(gifBtn);
  });
}

// ── Slider ───────────────────────────────────────────
function mkSlider(par, lbl, mn, mx, val, step) {
  let row = createDiv(''); row.parent(par);
  row.style('display:flex;align-items:center;gap:8px;');

  let l = createDiv(lbl); l.parent(row);
  l.style('font-size:10px;color:#00ff7866;min-width:72px;white-space:nowrap;');

  let sl = createSlider(mn, mx, val, step); sl.parent(row);
  sl.style('flex:1;accent-color:#00ff78;');
  sl.input(() => {
    if (animating) {
      if (lbl === 'Deadzone') {
        for (let ring of allRings) { if (ring.birth < 0) ring.alphaStart = undefined; }
      } else if (lbl === 'Rings' || lbl === 'Density') {
        rd();
        randomSeed(patSeed);
        gapsList = [];
        for (let i=0; i<N; i++) gapsList.push(mkGaps());
        for (let ring of allRings) {
          if (ring.birth < 0 && ring.baseIndex >= 0 && ring.baseIndex < gapsList.length) {
            ring.gaps = gapsList[ring.baseIndex];
            ring.alphaStart = undefined;
          }
        }
      }
      // باقي السلايدرات تعمل تلقائياً أثناء الأنيميشن
    } else {
      // وضع ثابت — الدوران لا يعمل هنا
      if (lbl !== 'Deadzone' && lbl !== 'Rotation Speed') genPattern();
      noLoop();
      redraw();
    }
  });
  return sl;
}

function mkBtn(par, txt, bg, col, fn) {
  let b = createButton(txt); b.parent(par);
  b.style(`background:${bg};color:${col};border:1px solid #00ff7850;
    border-radius:8px;padding:8px 0;cursor:pointer;flex:1;
    font-family:'Space Grotesk',monospace;font-size:11px;font-weight:600;`);
  b.mousePressed(fn);
  return b;
}

// ════════════════════════════════════════════════════
//  PATTERN
// ════════════════════════════════════════════════════
function genPattern() {
  rd();
  patSeed = floor(random(99999));
  gapsList = [];
  randomSeed(patSeed);
  for (let i=0; i<N; i++) gapsList.push(mkGaps());
  ringAngles = {};
}

function mkGaps() {
  let gaps=[], tries=0;
  let n = floor(random(max(1,NG-1), NG+2));
  while (gaps.length<n && tries<2000) {
    tries++;
    let s=random(0,360), e=s+random(MING,MAXG);
    let ok=true;
    for (let g of gaps) { if(s<g.e+6&&e>g.s-6){ok=false;break;} }
    if(ok) gaps.push({s,e});
  }
  return gaps;
}

// ════════════════════════════════════════════════════
//  DRAW HELPERS
// ════════════════════════════════════════════════════
function easeInOut(t) {
  return t < 0.5 ? 2*t*t : 1 - pow(-2*t+2,2)/2;
}

function safeArc(cx,cy,d,s,e) {
  let span = e-s;
  if (span < 0.5) return;
  if (span >= 360) span = 359.9;
  arc(cx,cy,d,d,s,s+span);
}

function drawRing(cx,cy,r,gaps,sw,alpha,progress,rotation) {
  if (r<1||alpha<=0||progress<=0) return;
  let sorted = gaps.slice().sort((a,b)=>a.s-b.s);
  let arcs=[], prev=0;
  for (let g of sorted) {
    if (g.s>prev+0.2) arcs.push({s:prev,e:g.s});
    prev=g.e;
  }
  if (prev<360) arcs.push({s:prev,e:360});
  let n=arcs.length; if(n===0)return;

  let c=color(RING_COLOR); c.setAlpha(alpha);
  stroke(c); strokeWeight(sw); strokeCap(SQUARE); noFill();

  let overlap=0.4;
  for (let i=0;i<n;i++) {
    let ss = (i/n)*(1-overlap);
    let den = 1-ss; if(den<0.001)continue;
    let lt = constrain((progress-ss)/den,0,1);
    let el = easeInOut(lt);
    if(el<=0.001)continue;
    let a=arcs[i];
    safeArc(cx,cy,r*2, a.s+rotation, a.s+rotation+(a.e-a.s)*el);
  }
}

// معامل دوران عشوائي لكل حلقة — مبني على baseIndex
// يعطي قيم بين -1 و 1 بشكل مختلف لكل حلقة
function getRingFactor(idx) {
  // قيم موجبة فقط (عقارب الساعة) — مختلفة لكل حلقة بين 0.3 و 1.0
  return 0.3 + abs(sin(idx * 127.1 + 1.5)) * 0.7;
}

function updateRingAngles() {
  let spd = sl_rotation ? sl_rotation.value() * 0.003 : 0;
  if (spd === 0) return;
  for (let i=0; i<gapsList.length; i++) {
    if (ringAngles[i] === undefined) ringAngles[i] = 0;
    ringAngles[i] += spd * getRingFactor(i);
  }
  for (let ring of allRings) {
    let k = ring.baseIndex;
    if (ringAngles[k] === undefined) ringAngles[k] = 0;
    ringAngles[k] += spd * getRingFactor(k);
  }
}

// ════════════════════════════════════════════════════
//  MAIN DRAW
// ════════════════════════════════════════════════════
function draw() {
  background(5,5,20);
  rd();
  let cx=width/2+CX_OFF, cy=height/2+CY_OFF;
  let sw=THICK+1;

  // تطبيق الـ scale حول مركز الدوائر
  push();
  translate(cx, cy);
  scale(SCALE);
  translate(-cx, -cy);

  if (!paused && animating) updateRingAngles();

  if (!animating) {
    // ── Static ────────────────────────────────────
    let maxR = max(
      dist(cx,cy,0,0), dist(cx,cy,width,0),
      dist(cx,cy,0,height), dist(cx,cy,width,height)
    ) * 1.1;
    let fadeStart = maxR * DEADZONE;

    for (let i=0;i<gapsList.length;i++) {
      let r=CENTER_R+THICK/2+i*THICK;
      let alpha = DEADZONE >= 1 ? 255 : (r > fadeStart ? map(r, fadeStart, maxR, 255, 0) : 255);
      alpha = constrain(alpha, 0, 255);
      let rotOff = ringAngles[i] || 0;
      drawRing(cx,cy,r,gapsList[i],sw,alpha,1,rotOff);
    }
  } else {
    // ── Animate ───────────────────────────────────
    offset += SPD;

    let needed = floor(offset/THICK);
    while (extraCount<needed) {
      extraCount++;
      randomSeed(patSeed+extraCount*31337);
      allRings.unshift({ gaps:mkGaps(), birth:frameCount, baseIndex:-extraCount });
    }

    // الـ maxR يعتمد على موقع المركز — يأخذ أبعد حافة من المركز
    let maxR = max(
      dist(cx,cy,0,0), dist(cx,cy,width,0),
      dist(cx,cy,0,height), dist(cx,cy,width,height)
    ) * 1.1;

    let fadeStart  = DEADZONE >= 1 ? maxR * 2 : maxR * DEADZONE;
    let animAge    = frameCount - animStartFrame;

    for (let ring of allRings) {
      let r = CENTER_R+THICK/2+ring.baseIndex*THICK+offset;
      if (r < CENTER_R+THICK*0.1) continue;
      if (r > maxR+THICK) continue;

      let targetAlpha = r>fadeStart ? map(r,fadeStart,maxR,255,0) : 255;
      targetAlpha = constrain(targetAlpha,0,255);

      let alphaOut;
      if (ring.birth < 0) {
        // حلقة أصلية: الـ alphaStart يُحسب مرة واحدة عند أول فريم
        if (ring.alphaStart === undefined) {
          let r0 = CENTER_R+THICK/2+ring.baseIndex*THICK;
          ring.alphaStart = r0>fadeStart ? map(r0,fadeStart,maxR,255,0) : 255;
          ring.alphaStart = constrain(ring.alphaStart,0,255);
        }
        // انتقال ناعم من alphaStart إلى targetAlpha
        // المدة تتناسب مع الفرق — الحلقات البعيدة تأخذ وقت أطول
        let gap      = abs(ring.alphaStart - targetAlpha);
        let fadeDur  = map(gap, 0, 255, INTRO*0.5, INTRO*2.5);
        let fadeT    = constrain(animAge/fadeDur, 0, 1);
        alphaOut     = lerp(ring.alphaStart, targetAlpha, easeInOut(fadeT));
      } else {
        alphaOut = targetAlpha;
      }

      if (alphaOut <= 0) continue;

      let age    = ring.birth<0 ? INTRO+1 : (frameCount-ring.birth);
      let introT = constrain(age/INTRO,0,1);
      let easedT = easeInOut(introT);
      let rotOff = ringAngles[ring.baseIndex] || 0;

      drawRing(cx,cy,r,ring.gaps,sw, min(easedT*255,alphaOut), easedT, -(1-easedT)*25 + rotOff);
    }
  }

  noStroke(); fill(5,5,20);
  circle(cx,cy,CENTER_R*2);
  pop();
}

// ════════════════════════════════════════════════════
//  ANIM CONTROL
// ════════════════════════════════════════════════════
function startAnim() {
  if (animating) return;
  rd();
  randomSeed(patSeed);
  gapsList=[];
  for (let i=0;i<N;i++) gapsList.push(mkGaps());

  allRings = gapsList.map((gaps,i) => ({
    gaps, birth:-9999, baseIndex:i, alphaStart:undefined
  }));
  offset=0; extraCount=0; animStartFrame=frameCount;
  animating=true; loop();
}

function stopAnim() {
  animating=false; paused=false; allRings=[]; offset=0; extraCount=0; noLoop();
}

// ════════════════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════════════════

// ── PNG بخلفية شفافة ─────────────────────────────────
function exportPNG() {
  rd();
  let cx = width/2+CX_OFF, cy = height/2+CY_OFF;
  let sw = THICK+1;
  let maxR = max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
  let fadeStart = DEADZONE >= 1 ? maxR*2 : maxR*DEADZONE;

  let pg = createGraphics(width, height);
  pg.clear();
  pg.angleMode(DEGREES);
  pg.strokeCap(SQUARE);
  pg.noFill();

  pg.push();
  pg.translate(cx,cy);
  pg.scale(SCALE);
  pg.translate(-cx,-cy);

  let rings = animating
    ? allRings.map(r=>({gaps:r.gaps,baseIndex:r.baseIndex}))
    : gapsList.map((gaps,i)=>({gaps,baseIndex:i}));

  for (let ring of rings) {
    let r = animating
      ? CENTER_R+THICK/2+ring.baseIndex*THICK+offset
      : CENTER_R+THICK/2+ring.baseIndex*THICK;
    let alpha = r>fadeStart ? map(r,fadeStart,maxR,255,0) : 255;
    alpha = constrain(alpha,0,255);
    if (alpha<=0) continue;

    let sorted = ring.gaps.slice().sort((a,b)=>a.s-b.s);
    let arcs=[],prev=0;
    for (let g of sorted){if(g.s>prev+0.2)arcs.push({s:prev,e:g.s});prev=g.e;}
    if (prev<360) arcs.push({s:prev,e:360});

    let c = pg.color(RING_COLOR); c.setAlpha(alpha);
    pg.stroke(c); pg.strokeWeight(sw);
    let rotOff = ringAngles[ring.baseIndex]||0;
    for (let a of arcs){
      let span=a.e-a.s; if(span<0.5)continue;
      if(span>=360)span=359.9;
      pg.arc(cx,cy,r*2,r*2,a.s+rotOff,a.s+rotOff+span);
    }
  }

  pg.noStroke(); pg.fill(0,0,0,0);
  pg.circle(cx,cy,CENTER_R*2);
  pg.pop();

  pg.canvas.toBlob(blob=>{
    let a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='pattern.png'; a.click();
  },'image/png');
  pg.remove();
}

// ── SVG صحيح ─────────────────────────────────────────
function exportSVG() {
  rd();
  let cx  = width/2+CX_OFF, cy = height/2+CY_OFF;
  let sw  = THICK+1;
  let maxR = max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
  let fadeStart = DEADZONE>=1 ? maxR*2 : maxR*DEADZONE;

  let svgParts=[
   `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    
    `<g transform="translate(${cx},${cy}) scale(${SCALE}) translate(${-cx},${-cy})">`,
  ];

  for (let i=0; i<gapsList.length; i++) {
    let r = CENTER_R+THICK/2+i*THICK;
    // تجاهل الحلقات الصغيرة جداً — تسبب مشكلة في SVG
    if (r < sw/2) continue;

    let alpha = r>fadeStart ? map(r,fadeStart,maxR,255,0) : 255;
    alpha = constrain(alpha,0,255);
    if (alpha<=0) continue;

    let opacity = (alpha/255).toFixed(3);
    let rotOff  = ringAngles[i]||0;

    let sorted = gapsList[i].slice().sort((a,b)=>a.s-b.s);
    let arcs=[],prev=0;
    for (let g of sorted){if(g.s>prev+0.2)arcs.push({s:prev,e:g.s});prev=g.e;}
    if (prev<360) arcs.push({s:prev,e:360});

    for (let a of arcs){
      let span = a.e-a.s;
      if (span < 1) continue;          // تجاهل الأقواس الصغيرة جداً
      if (span >= 360) span = 359.5;

      let startDeg = a.s+rotOff;
      let endDeg   = startDeg+span;
      let s1 = startDeg*Math.PI/180;
      let e1 = endDeg  *Math.PI/180;
      let x1 = cx+r*Math.cos(s1), y1 = cy+r*Math.sin(s1);
      let x2 = cx+r*Math.cos(e1), y2 = cy+r*Math.sin(e1);
      let large = span>180 ? 1 : 0;

      svgParts.push(
        `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)}" `+
        `fill="none" stroke="${RING_COLOR}" stroke-width="${sw}" stroke-linecap="butt" opacity="${opacity}"/>`
      );
    }
  }

  // دائرة المركز
  svgParts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${CENTER_R}" fill="none"/>`);
  svgParts.push('</g></svg>');

  let blob = new Blob([svgParts.join('\n')],{type:'image/svg+xml;charset=utf-8'});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pattern.svg';
  a.click();
}

// ── Video Recording (WebM) ────────────────────────────
let mediaRecorder = null;
let recordedChunks = [];
let gifRecording = false;

function startGIFRecording(btn) {
  if (!animating) { alert('Start animation first.'); return; }
  if (gifRecording) return;

  let canvas = document.querySelector('canvas');
  let stream = canvas.captureStream(60);

  // اختر أفضل format متاح
  let mimeType = '';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))
    mimeType = 'video/webm;codecs=vp9';
  else if (MediaRecorder.isTypeSupported('video/webm'))
    mimeType = 'video/webm';
  else if (MediaRecorder.isTypeSupported('video/mp4'))
    mimeType = 'video/mp4';

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, mimeType ? {mimeType} : {});

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    let ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
    let blob = new Blob(recordedChunks, {type: mimeType || 'video/webm'});
    let a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = `pattern.${ext}`;
    a.click();
    gifRecording = false;
    btn.html('⏺  Record Video');
    btn.style('color:#00ff78');
  };

  mediaRecorder.start();
  gifRecording = true;
  btn.html('⏹  Stop Recording');
  btn.style('color:#ff4d4d');

  // إيقاف تلقائي بعد 5 ثوان
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, 5000);
}

function exportGIFFrames() {}

// ════════════════════════════════════════════════════
function windowResized() { resizeCanvas(windowWidth,windowHeight); if(!animating)redraw(); }
function keyPressed() { if(key==='s'||key==='S') saveCanvas('pattern','png'); }
