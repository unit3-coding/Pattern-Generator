// ════════════════════════════════════════════════════
//  PATTERN GENERATOR  ·  p5.js
// ════════════════════════════════════════════════════

let sl_thick, sl_density, sl_rings, sl_deadzone;
let sl_center, sl_cx, sl_cy, sl_scale, sl_rotation;
let sl_speed, sl_intro;
let colorPicker;

const DEF = {
  thick:8, density:4, rings:6, deadzone:80,
  center:30, cx:0, cy:0, scale:100, rotation:0,
  speed:5, intro:90, color:'#00ff66'
};

let ringAngles = {};
let gapsList = [], patSeed = 1;
let animating = false, animStartFrame = 0, paused = false;
let offset = 0, allRings = [], extraCount = 0;

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
  DEADZONE = sl_deadzone ? sl_deadzone.value()/100 : 0.8;
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
//  UI
// ════════════════════════════════════════════════════
function buildUI() {
  let style = createElement('style', `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
    * { box-sizing:border-box; }
    #pg-panel::-webkit-scrollbar { width:4px; }
    #pg-panel::-webkit-scrollbar-thumb { background:#00ff6640; border-radius:4px; }
    .pg-hex:focus { border-color:#00ff66 !important; outline:none; }
    .pg-slider-row { position:relative; }
    .pg-slider-row input[type=range]:hover::after { content:attr(data-val); }
    #pg-panel button { transition: border-color .2s, color .2s; }
    #pg-panel .sec-border { border-bottom:1px solid #00ff6618; }
  `);
  style.parent(document.head);

  let panel = createDiv('');
  panel.id('pg-panel');
  panel.style(`
    position:fixed; top:22px; left:22px;
    background:rgba(5,5,18,0.95);
    border:1px solid #00ff6635; border-radius:20px;
    padding:18px 18px 14px; display:flex; flex-direction:column; gap:8px;
    font-family:'Space Grotesk',monospace; font-size:12px;
    backdrop-filter:blur(16px); z-index:999;
    box-shadow:0 8px 40px rgba(0,0,0,0.5);
    width:260px; max-height:92vh; overflow-y:auto;
  `);

  // Logo + Title
  let titleRow = createDiv(''); titleRow.parent(panel);
  titleRow.style('display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #00ff6620;');

  let logo = createDiv(''); logo.parent(titleRow);
  logo.html(`<svg width="28" height="28" viewBox="0 0 188.02 262.04" xmlns="http://www.w3.org/2000/svg">
    <path fill="#00ff66" d="M1.59,0v45.4h156.28L187.85.25l.17-.25H1.59ZM186.9,146.94c-1.02-35.12-20.18-61.8-45.29-76.81l-25.12,37.96c12.84,6.94,23.92,19.72,24.95,38.85.06.97.08,1.94.08,2.94,0,28.07-17.23,42.59-35.47,57.96-3.97,3.33-8.06,6.78-11.97,10.45v-20.2c-19.64,0-48.69-15.33-48.69-48.21H0c0,50.13,36.7,83.68,75.94,91.72-2.84,6.08-4.57,12.83-4.57,20.45h45.41c0-3.89,11.15-13.27,18.53-19.5,20.55-17.31,51.62-43.5,51.62-92.67,0-.98-.01-1.96-.04-2.94Z"/>
  </svg>`);

  createDiv('PATTERN<br>GENERATOR').parent(titleRow).style(
    'color:#00ff66;font-size:11px;font-weight:700;letter-spacing:2px;line-height:1.5;');

  // Sections
  mkSection(panel, 'STYLE', [
    ['color'],
    ['Thickness',  'sl_thick',    3,  14, DEF.thick,    1],
    ['Density',    'sl_density',  1,  10, DEF.density,  1],
    ['Rings',      'sl_rings',    3,  30, DEF.rings,    1],
    ['Deadzone',   'sl_deadzone', 0, 100, DEF.deadzone, 1],
  ], { color:DEF.color, thick:DEF.thick, density:DEF.density, rings:DEF.rings, deadzone:DEF.deadzone });

  mkSection(panel, 'TRANSFORM', [
    ['Center R',   'sl_center',   5,  200, DEF.center, 1],
    ['Scale',      'sl_scale',   10,  300, DEF.scale,  1],
    ['Position X', 'sl_cx',    -500,  500, DEF.cx,     1],
    ['Position Y', 'sl_cy',    -500,  500, DEF.cy,     1],
  ], { center:DEF.center, scale:DEF.scale, cx:DEF.cx, cy:DEF.cy });

  mkSection(panel, 'ANIMATION', [
    ['Speed',          'sl_speed',    1,  10, DEF.speed,    1],
    ['Trim Speed',     'sl_intro',   10, 180, DEF.intro,    1],
    ['Rotation Speed', 'sl_rotation', 0, 100, DEF.rotation, 1],
  ], { speed:DEF.speed, intro:DEF.intro, rotation:DEF.rotation });

  mkSection(panel, 'EXPORT', [['export']], {});

  // Action buttons
  let bRow = createDiv(''); bRow.parent(panel);
  bRow.style('display:flex;gap:8px;padding-top:6px;');
  mkBtn(bRow, '⟳  New', '#00ff66', '#05051a', () => { stopAnim(); genPattern(); redraw(); });
  mkBtn(bRow, '▶  Animate', 'transparent', '#00ff66', startAnim);

  let bRow3 = createDiv(''); bRow3.parent(panel);
  bRow3.style('display:flex;gap:8px;border-top:1px solid #00ff6618;padding-top:8px;');
  mkBtn(bRow3, '↺  Reset All', '#ff4d4d15', '#ff4d4d', () => {
    stopAnim();
    if(sl_thick)    sl_thick.value(DEF.thick);
    if(sl_density)  sl_density.value(DEF.density);
    if(sl_rings)    sl_rings.value(DEF.rings);
    if(sl_deadzone) sl_deadzone.value(DEF.deadzone);
    if(sl_center)   sl_center.value(DEF.center);
    if(sl_scale)    sl_scale.value(DEF.scale);
    if(sl_rotation) sl_rotation.value(DEF.rotation);
    if(sl_cx)       sl_cx.value(DEF.cx);
    if(sl_cy)       sl_cy.value(DEF.cy);
    if(sl_speed)    sl_speed.value(DEF.speed);
    if(sl_intro)    sl_intro.value(DEF.intro);
    if(colorPicker) { colorPicker.value(DEF.color); let h=document.querySelector('.pg-hex'); if(h)h.value=DEF.color; }
    genPattern(); redraw();
  });
}

