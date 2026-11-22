  /* ---------- surveillance station (the numbers) ---------- */
  var sta = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || sta).add(m); return m; }
  var chrome = Std({ color: 0xdfe3e8, roughness: .12, metalness: 1 });
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var rubber = Std({ color: 0x151515, roughness: .85 });

  // grated mezzanine floor piece + railing behind
  var grate = canvasTex(128, 128, function (x, w, h) { px(x, "#1a1c1f", 0, 0, w, h); x.fillStyle = "#3a3e44"; for (var i = 0; i < w; i += 8) { x.fillRect(i, 0, 2, h); x.fillRect(0, i, w, 2); } }, {});
  grate.wrapS = grate.wrapT = THREE.RepeatWrapping; grate.repeat.set(6, 4);
  var deck = add(new THREE.Mesh(new THREE.BoxGeometry(3.6, .06, 2.4), Std({ map: grate, roughness: .5, metalness: .7 }))); deck.position.set(0, .03, -.2);
  [-1.75, -.6, .6, 1.75].forEach(function (x) { add(new THREE.Mesh(new THREE.BoxGeometry(.05, 1.05, .05), steel)).position.set(x, .55, -1.35); });
  add(new THREE.Mesh(new THREE.BoxGeometry(3.6, .05, .05), steel)).position.set(0, 1.07, -1.35);
  add(new THREE.Mesh(new THREE.BoxGeometry(3.6, .035, .035), steel)).position.set(0, .6, -1.35);

  // olive military crates
  var crateTex = canvasTex(256, 256, function (x, w, h) {
    var r = rnd(17); px(x, "#3f4a2e", 0, 0, w, h);
    for (var i = 0; i < 900; i++) { x.fillStyle = "rgba(" + (r() > .5 ? "90,100,70" : "20,24,14") + "," + r() * .25 + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }
    x.strokeStyle = "rgba(15,18,10,.8)"; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
    x.fillStyle = "rgba(225,215,170,.75)"; x.font = "700 26px 'Courier New', monospace"; x.fillText("1080-CMD", 30, 120); x.font = "700 18px 'Courier New', monospace"; x.fillText("LOT 07/23", 30, 150);
  });
  var crate = Std({ map: crateTex, roughness: .75, metalness: .1 });
  var c1 = add(new THREE.Mesh(new THREE.BoxGeometry(2.4, .62, .8), crate)); c1.position.set(0, .37, -.55);
  [-1.15, 1.15].forEach(function (x) { add(new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .4), steel)).position.set(x, .5, -.55); });

  // CRT monitor factory
  var screens = [];
  function monitor(x, y, z, ry, w, h, d) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; sta.add(g);
    var shellM = Std({ color: 0x2a2c2f, roughness: .55 });
    var front = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, .08), shellM), g);
    var bgeo = new THREE.BoxGeometry(w * .95, h * .92, d), bp = bgeo.attributes.position;
    for (var i = 0; i < bp.count; i++) if (bp.getZ(i) < 0) { bp.setX(i, bp.getX(i) * .6); bp.setY(i, bp.getY(i) * .65 + .02); }
    bgeo.computeVertexNormals(); var back = add(new THREE.Mesh(bgeo, shellM), g); back.position.z = -d / 2 - .04;
    var cv = canvasTex(192, 144, function () {}, { pixel: true });
    var sgeo = new THREE.PlaneGeometry(w * .8, h * .76, 12, 10), sp = sgeo.attributes.position;
    for (var k = 0; k < sp.count; k++) { var X = sp.getX(k), Y = sp.getY(k); sp.setZ(k, .03 - (X * X + Y * Y) * .2); }
    var sc = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ map: cv, toneMapped: false })); sc.position.set(0, .01, .03); g.add(sc);
    var gl = new THREE.Mesh(sgeo.clone(), new THREE.MeshPhysicalMaterial({ color: 0x061014, roughness: .03, transparent: true, opacity: .14, clearcoat: 1, envMapIntensity: 1.5, depthWrite: false })); gl.position.set(0, .01, .04); g.add(gl);
    var ledM = new THREE.Mesh(new THREE.CircleGeometry(.01, 8), new THREE.MeshBasicMaterial({ color: 0x3fff7a, toneMapped: false })); ledM.position.set(w / 2 - .06, -h / 2 + .04, .041); g.add(ledM);
    screens.push(cv); return g;
  }
  monitor(-.78, .98, -.5, .18, .72, .56, .5);
  monitor(0, .98, -.55, 0, .72, .56, .5);
  monitor(.78, .98, -.5, -.18, .72, .56, .5);
  monitor(-.38, 1.55, -.6, .08, .62, .48, .42);
  monitor(.4, 1.55, -.6, -.08, .62, .48, .42);
  var cyan = new THREE.PointLight(0x2bd6e8, 1.6, 3.2, 2); cyan.position.set(0, 1.2, .5); sta.add(cyan);

  // keyboard, mug, folding chair, cables
  var kb = add(new THREE.Mesh(new THREE.BoxGeometry(.6, .03, .2), Std({ color: 0x2a2c2f, roughness: .6 }))); kb.position.set(-.1, .695, -.08); kb.rotation.y = .05;
  for (var r0 = 0; r0 < 4; r0++) for (var k0 = 0; k0 < 12; k0++) { var key = new THREE.Mesh(new THREE.BoxGeometry(.035, .012, .035), Std({ color: 0x3a3d42, roughness: .5 })); key.position.set(-.1 - .26 + k0 * .046, .715, -.08 - .06 + r0 * .042); key.rotation.y = .05; sta.add(key); }
  var mug = add(new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 20), Std({ color: 0xe8e4da, roughness: .4 }))); mug.position.set(.62, .73, -.15);
  var handle = add(new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 16, Math.PI), Std({ color: 0xe8e4da, roughness: .4 }))); handle.position.set(.67, .73, -.15); handle.rotation.z = -Math.PI / 2;
  var chair = new THREE.Group(); chair.position.set(.25, .06, .75); chair.rotation.y = .4; sta.add(chair);
  var seatM = Std({ color: 0x20232a, roughness: .5, metalness: .5 });
  add(new THREE.Mesh(new THREE.BoxGeometry(.42, .03, .4), seatM), chair).position.y = .44;
  add(new THREE.Mesh(new THREE.BoxGeometry(.42, .32, .03), seatM), chair).position.set(0, .74, .2);
  [[-.19, -.18, .2], [.19, -.18, .2], [-.19, .2, -.2], [.19, .2, -.2]].forEach(function (l) { var leg = add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .62, 8), steel), chair); leg.position.set(l[0], .3, l[1] * .9); leg.rotation.x = l[2]; });
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.6, .95, -.85), new THREE.Vector3(-.9, .5, -.95), new THREE.Vector3(-1.1, .08, -.6), new THREE.Vector3(-1.4, .07, .4), new THREE.Vector3(-1.6, .07, 1.0)]), 40, .015, 6), rubber));
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.6, .95, -.85), new THREE.Vector3(.9, .4, -1.0), new THREE.Vector3(1.2, .08, -.7), new THREE.Vector3(1.7, .07, -.9)]), 40, .015, 6), rubber));

  sta.position.set(0, 0, .1);
  var turn = new THREE.Group(); turn.add(sta); scene.add(turn);

  /* screens: radar + the five numbers */
  var nums = [["1.2M", "VISTAS IG", "90 DÍAS"], ["1.4M", "VISTAS", "1 TIKTOK"], ["61.3K", "STREAMS", "+299%"], ["14.1K", "OYENTES", "+313%"], ["10.2K", "SEGUIDORES", "TIKTOK"]];
  var blips = [[.3, .2], [-.4, .5], [.55, -.3], [-.2, -.6]];
  function drawRadar(x, w, h, t) {
    px(x, "#021013", 0, 0, w, h); var cx = w / 2, cy = h / 2, R0 = 62;
    x.strokeStyle = "rgba(43,214,232,.35)"; x.lineWidth = 1;
    for (var r = 1; r <= 3; r++) { x.beginPath(); x.arc(cx, cy, R0 * r / 3, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.moveTo(cx - R0, cy); x.lineTo(cx + R0, cy); x.moveTo(cx, cy - R0); x.lineTo(cx, cy + R0); x.stroke();
    var a = t * 1.6 % (Math.PI * 2);
    for (var s = 0; s < 18; s++) { x.strokeStyle = "rgba(43,214,232," + (.5 - s * .027) + ")"; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a - s * .05) * R0, cy + Math.sin(a - s * .05) * R0); x.stroke(); }
    blips.forEach(function (b, i) { var ba = Math.atan2(b[1], b[0]), age = ((a - ba) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); x.fillStyle = i === 0 ? "rgba(255,35,56," + Math.max(.25, 1 - age / 4) + ")" : "rgba(43,214,232," + Math.max(.15, 1 - age / 4) + ")"; x.beginPath(); x.arc(cx + b[0] * R0, cy + b[1] * R0, i === 0 ? 4 : 3, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = "#2bd6e8"; x.font = "bold 11px monospace"; x.fillText("SCAN · 1080", 8, 14);
  }
  function drawNum(x, w, h, t, n, i) {
    px(x, "#021013", 0, 0, w, h);
    x.fillStyle = "rgba(43,214,232,.18)"; for (var b = 0; b < 12; b++) { var bh = 10 + Math.abs(Math.sin(b * .9 + i)) * 30 + (b === 11 ? 12 : 0); x.fillRect(10 + b * 14, h - 14 - bh, 9, bh); }
    x.fillStyle = "#2bd6e8"; x.font = "bold 44px monospace"; x.textAlign = "center"; x.fillText(n[0], w / 2, 66);
    x.font = "bold 14px monospace"; x.fillText(n[1], w / 2, 88); x.fillStyle = n[2].charAt(0) === "+" ? "#ff4757" : "rgba(43,214,232,.7)"; x.fillText(n[2], w / 2, 106); x.textAlign = "left";
    if (Math.floor(t * 2 + i) % 2) { x.fillStyle = "#2bd6e8"; x.fillRect(w - 16, 8, 8, 12); }
  }
  var lastDraw = -1;
  function monTick(t) {
    if (t - lastDraw < .08 && t > 0) return; lastDraw = t;
    var page = Math.floor(t / 3) % nums.length;
    screens.forEach(function (cv, i) {
      var x = cv.userData.ctx, w = 192, h = 144;
      if (i === 1) drawRadar(x, w, h, t); else { var k = (i + page) % nums.length; drawNum(x, w, h, t, nums[k], i); }
      for (var y = 0; y < h; y += 3) { x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, y, w, 1); }
      cv.needsUpdate = true;
    });
    cyan.intensity = 1.5 + Math.sin(t * 9) * .08;
  }
