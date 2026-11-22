  /* ---------- map wall (moodboard) ---------- */
  var grp = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || grp).add(m); return m; }
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var concTex = canvasTex(512, 512, function (x, w, h) { var r = rnd(12); px(x, "#5a5e63", 0, 0, w, h); for (var i = 0; i < 5000; i++) { var v = 60 + Math.floor(r() * 50); x.fillStyle = "rgba(" + v + "," + (v + 2) + "," + (v + 5) + "," + r() * .5 + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } for (var k = 0; k < 14; k++) { x.fillStyle = "rgba(25,25,28," + r() * .3 + ")"; x.fillRect(r() * w, 0, 2 + r() * 6, h); } px(x, "rgba(138,90,82,.8)", 0, h * .7, w, 10); });
  var wall = add(new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, .35), Std({ map: concTex, roughness: .95 }))); wall.position.set(0, 1.6, -.2);
  var FZ = -.02;
  var mapTex = canvasTex(1024, 640, function (x, w, h) {
    px(x, "#d7cfb6", 0, 0, w, h); var r = rnd(44);
    x.strokeStyle = "rgba(90,110,130,.35)"; x.lineWidth = 1; for (var i = 0; i < w; i += 48) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (var j = 0; j < h; j += 48) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
    x.fillStyle = "#b9c7b0"; x.strokeStyle = "#6a7a66"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 300); for (var k = 0; k <= 40; k++) x.lineTo(k * w / 40, 300 + Math.sin(k * .5) * 60 + Math.cos(k * 1.3) * 25 - k * 3); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = "rgba(60,80,110,.5)"; for (var c = 0; c < 6; c++) { x.beginPath(); x.ellipse(300 + c * 90, 480, 30 + c * 18, 16 + c * 8, 0, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = "rgba(40,40,40,.7)"; x.font = "700 18px 'Courier New', monospace"; x.fillText("PTY · SECTOR 1080", 30, 40); x.fillText("N 8°58'", w - 120, 40);
    for (var s = 0; s < 30; s++) { x.fillStyle = "rgba(90,70,40," + r() * .12 + ")"; x.beginPath(); x.arc(r() * w, r() * h, 10 + r() * 40, 0, Math.PI * 2); x.fill(); }
  });
  var map = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.62), Std({ map: mapTex, roughness: .7 }))); map.position.set(0, 1.85, FZ); map.castShadow = false;
  // photo factory
  function photo(kind, seed) { return canvasTex(200, 240, function (x, w, h) {
    var r = rnd(seed); px(x, "#f2efe8", 0, 0, w, h); var ix = 12, iy = 12, iw = w - 24, ih = h - 64;
    var g = x.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, kind === 2 ? "#1a2030" : "#2a2a2a"); g.addColorStop(1, "#0c0c0c"); x.fillStyle = g; x.fillRect(ix, iy, iw, ih);
    if (kind === 0) { x.fillStyle = "#e8e8e8"; x.beginPath(); x.arc(w / 2, iy + 60, 22, 0, Math.PI * 2); x.fill(); x.fillRect(w / 2 - 30, iy + 82, 60, 80); px(x, "#ffffff", w / 2 - 26, iy + 40, 52, 12); }
    if (kind === 1) { x.fillStyle = "#18664a"; x.fillRect(ix + 10, iy + 100, iw - 20, 40); x.beginPath(); x.ellipse(ix + 40, iy + 140, 14, 14, 0, 0, Math.PI * 2); x.ellipse(ix + iw - 40, iy + 140, 14, 14, 0, 0, Math.PI * 2); x.fillStyle = "#111"; x.fill(); }
    if (kind === 2) { for (var b = 0; b < 9; b++) { var bh = 30 + r() * 110; x.fillStyle = "rgba(20,24,34,1)"; x.fillRect(ix + b * 19, iy + ih - bh, 16, bh); for (var wv = 0; wv < 6; wv++) if (r() > .6) px(x, "#ffd27a", ix + b * 19 + 4, iy + ih - bh + 8 + wv * 14, 3, 3); } }
    if (kind === 3) { x.strokeStyle = "#ff2338"; x.lineWidth = 4; x.beginPath(); x.arc(w / 2, iy + ih / 2, 40, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(w / 2, iy + 20); x.lineTo(w / 2, iy + ih - 20); x.moveTo(ix + 20, iy + ih / 2); x.lineTo(ix + iw - 20, iy + ih / 2); x.stroke(); }
    if (kind === 4) { x.fillStyle = "#9c6a3c"; x.beginPath(); x.ellipse(w / 2, iy + 110, 60, 30, -.4, 0, Math.PI * 2); x.fill(); x.fillRect(w / 2 + 20, iy + 40, 18, 70); }
    if (kind === 5) { for (var p = 0; p < 30; p++) { x.fillStyle = "rgba(255,200,80," + r() + ")"; x.fillRect(ix + r() * iw, iy + r() * ih, 6, 2); } x.fillStyle = "#666"; x.beginPath(); x.moveTo(w / 2, iy + 30); x.lineTo(w / 2 + 30, iy + 120); x.lineTo(w / 2 - 30, iy + 120); x.fill(); }
    for (var n = 0; n < 1200; n++) { x.fillStyle = "rgba(255,255,255," + r() * .06 + ")"; x.fillRect(ix + r() * iw, iy + r() * ih, 1, 1); }
    x.fillStyle = "#333"; x.font = "italic 16px 'Segoe Script', cursive"; x.fillText(["rainn", "el carro", "PTY 3am", "la mira", "ASHHH", "SUELTA!"][kind], 16, h - 22);
  }); }
  var pins = [], pinM = Std({ color: 0xd4152a, roughness: .2 });
  var spots = [[-1.05, 2.35, .12], [-.35, 2.4, -.08], [.45, 2.3, .1], [1.1, 2.4, -.06], [-.8, 1.4, -.1], [.1, 1.35, .07], [.95, 1.45, -.12], [-1.45, 1.85, .05], [1.5, 1.9, -.04]];
  spots.forEach(function (s, i) {
    var ph = add(new THREE.Mesh(new THREE.BoxGeometry(.3, .36, .004), Std({ map: photo(i % 6, 70 + i), roughness: .3 }))); ph.position.set(s[0], s[1], FZ + .01 + i * .0015); ph.rotation.z = s[2]; ph.castShadow = false;
    var pin = add(new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), pinM)); pin.position.set(s[0] - Math.sin(s[2]) * .15, s[1] + .15, FZ + .035); pins.push(pin.position.clone());
  });
  // red string between pins
  var stringM = Std({ color: 0xc4111f, roughness: .5 });
  [[0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3], [7, 4], [5, 8], [0, 1]].forEach(function (pr) {
    var a = pins[pr[0]], b = pins[pr[1]], mid = a.clone().lerp(b, .5); mid.y -= .06; mid.z += .01;
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, .004, 4), stringM));
  });
  // masking tape on map corners
  [[-1.3, 2.66], [1.3, 2.66], [-1.3, 1.04], [1.3, 1.04]].forEach(function (c) { var t = add(new THREE.Mesh(new THREE.BoxGeometry(.18, .06, .004), Std({ color: 0xd8cfa8, roughness: .6 }))); t.position.set(c[0], c[1], FZ + .006); t.rotation.z = (c[0] > 0 ? -1 : 1) * .5; });
  // clamp work lamp on top of the wall
  var lampG = new THREE.Group(); lampG.position.set(0, 3.25, -.1); grp.add(lampG);
  add(new THREE.Mesh(new THREE.BoxGeometry(.12, .1, .4), steel), lampG);
  var arm = add(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .5, 8), steel), lampG); arm.position.set(0, .15, .25); arm.rotation.x = .9;
  var shade = add(new THREE.Mesh(new THREE.ConeGeometry(.16, .22, 20, 1, true), Std({ color: 0x1b1d20, roughness: .4, metalness: .6, side: THREE.DoubleSide })), lampG); shade.position.set(0, .3, .5); shade.rotation.x = -2.3;
  var bulbW = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff4dc, toneMapped: false })); bulbW.position.set(0, .26, .55); lampG.add(bulbW);
  var lampL = new THREE.SpotLight(0xfff0d8, 6, 5, .9, .6, 1.5); lampL.position.set(0, 3.5, .45); lampL.target.position.set(0, 1.8, -.1); grp.add(lampL); grp.add(lampL.target);
  // small table with markers + tape below
  var tbl = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, .04, .45), Std({ color: 0x2a2c30, roughness: .5, metalness: .5 }))); tbl.position.set(.9, .78, .35);
  [[-.45, -.18], [.45, -.18], [-.45, .18], [.45, .18]].forEach(function (l) { add(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .78, 8), steel)).position.set(.9 + l[0], .39, .35 + l[1]); });
  [0xc4111f, 0x111111, 0x2a6bd6].forEach(function (c, i) { var mk = add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .14, 10), Std({ color: c, roughness: .3 }))); mk.rotation.set(0, i * .6, Math.PI / 2); mk.position.set(.7 + i * .08, .815, .4); });
  var tape = add(new THREE.Mesh(new THREE.TorusGeometry(.05, .02, 8, 16), Std({ color: 0xd8cfa8, roughness: .6 }))); tape.rotation.x = Math.PI / 2; tape.position.set(1.15, .82, .3);
  var turn = new THREE.Group(); turn.add(grp); scene.add(turn);
  function mapaTick(t) { lampL.intensity = 6 + Math.sin(t * 13) * .05; }