function mkSection(panel, title, fields, defaults) {
  let wrap = createDiv(''); wrap.parent(panel);
  wrap.class('sec-border');
  wrap.style('border-bottom:1px solid #00ff6618;');

  let hdr = createDiv(''); hdr.parent(wrap);
  hdr.style('display:flex;justify-content:space-between;align-items:center;padding:8px 0;cursor:pointer;user-select:none;');

  let lRow = createDiv(''); lRow.parent(hdr);
  lRow.style('display:flex;align-items:center;gap:6px;');
  let arrow = createSpan('▸'); arrow.parent(lRow);
  arrow.style('color:#00ff6655;font-size:11px;');

  let secLbl = createDiv(title); secLbl.parent(lRow);
  secLbl.style('color:#00ff66;font-size:10px;font-weight:700;letter-spacing:2px;');

  let rst = createDiv('↺'); rst.parent(hdr);
  rst.style('color:#00ff6644;font-size:13px;padding:2px 6px;border-radius:5px;cursor:pointer;');
  rst.elt.onmouseenter = () => rst.style('color:#00ff66');
  rst.elt.onmouseleave = () => rst.style('color:#00ff6644');

  let body = createDiv(''); body.parent(wrap);
  body.style('display:none;flex-direction:column;gap:9px;padding:8px 0 12px;');

  let open = false;
  hdr.mousePressed((e) => {
    if (e.target === rst.elt) return;
    open = !open;
    body.style('display', open ? 'flex' : 'none');
    arrow.html(open ? '▾' : '▸');
  });

  let sliders = {};
  for (let f of fields) {
    if      (f[0]==='color')  mkColorRow(body);
    else if (f[0]==='export') mkExportRow(body);
    else {
      let [lbl, varName, mn, mx, val, step] = f;
      let sl = mkSlider(body, lbl, mn, mx, val, step);
      sliders[varName] = sl;
      if(varName==='sl_thick')    sl_thick    = sl;
      if(varName==='sl_density')  sl_density  = sl;
      if(varName==='sl_rings')    sl_rings    = sl;
      if(varName==='sl_deadzone') sl_deadzone = sl;
      if(varName==='sl_center')   sl_center   = sl;
      if(varName==='sl_scale')    sl_scale    = sl;
      if(varName==='sl_rotation') sl_rotation = sl;
      if(varName==='sl_cx')       sl_cx       = sl;
      if(varName==='sl_cy')       sl_cy       = sl;
      if(varName==='sl_speed')    sl_speed    = sl;
      if(varName==='sl_intro')    sl_intro    = sl;
    }
  }

  rst.mousePressed(() => {
    for (let [k, sl] of Object.entries(sliders)) {
      let key = k.replace('sl_','');
      if (defaults[key] !== undefined) sl.value(defaults[key]);
    }
    if (defaults.color && colorPicker) {
      colorPicker.value(defaults.color);
      let h = document.querySelector('.pg-hex'); if(h) h.value = defaults.color;
    }
    if (!animating) { genPattern(); redraw(); }
  });
}

