  /* ---------- field radio (contact) ---------- */
  var rd = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || rd).add(m); return m; }
  var chrome = Std({ color: 0xdfe3e8, roughness: .12, metalness: 1 });
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var rubber = Std({ color: 0x141414, roughness: .85 });

  // wooden crate
  var woodTex = canvasTex(256, 256, function (x, w, h) { var r = rnd(8); px(x, "#6e5134", 0, 0, w, h); for (var i = 0; i < 4; i++) { px(x, "rgba(30,20,10,.55)", 0, i * 64, w, 3); } for (var k = 0; k < 160; k++) { x.strokeStyle = "rgba(" + (r() > .5 ? "120,90,60" : "40,28,16") + "," + r() * .4 + ")"; x.lineWidth = .8; var y = r() * h; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (r() - .5) * 6); x.stroke(); } x.fillStyle = "rgba(20,20,20,.55)"; x.font = "700 30px 'Courier New', monospace"; x.fillText("FRÁGIL", 60, 140); });
  var crate = add(new THREE.Mesh(new THREE.BoxGeometry(1.1, .7, .8), Std({ map: woodTex, roughness: .85 }))); crate.position.set(0, .35, 0);

  // radio body: olive, rounded edges
  var olive = Std({ color: 0x3e4a2c, roughness: .6, metalness: .25 });
  function rbox(w, h, d, r, m) {
    var s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    var g = new THREE.ExtrudeGeometry(s, { depth: d - .04, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -(d - .04) / 2); return new THREE.Mesh(g, m);
  }
  var radio = new THREE.Group(); radio.position.set(-.05, .7 + .26, .02); rd.add(radio);
  add(rbox(.78, .5, .46, .05, olive), radio);
  var face = add(new THREE.Mesh(new THREE.BoxGeometry(.72, .44, .02), Std({ color: 0x1d2416, roughness: .7 })), radio); face.position.z = .235;
  // frequency display
  var disp = canvasTex(256, 64, function () {}, {});
  var dmesh = new THREE.Mesh(new THREE.PlaneGeometry(.34, .085), new THREE.MeshBasicMaterial({ map: disp, toneMapped: false })); dmesh.position.set(-.13, .12, .247); radio.add(dmesh);
  var bezel = add(new THREE.Mesh(new THREE.BoxGeometry(.37, .11, .015), black), radio); bezel.position.set(-.13, .12, .24);
  // dials
  var dialM = Std({ color: 0x111111, roughness: .35, metalness: .3 });
  [[-.25, -.07, .07], [-.03, -.07, .05], [.2, .12, .06], [.2, -.08, .045]].forEach(function (d0) {
    var dl = add(new THREE.Mesh(new THREE.CylinderGeometry(d0[2], d0[2] * 1.08, .05, 24), dialM), radio); dl.rotation.x = Math.PI / 2; dl.position.set(d0[0], d0[1], .26);
    var mark = add(new THREE.Mesh(new THREE.BoxGeometry(.008, d0[2] * .8, .01), Std({ color: 0xe9e2c8, roughness: .5 })), radio); mark.position.set(d0[0], d0[1] + d0[2] * .4, .288);
  });
  // toggle switches + jack + speaker
  [0, 1, 2].forEach(function (k) { var sw = add(new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .05, 8), chrome), radio); sw.rotation.x = Math.PI / 2 - .5; sw.position.set(.06 + k * .045, .13, .265); });
  var jack = add(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .03, 14), steel), radio); jack.rotation.x = Math.PI / 2; jack.position.set(.31, -.17, .25);
  for (var g0 = 0; g0 < 6; g0++) { var sl = add(new THREE.Mesh(new THREE.BoxGeometry(.012, .1, .01), black), radio); sl.position.set(.08 + g0 * .028, -.12, .25); }
  var rled = new THREE.Mesh(new THREE.CircleGeometry(.012, 10), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); rled.position.set(.31, .18, .247); radio.add(rled);
  // carry handles
  [-.3, .3].forEach(function (x) { var hd = add(new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 8, 16, Math.PI), steel), radio); hd.position.set(x, .27, 0); });
  // whip antenna (sways)
  var ant = new THREE.Group(); ant.position.set(.33, .27, -.15); radio.add(ant);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.02, .025, .06, 12), black), ant).position.y = .03;
  var whip = add(new THREE.Mesh(new THREE.CylinderGeometry(.004, .008, 1.9, 6), Std({ color: 0x222222, roughness: .4, metalness: .6 })), ant); whip.position.y = 1.0;
  var tip = add(new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), black), ant); tip.position.y = 1.96;
  // handset on a coiled cord, headphones on top
  var hs = new THREE.Group(); hs.position.set(-.42, .12, .38); hs.rotation.set(0, .4, Math.PI / 2 + .1); rd.add(hs);
  hs.position.set(-.48, .73, .22); hs.rotation.set(Math.PI / 2, 0, .6);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .22, 12), Std({ color: 0x1a1d14, roughness: .7 })), hs);
  [-.11, .11].forEach(function (y) { add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .035, .05, 16), Std({ color: 0x1a1d14, roughness: .7 })), hs).position.y = y; });
  var coilPts = []; for (var c = 0; c <= 160; c++) { var tt = c / 160; coilPts.push(new THREE.Vector3(-.43 + tt * .1 + Math.cos(tt * 60) * .018, .76 + Math.sin(tt * Math.PI) * .12 + tt * .05, .1 - tt * .05 + Math.sin(tt * 60) * .018)); }
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 400, .005, 5), black));
  var phones = new THREE.Group(); phones.position.set(-.1, .7 + .53, -.02); phones.rotation.set(-.15, .4, 0); rd.add(phones);
  add(new THREE.Mesh(new THREE.TorusGeometry(.12, .012, 8, 24, Math.PI), Std({ color: 0x1a1a1a, roughness: .5 })), phones).rotation.x = -Math.PI / 2 + .15;
  [-.12, .12].forEach(function (x) { var cup = add(new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .04, 20), Std({ color: 0x1a1d14, roughness: .7 })), phones); cup.position.set(x, -.02, 0); cup.rotation.z = Math.PI / 2; });

  // notepad with the contact written on it
  var noteTex = canvasTex(256, 320, function (x, w, h) {
    px(x, "#efe9d8", 0, 0, w, h); x.strokeStyle = "rgba(90,120,160,.35)"; x.lineWidth = 1; for (var y = 50; y < h; y += 26) { x.beginPath(); x.moveTo(10, y); x.lineTo(w - 10, y); x.stroke(); }
    px(x, "rgba(200,40,40,.4)", 30, 0, 2, h);
    x.fillStyle = "#1a1a2a"; x.font = "italic 700 20px 'Segoe Script', 'Brush Script MT', cursive";
    x.fillText("CONTACTO", 44, 42); x.font = "italic 600 17px 'Segoe Script', 'Brush Script MT', cursive";
    x.fillText("contactrainn", 44, 94); x.fillText("@gmail.com", 44, 120); x.fillText("+507 6591-4498", 44, 172); x.fillText("@iluvrainnsomuch", 44, 224);
    x.strokeStyle = "#c4111f"; x.lineWidth = 3; x.beginPath(); x.arc(196, 280, 18, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(196, 254); x.lineTo(196, 306); x.moveTo(170, 280); x.lineTo(222, 280); x.stroke();
    for (var s = 0; s < 9; s++) px(x, "#777", 20 + s * 26, 4, 10, 8);
  });
  var note = add(new THREE.Mesh(new THREE.BoxGeometry(.24, .006, .3), Std({ map: noteTex, roughness: .8 }))); note.position.set(.34, .705, .2); note.rotation.y = -.35;
  var pen = add(new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .15, 8), Std({ color: 0xc4111f, roughness: .3 }))); pen.rotation.set(0, .2, Math.PI / 2); pen.position.set(.36, .713, .03);

  // sandbags behind
  var bagTex = canvasTex(128, 128, function (x, w, h) { var r = rnd(3); px(x, "#6e6448", 0, 0, w, h); x.strokeStyle = "rgba(40,34,20,.35)"; x.lineWidth = 1; for (var i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (var j = 0; j < h; j += 3) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); } for (var k = 0; k < 40; k++) { x.fillStyle = "rgba(30,24,14," + r() * .3 + ")"; x.beginPath(); x.arc(r() * w, r() * h, 2 + r() * 8, 0, Math.PI * 2); x.fill(); } });
  var bagM = Std({ map: bagTex, roughness: .95 });
  function bag(x, y, z, ry) { var g = new THREE.SphereGeometry(.3, 18, 12), p = g.attributes.position; for (var i = 0; i < p.count; i++) { p.setX(i, p.getX(i) * 1.35); p.setY(i, p.getY(i) * .62 * (1 - Math.abs(p.getX(i)) * .12)); p.setZ(i, p.getZ(i) * .85); } g.computeVertexNormals(); var m = add(new THREE.Mesh(g, bagM)); m.position.set(x, y, z); m.rotation.y = ry; }
  bag(-.85, .18, -.7, .06); bag(-.05, .18, -.74, -.03); bag(.75, .18, -.7, .05); bag(-.45, .5, -.72, -.04); bag(.35, .5, -.74, .03); bag(1.35, .18, -.35, -.7);

  var turn = new THREE.Group(); turn.add(rd); scene.add(turn);
  var dispLight = new THREE.PointLight(0xffb347, .7, 1.4, 2); dispLight.position.set(-.18, 1.2, .6); rd.add(dispLight);

  function radioTick(t) {
    var x = disp.userData.ctx, w = 256, h = 64;
    px(x, "#120b02", 0, 0, w, h);
    x.fillStyle = "#ffb347"; x.font = "bold 34px monospace"; x.fillText("108.0", 12, 44); x.font = "bold 14px monospace"; x.fillText("MHz", 124, 44);
    var msg = "  CONTACTO · CONTACTRAINN@GMAIL.COM · +507 6591-4498 · @ILUVRAINNSOMUCH ·", off = Math.floor(t * 8) % msg.length;
    x.font = "bold 13px monospace"; x.fillText((msg + msg).substr(off, 11), 168, 26);
    for (var b = 0; b < 10; b++) { var lv = Math.abs(Math.sin(t * 5 + b * .7)) * 14; px(x, b > 7 ? "#ff4757" : "#ffb347", 168 + b * 8, 52 - lv, 5, lv); }
    disp.needsUpdate = true;
    ant.rotation.z = Math.sin(t * 1.3) * .03; ant.rotation.x = Math.sin(t * .9) * .02;
    rled.visible = Math.floor(t * 1.5) % 2 === 0;
  }
