// ════════════════════════════════════════════════════
//  PATTERN GENERATOR  ·  p5.js
// ════════════════════════════════════════════════════

// ── UI refs ──────────────────────────────────────────
let sl_thick, sl_density, sl_rings, sl_deadzone;
let sl_center, sl_cx, sl_cy, sl_scale;
let sl_speed, sl_intro;
let colorPicker;

// ── Default values (for reset) ───────────────────────
const DEF = {
  thick:8, density:4, rings:6, deadzone:80,
  center:30, cx:0, cy:0, scale:100,
  speed:5, intro:90,
  color:'#00ff78'
};

// ── Pattern state ────────────────────────────────────
let gapsList = [], patSeed = 1;

// ── Anim state ───────────────────────────────────────
let animating = false, animStartFrame = 0, paused = false;
let offset = 0, allRings = [], extraCount = 0;
// كل حلقة أصلية تخزن alphaStart لحظة بداية الأنيميشن
// allRings[i] = { gaps, birth, baseIndex, alphaStart }

// ── Computed values ──────────────────────────────────
let THICK, N, NG, MING, MAXG, SPD, CENTER_R, INTRO, DENSITY;
let CX_OFF, CY_OFF, RING_COLOR, DEADZONE, SCALE;

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
  DEADZONE = sl_deadzone ? sl_deadzone.value()/100  : 1;
  RING_COLOR = colorPicker ? colorPicker.value() : DEF.color;
}

// ════════════════════════════════════════════════════
function setup() {
  createCanvas(windowWidth, windowHeight);
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
    ['Center R',   'sl_center', 5,  200, DEF.center, 1],
    ['Scale',      'sl_scale',  10, 300, DEF.scale,  1],
    ['Position X', 'sl_cx',   -500, 500, DEF.cx,     1],
    ['Position Y', 'sl_cy',   -500, 500, DEF.cy,     1],
  ], { center: DEF.center, scale: DEF.scale, cx: DEF.cx, cy: DEF.cy });

  mkSection(panel, 'ANIMATION', [
    ['Speed',      'sl_speed', 1,  10, DEF.speed, 1],
    ['Trim Speed', 'sl_intro', 10,180, DEF.intro, 1],
  ], { speed: DEF.speed, intro: DEF.intro });

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
  colorPicker.style('width:34px;height:26px;border-radius:6px;border:1px solid #00ff7840;cursor:pointer;padding:2px;background:none;');

  let hex = createElement('input'); hex.parent(row);
  hex.attribute('type','text');
  hex.attribute('value','#00ff78');
  hex.attribute('maxlength','7');
  hex.attribute('class','pg-hex');
  hex.style(`flex:1;background:rgba(0,255,120,0.05);border:1px solid #00ff7830;
    border-radius:6px;color:#00ff78;font-family:'Space Grotesk',monospace;
    font-size:11px;padding:4px 8px;`);

  colorPicker.input(() => {
    hex.elt.value = colorPicker.value();
    if (!animating) redraw();
    // أثناء الحركة يعمل تلقائياً لأن loop() شغال
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

  let hint = createDiv('Export current frame or animation');
  hint.parent(col);
  hint.style('font-size:10px;color:#00ff7855;');

  let row1 = createDiv(''); row1.parent(col);
  row1.style('display:flex;gap:7px;');

  mkBtn(row1, 'PNG', '#00ff7822', '#00ff78', () => saveCanvas('pattern','png'));
  mkBtn(row1, 'SVG', '#00ff7822', '#00ff78', exportSVG);

  let row2 = createDiv(''); row2.parent(col);
  row2.style('display:flex;gap:7px;');

  mkBtn(row2, 'GIF (frames)', '#00ff7822', '#00ff78', exportGIFFrames);
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
        // أعد بناء الـ pattern بنفس الـ seed مع القيم الجديدة
        rd();
        randomSeed(patSeed);
        gapsList = [];
        for (let i=0; i<N; i++) gapsList.push(mkGaps());
        // حدّث الحلقات الأصلية في allRings
        for (let ring of allRings) {
          if (ring.birth < 0 && ring.baseIndex >= 0 && ring.baseIndex < gapsList.length) {
            ring.gaps = gapsList[ring.baseIndex];
            ring.alphaStart = undefined;
          }
        }
      }
      // Color, Speed, Thickness, Center R, Position X/Y → تعمل تلقائياً
    } else {
      if (lbl !== 'Deadzone') genPattern();
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

function easeInOut(t) {
  return t<0.5?2*t*t:1-pow(-2*t+2,2)/2;
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

  if (!animating) {
    // ── Static ────────────────────────────────────
    let maxR = max(
      dist(cx,cy,0,0), dist(cx,cy,width,0),
      dist(cx,cy,0,height), dist(cx,cy,width,height)
    ) * 1.1;
    // DEADZONE=1 → fadeStart=maxR*1.1 (لا fade أبداً)
    // DEADZONE=0 → fadeStart=0 (كل شيء يختفي من المركز)
    let fadeStart = maxR * DEADZONE;

    for (let i=0;i<gapsList.length;i++) {
      let r=CENTER_R+THICK/2+i*THICK;
      let alpha = DEADZONE >= 1 ? 255 : (r > fadeStart ? map(r, fadeStart, maxR, 255, 0) : 255);
      alpha = constrain(alpha, 0, 255);
      drawRing(cx,cy,r,gapsList[i],sw,alpha,1,0);
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

      drawRing(cx,cy,r,ring.gaps,sw, min(easedT*255,alphaOut), easedT, -(1-easedT)*25);
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
function exportSVG() {
  rd();
  let cx=width/2+CX_OFF, cy=height/2+CY_OFF;
  let sw=THICK+1;
  let svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="#05051a"/>`,
  ];

  for (let i=0;i<gapsList.length;i++) {
    let r=CENTER_R+THICK/2+i*THICK;
    let sorted=gapsList[i].slice().sort((a,b)=>a.s-b.s);
    let arcs=[]; let prev=0;
    for (let g of sorted) { if(g.s>prev+0.2) arcs.push({s:prev,e:g.s}); prev=g.e; }
    if(prev<360) arcs.push({s:prev,e:360});

    for (let a of arcs) {
      if(a.e-a.s<0.5) continue;
      let span=min(a.e-a.s,359.9);
      let s1=radians(a.s), e1=radians(a.s+span);
      let x1=cx+r*cos(s1), y1=cy+r*sin(s1);
      let x2=cx+r*cos(e1), y2=cy+r*sin(e1);
      let large=span>180?1:0;
      svgParts.push(`<path d="M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}"
        fill="none" stroke="${RING_COLOR}" stroke-width="${sw}" stroke-linecap="square"/>`);
    }
  }
  svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${CENTER_R}" fill="#05051a"/>`);
  svgParts.push('</svg>');

  let blob=new Blob([svgParts.join('\n')],{type:'image/svg+xml'});
  let a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='pattern.svg'; a.click();
}

function exportGIFFrames() {
  alert('GIF export: press S during animation to save frames as PNG.\nCombine them externally with ffmpeg or ezgif.com');
}

// ════════════════════════════════════════════════════
function windowResized() { resizeCanvas(windowWidth,windowHeight); if(!animating)redraw(); }
function keyPressed() { if(key==='s'||key==='S') saveCanvas('pattern','png'); }