// ── Color row ─────────────────────────────────────────
function mkColorRow(parent) {
  let row = createDiv(''); row.parent(parent);
  row.style('display:flex;align-items:center;gap:8px;');
  createDiv('Color').parent(row).style('font-size:10px;color:#00ff6666;min-width:72px;');

  colorPicker = createColorPicker('#00ff66');
  colorPicker.parent(row);
  colorPicker.style('width:32px;height:32px;border-radius:6px;border:1px solid #00ff6640;cursor:pointer;padding:0;background:none;flex-shrink:0;');

  let hex = createElement('input'); hex.parent(row);
  hex.attribute('type','text'); hex.attribute('value','#00ff66');
  hex.attribute('maxlength','7'); hex.attribute('class','pg-hex');
  hex.style('width:76px;background:rgba(0,255,120,0.05);border:1px solid #00ff6630;border-radius:6px;color:#00ff66;font-family:"Space Grotesk",monospace;font-size:11px;padding:4px 8px;flex-shrink:0;');

  colorPicker.input(() => {
    hex.elt.value = colorPicker.value();
    if(!animating) redraw();
  });
  hex.input(() => {
    let v = hex.elt.value;
    if(/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorPicker.value(v);
      if(!animating) redraw();
    }
  });
}

// ── Export row ────────────────────────────────────────
let mediaRecorder = null, recordedChunks = [], gifRecording = false;

function mkExportRow(parent) {
  let col = createDiv(''); col.parent(parent);
  col.style('display:flex;flex-direction:column;gap:7px;');
  let hint = createDiv('Export current view'); hint.parent(col);
  hint.class('export-hint');
  hint.style('font-size:10px;color:#00ff6655;');

  let row1 = createDiv(''); row1.parent(col); row1.style('display:flex;gap:7px;');
  mkBtn(row1, 'PNG', '#00ff6622', '#00ff66', exportPNG);
  mkBtn(row1, 'SVG', '#00ff6622', '#00ff66', exportSVG);

  let row2 = createDiv(''); row2.parent(col); row2.style('display:flex;gap:7px;');
  let vBtn = mkBtn(row2, '⏺  Record Video', '#00ff6622', '#00ff66', () => {
    if (!animating) { alert('Start animation first.'); return; }
    if (gifRecording) { mediaRecorder && mediaRecorder.stop(); return; }
    startVideoRecording(vBtn, recControls);
  });

  // Pause & Stop — مخفيان حتى يبدأ التسجيل
  let recControls = createDiv(''); recControls.parent(col);
  recControls.style('display:none;gap:7px;');

  let bP = mkBtn(recControls, '⏸  Pause', 'transparent', '#00ff6699', () => {
    if (!animating) return;
    paused = !paused;
    if (paused) { noLoop(); bP.html('▶  Resume'); bP.style('color:#00ff66'); }
    else        { loop();   bP.html('⏸  Pause');  bP.style('color:#00ff6699'); }
  });

  mkBtn(recControls, '■  Stop', 'transparent', '#ff4d4d88', () => {
    stopAnim();
    bP.html('⏸  Pause'); bP.style('color:#00ff6699');
    recControls.style('display','none');
    vBtn.html('⏺  Record Video'); vBtn.style('color:#00ff66');
    gifRecording = false;
    genPattern(); redraw();
  });
}

// ── Slider ────────────────────────────────────────────
function mkSlider(par, lbl, mn, mx, val, step) {
  let row = createDiv(''); row.parent(par);
  row.style('display:flex;align-items:center;gap:8px;');
  row.class('pg-slider-row');

  let lblEl = createDiv(lbl); lblEl.parent(row);
  lblEl.style('font-size:10px;color:#00ff6666;min-width:72px;white-space:nowrap;');

  // position: range ديناميكي
  let actualMn = mn, actualMx = mx;
  if (lbl === 'Position X') { actualMn = -windowWidth/2;  actualMx = windowWidth/2;  }
  if (lbl === 'Position Y') { actualMn = -windowHeight/2; actualMx = windowHeight/2; }

  let sl = createSlider(actualMn, actualMx, val, step); sl.parent(row);
  sl.style('flex:1;accent-color:#00ff66;');
  sl.elt.title = String(val); // tooltip يظهر عند hover

  sl.input(() => {
    sl.elt.title = String(sl.value()); // حدّث الـ tooltip
    if (animating) {
      if (lbl === 'Deadzone') {
        for (let ring of allRings) { if (ring.birth < 0) ring.alphaStart = undefined; }
      } else if (lbl === 'Rings' || lbl === 'Density') {
        rd();
        randomSeed(patSeed); gapsList = [];
        for (let i=0;i<N;i++) gapsList.push(mkGaps());
        for (let ring of allRings) {
          if (ring.birth<0 && ring.baseIndex>=0 && ring.baseIndex<gapsList.length) {
            ring.gaps = gapsList[ring.baseIndex]; ring.alphaStart = undefined;
          }
        }
      }
    } else {
      if (lbl !== 'Deadzone' && lbl !== 'Rotation Speed') genPattern();
      noLoop(); redraw();
    }
  });
  return sl;
}

function mkBtn(par, txt, bg, col, fn) {
  let b = createButton(txt); b.parent(par);
  b.style(`background:${bg};color:${col};border:1px solid #00ff6650;border-radius:8px;padding:8px 0;cursor:pointer;flex:1;font-family:'Space Grotesk',monospace;font-size:11px;font-weight:600;`);
  // سجّل للتلوين إذا كان اللون هو اللون الأساسي
  if (col === '#00ff66' || col === '#00ff6699') {
  }
  b.mousePressed(fn); return b;
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
  // الحد الأدنى لحجم القوس = نصف حجم الفجوة الصغيرة
  let minArc = max(MING * 0.8, 15);

  while (gaps.length<n && tries<2000) {
    tries++;
    let s=random(0,360), e=s+random(MING,MAXG);
    let ok=true;
    for (let g of gaps) {
      if(s<g.e+minArc&&e>g.s-minArc){ok=false;break;}
    }
    if(ok) gaps.push({s,e});
  }

  // تحقق: احذف الفجوات التي تخلق أقواساً صغيرة جداً
  gaps.sort((a,b)=>a.s-b.s);
  let filtered = [];
  let prev = 0;
  for (let g of gaps) {
    // القوس قبل هذه الفجوة
    if (g.s - prev >= minArc) {
      filtered.push(g);
      prev = g.e;
    }
  }
  // القوس الأخير (من آخر فجوة إلى 360)
  if (filtered.length > 0) {
    let last = filtered[filtered.length-1];
    if (360 - last.e < minArc) filtered.pop(); // احذف الفجوة إذا القوس الأخير صغير
  }

  return filtered.length > 0 ? filtered : gaps.slice(0,1);
}

// ════════════════════════════════════════════════════
//  DRAW HELPERS
// ════════════════════════════════════════════════════
function easeInOut(t) { return t<0.5?2*t*t:1-pow(-2*t+2,2)/2; }

function drawRing(cx,cy,r,gaps,sw,alpha,progress,rotOff) {
  if (r < sw*0.6 || alpha<=0||progress<=0) return; // تجنب الحلقات الصغيرة جداً
  let sorted = gaps.slice().sort((a,b)=>a.s-b.s);
  let arcs=[], prev=0;
  for (let g of sorted) { if(g.s>prev+0.2)arcs.push({s:prev,e:g.s}); prev=g.e; }
  if (prev<360) arcs.push({s:prev,e:360});
  let n=arcs.length; if(n===0)return;

  let c=color(RING_COLOR); c.setAlpha(alpha);
  stroke(c); strokeWeight(sw); strokeCap(SQUARE); noFill();

  let overlap=0.4;
  for (let i=0;i<n;i++) {
    let ss=(i/n)*(1-overlap), den=1-ss;
    if(den<0.001)continue;
    let el=easeInOut(constrain((progress-ss)/den,0,1));
    if(el<=0.001)continue;
    let a=arcs[i], span=(a.e-a.s)*el;
    if(span<2)continue;  // تجاهل الأقواس الأقل من 2 درجة
    if(span>=360)span=359.9;
    arc(cx,cy,r*2,r*2, a.s+rotOff, a.s+rotOff+span);
  }
}

function getRingRotOffset(idx) {
  // offset عشوائي ثابت لكل حلقة (بين 0 و 360)
  return ((sin(idx*127.1+3.7)*0.5+cos(idx*311.7+1.2)*0.5+1)/2) * 360;
}

function getRingFactor(idx) {
  return 0.3 + abs(sin(idx*127.1+1.5))*0.7;
}

function updateRingAngles() {
  let spd = sl_rotation ? sl_rotation.value()*0.003 : 0;
  if(spd===0)return;
  for(let i=0;i<gapsList.length;i++){
    if(ringAngles[i]===undefined)ringAngles[i]=0;
    ringAngles[i]+=spd*getRingFactor(i);
  }
  for(let ring of allRings){
    let k=ring.baseIndex;
    if(ringAngles[k]===undefined)ringAngles[k]=0;
    ringAngles[k]+=spd*getRingFactor(k);
  }
}

// ════════════════════════════════════════════════════
//  DRAW
// ════════════════════════════════════════════════════
function draw() {
  background(5,5,20);
  rd();
  let cx=width/2+CX_OFF, cy=height/2+CY_OFF;
  let sw=THICK + 0.1;

  push();
  translate(cx,cy); scale(SCALE); translate(-cx,-cy);

  if(!paused && animating) updateRingAngles();

  if(!animating) {
    let maxR=max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
    let fadeStart=maxR*DEADZONE;
    for(let i=0;i<gapsList.length;i++){
      let r=CENTER_R+THICK/2+i*THICK;
      let alpha=DEADZONE>=1?255:(r>fadeStart?map(r,fadeStart,maxR,255,0):255);
      alpha=constrain(alpha,0,255);
      // offset عشوائي ثابت + دوران متراكم
      let rotOff = getRingRotOffset(i) + (ringAngles[i]||0);
      drawRing(cx,cy,r,gapsList[i],sw,alpha,1,rotOff);
    }
  } else {
    offset+=SPD;
    let needed=floor(offset/THICK);
    while(extraCount<needed){
      extraCount++;
      randomSeed(patSeed+extraCount*31337);
      allRings.unshift({gaps:mkGaps(),birth:frameCount,baseIndex:-extraCount});
    }

    let maxR=max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
    let fadeStart=DEADZONE>=1?maxR*2:maxR*DEADZONE;
    let animAge=frameCount-animStartFrame;

    for(let ring of allRings){
      let r=CENTER_R+THICK/2+ring.baseIndex*THICK+offset;
      if(r<CENTER_R+THICK*0.1)continue;
      if(r>maxR+THICK)continue;

      let targetAlpha=constrain(r>fadeStart?map(r,fadeStart,maxR,255,0):255,0,255);

      let alphaOut;
      if(ring.birth<0){
        if(ring.alphaStart===undefined){
          let r0=CENTER_R+THICK/2+ring.baseIndex*THICK;
          ring.alphaStart=constrain(r0>fadeStart?map(r0,fadeStart,maxR,255,0):255,0,255);
        }
        let gap=abs(ring.alphaStart-targetAlpha);
        let fadeDur=map(gap,0,255,INTRO*0.5,INTRO*2.5);
        alphaOut=lerp(ring.alphaStart,targetAlpha,easeInOut(constrain(animAge/fadeDur,0,1)));
      } else {
        alphaOut=targetAlpha;
      }
      if(alphaOut<=0)continue;

      let age=ring.birth<0?INTRO+1:(frameCount-ring.birth);
      let easedT=easeInOut(constrain(age/INTRO,0,1));
      // offset عشوائي ثابت + دوران متراكم + intro rotation
      let rotOff=getRingRotOffset(ring.baseIndex)+(ringAngles[ring.baseIndex]||0)-(1-easedT)*25;
      drawRing(cx,cy,r,ring.gaps,sw,min(easedT*255,alphaOut),easedT,rotOff);
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
  if(animating)return;
  rd();
  randomSeed(patSeed); gapsList=[];
  for(let i=0;i<N;i++) gapsList.push(mkGaps());
  allRings=gapsList.map((gaps,i)=>({gaps,birth:-9999,baseIndex:i,alphaStart:undefined}));
  offset=0; extraCount=0; animStartFrame=frameCount;
  animating=true; loop();
}

function stopAnim() {
  animating=false; paused=false; allRings=[]; offset=0; extraCount=0; noLoop();
}

// ════════════════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════════════════
function exportPNG() {
  rd();
  let cx=width/2+CX_OFF, cy=height/2+CY_OFF, sw=THICK+0.1;
  let maxR=max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
  let fadeStart=DEADZONE>=1?maxR*2:maxR*DEADZONE;

  let pg=createGraphics(width,height);
  pg.clear(); pg.angleMode(DEGREES); pg.strokeCap(SQUARE); pg.noFill();
  pg.push(); pg.translate(cx,cy); pg.scale(SCALE); pg.translate(-cx,-cy);

  let rings=animating?allRings.map(r=>({gaps:r.gaps,baseIndex:r.baseIndex})):gapsList.map((gaps,i)=>({gaps,baseIndex:i}));
  for(let ring of rings){
    let r=animating?CENTER_R+THICK/2+ring.baseIndex*THICK+offset:CENTER_R+THICK/2+ring.baseIndex*THICK;
    let alpha=constrain(r>fadeStart?map(r,fadeStart,maxR,255,0):255,0,255);
    if(alpha<=0)continue;
    let sorted=ring.gaps.slice().sort((a,b)=>a.s-b.s);
    let arcs=[],prev=0;
    for(let g of sorted){if(g.s>prev+0.2)arcs.push({s:prev,e:g.s});prev=g.e;}
    if(prev<360)arcs.push({s:prev,e:360});
    let c=pg.color(RING_COLOR); c.setAlpha(alpha);
    pg.stroke(c); pg.strokeWeight(sw);
    let rotOff=getRingRotOffset(ring.baseIndex)+(ringAngles[ring.baseIndex]||0);
    for(let a of arcs){
      let span=a.e-a.s; if(span<0.5)continue; if(span>=360)span=359.9;
      pg.arc(cx,cy,r*2,r*2,a.s+rotOff,a.s+rotOff+span);
    }
  }
  pg.noStroke(); pg.fill(0,0,0,0); pg.circle(cx,cy,CENTER_R*2); pg.pop();
  pg.canvas.toBlob(blob=>{
    let a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pattern.png'; a.click();
  },'image/png');
  pg.remove();
}

function exportSVG() {
  rd();
  let cx=width/2+CX_OFF, cy=height/2+CY_OFF, sw=THICK+0.1;
  let maxR=max(dist(cx,cy,0,0),dist(cx,cy,width,0),dist(cx,cy,0,height),dist(cx,cy,width,height))*1.1;
  let fadeStart=DEADZONE>=1?maxR*2:maxR*DEADZONE;

  let parts=[
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<g transform="translate(${cx},${cy}) scale(${SCALE}) translate(${-cx},${-cy})">`,
  ];

  for(let i=0;i<gapsList.length;i++){
    let r=CENTER_R+THICK/2+i*THICK;
    if(r<sw/2)continue;
    let alpha=constrain(r>fadeStart?map(r,fadeStart,maxR,255,0):255,0,255);
    if(alpha<=0)continue;
    let op=(alpha/255).toFixed(3);
    let rotOff=getRingRotOffset(i)+(ringAngles[i]||0);
    let sorted=gapsList[i].slice().sort((a,b)=>a.s-b.s);
    let arcs=[],prev=0;
    for(let g of sorted){if(g.s>prev+0.2)arcs.push({s:prev,e:g.s});prev=g.e;}
    if(prev<360)arcs.push({s:prev,e:360});
    for(let a of arcs){
      let span=a.e-a.s; if(span<1)continue; if(span>=360)span=359.5;
      let s1=(a.s+rotOff)*Math.PI/180, e1=(a.s+rotOff+span)*Math.PI/180;
      let x1=(cx+r*Math.cos(s1)).toFixed(1), y1=(cy+r*Math.sin(s1)).toFixed(1);
      let x2=(cx+r*Math.cos(e1)).toFixed(1), y2=(cy+r*Math.sin(e1)).toFixed(1);
      parts.push(`<path d="M${x1},${y1} A${r},${r} 0 ${span>180?1:0},1 ${x2},${y2}" fill="none" stroke="${RING_COLOR}" stroke-width="${sw}" stroke-linecap="butt" opacity="${op}"/>`);
    }
  }
  parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${CENTER_R}" fill="#05051a"/>`);
  parts.push('</g></svg>');
  let blob=new Blob([parts.join('\n')],{type:'image/svg+xml;charset=utf-8'});
  let a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pattern.svg'; a.click();
}

function startVideoRecording(btn, recControls) {
  let canvas=document.querySelector('canvas');
  let stream=canvas.captureStream(60);
  let mimeType='';
  if(MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))mimeType='video/webm;codecs=vp9';
  else if(MediaRecorder.isTypeSupported('video/webm'))mimeType='video/webm';
  else if(MediaRecorder.isTypeSupported('video/mp4'))mimeType='video/mp4';
  recordedChunks=[];
  mediaRecorder=new MediaRecorder(stream,mimeType?{mimeType}:{});
  mediaRecorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
  mediaRecorder.onstop=()=>{
    let ext=mimeType.includes('mp4')?'mp4':'webm';
    let blob=new Blob(recordedChunks,{type:mimeType||'video/webm'});
    let a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`pattern.${ext}`; a.click();
    gifRecording=false;
    btn.html('⏺  Record Video'); btn.style('color:#00ff66');
    if(recControls) recControls.style('display','none');
  };
  mediaRecorder.start(); gifRecording=true;
  btn.html('⏹  Stop (10s)'); btn.style('color:#ff4d4d');
  if(recControls) recControls.style('display','flex');
  setTimeout(()=>{if(mediaRecorder&&mediaRecorder.state==='recording')mediaRecorder.stop();},10000);
}

// ════════════════════════════════════════════════════
function windowResized() {
  resizeCanvas(windowWidth,windowHeight);
  // حدّث نطاق سلايدرات الـ position
  if(sl_cx) { sl_cx.elt.min=-windowWidth/2;  sl_cx.elt.max=windowWidth/2; }
  if(sl_cy) { sl_cy.elt.min=-windowHeight/2; sl_cy.elt.max=windowHeight/2; }
  if(!animating) redraw();
}
function keyPressed(){if(key==='s'||key==='S')saveCanvas('pattern','png');}
