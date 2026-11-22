  /* ---------- jukebox ---------- */
  var juke = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || juke).add(m); return m; }
  var chrome = Std({ color: 0xdfe3e8, roughness: .1, metalness: 1 });
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .35, metalness: .2 });

  // dark walnut wood, worn
  var woodTex = canvasTex(512, 512, function (x, w, h) {
    var r = rnd(21); px(x, "#2a160d", 0, 0, w, h);
    for (var i = 0; i < 220; i++) { var y = r() * h; x.strokeStyle = "rgba(" + (r() > .5 ? "70,38,20" : "18,9,5") + "," + (.25 + r() * .4) + ")"; x.lineWidth = .5 + r() * 2.5; x.beginPath(); x.moveTo(0, y); for (var k = 0; k <= 8; k++) x.lineTo(k * w / 8, y + Math.sin(k * .9 + y * .05) * (2 + r() * 5)); x.stroke(); }
    for (var s = 0; s < 60; s++) { x.strokeStyle = "rgba(200,170,140," + (r() * .12) + ")"; x.lineWidth = .7; var a = r() * w, b = r() * h; x.beginPath(); x.moveTo(a, b); x.lineTo(a + (r() - .5) * 40, b + (r() - .5) * 10); x.stroke(); }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  var wood = Std({ map: woodTex, roughness: .42, metalness: 0, envMapIntensity: .7 });

  // body: arched cabinet
  var Wd = .75, Hr = 1.25, D = .8, bv = .03;
  var sh = new THREE.Shape(); sh.moveTo(-Wd, 0); sh.lineTo(Wd, 0); sh.lineTo(Wd, Hr); sh.absarc(0, Hr, Wd, 0, Math.PI, false); sh.lineTo(-Wd, 0);
  var bodyGeo = new THREE.ExtrudeGeometry(sh, { depth: D - bv * 2, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 3, curveSegments: 36 });
  bodyGeo.translate(0, 0, -D / 2 + bv);
  woodTex.repeat.set(1, 1);
  var body = add(new THREE.Mesh(bodyGeo, [wood, wood])); body.position.y = .14;
  var FZ = D / 2 + .005; // front face z
  var Y0 = .14;

  function archPts(r, legBottom, n) {
    var pts = [new THREE.Vector3(-r, legBottom, FZ)];
    for (var i = 0; i <= n; i++) { var a = Math.PI - i / n * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * r, Y0 + Hr + Math.sin(a) * r, FZ)); }
    pts.push(new THREE.Vector3(r, legBottom, FZ)); return pts;
  }
  // chrome outer trim
  var outer = new THREE.CatmullRomCurve3(archPts(Wd - .03, Y0 + .08, 40), false, "centripetal");
  add(new THREE.Mesh(new THREE.TubeGeometry(outer, 160, .028, 10, false), chrome));
  // glowing bubble tubes
  var innerPts = archPts(Wd - .14, Y0 + .5, 40); innerPts.forEach(function (p) { p.z += .03; });
  var inner = new THREE.CatmullRomCurve3(innerPts, false, "centripetal");
  var tubeLight = Std({ color: 0x2a1405, emissive: 0xff8a2a, emissiveIntensity: 2.4, roughness: .3 });
  juke.add(new THREE.Mesh(new THREE.TubeGeometry(inner, 160, .042, 12, false), tubeLight));
  juke.add(new THREE.Mesh(new THREE.TubeGeometry(inner, 160, .058, 12, false), new THREE.MeshPhysicalMaterial({ color: 0xffd9a8, roughness: .05, transparent: true, opacity: .22, clearcoat: 1, depthWrite: false })));
  var bubbles = [], bubbleMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
  for (var b = 0; b < 18; b++) { var bm = new THREE.Mesh(new THREE.SphereGeometry(.012 + (b % 3) * .004, 8, 6), bubbleMat); bm.userData.o = b / 18; bm.userData.side = b % 2; juke.add(bm); bubbles.push(bm); }

  // window with record mechanism
  var wr = .44, wy = Y0 + Hr + .02;
  var winShape = new THREE.Shape(); winShape.moveTo(-wr, wy - .32); winShape.lineTo(wr, wy - .32); winShape.lineTo(wr, wy); winShape.absarc(0, wy, wr, 0, Math.PI, false); winShape.lineTo(-wr, wy - .32);
  var cavity = new THREE.Mesh(new THREE.ShapeGeometry(winShape, 30), Std({ color: 0x120c08, roughness: .8 })); cavity.position.z = FZ - .3; juke.add(cavity);
  var rim = new THREE.Mesh(new THREE.ExtrudeGeometry(winShape, { depth: .3, bevelEnabled: false, curveSegments: 30 }), Std({ color: 0x1a100a, roughness: .7, side: THREE.BackSide })); rim.position.z = FZ - .3; juke.add(rim);
  var deck = add(new THREE.Mesh(new THREE.BoxGeometry(wr * 1.8, .03, .26), steel)); deck.position.set(0, wy - .3, FZ - .16);
  var record = new THREE.Group(); record.position.set(-.04, wy - .2, FZ - .16); record.rotation.x = .55;
  var vinyl = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .008, 48), Std({ color: 0x080808, roughness: .18, metalness: .1, envMapIntensity: 1.4 })); vinyl.castShadow = true; record.add(vinyl);
  var label = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .01, 32), Std({ color: 0xc4111f, roughness: .6 })); record.add(label);
  juke.add(record);
  var arm = add(new THREE.Mesh(new THREE.BoxGeometry(.22, .012, .012), chrome)); arm.position.set(.16, wy - .16, FZ - .1); arm.rotation.set(.55, .5, 0);
  var stack = add(new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .08, 40), black)); stack.position.set(.26, wy - .27, FZ - .22); stack.rotation.x = .2;
  var inLight = new THREE.PointLight(0xffb36b, 1.4, 1.2, 2); inLight.position.set(0, wy + .2, FZ - .08); juke.add(inLight);
  var winGlass = new THREE.Mesh(new THREE.ShapeGeometry(winShape, 30), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transparent: true, opacity: .09, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false }));
  winGlass.position.z = FZ + .01; juke.add(winGlass);
  var winRing = new THREE.CatmullRomCurve3(archPts(wr + .02, wy - .32, 36).map(function (p) { p.y += 0; return p; }), false, "centripetal");
  winRing.points.forEach(function (p) { if (p.y > Y0 + Hr) p.y += .02; });
  add(new THREE.Mesh(new THREE.TubeGeometry(winRing, 120, .016, 8, false), chrome));

  // title strips (backlit cards with the songs)
  var titles = ["KIM ATENEA", "ASHHH", "NEPO GIRL", "SUELTA!", "ME COMPRÉ UNA CORTA", "PUMPKIN PIE"];
  var cards = canvasTex(1024, 256, function (x, w, h) {
    px(x, "#0d0907", 0, 0, w, h);
    titles.forEach(function (t, i) {
      var cx = 14 + (i % 3) * 336, cy = 14 + Math.floor(i / 3) * 120;
      px(x, "#efe6cf", cx, cy, 318, 104); px(x, "#c4111f", cx, cy, 318, 10); px(x, "#c4111f", cx, cy + 94, 318, 10);
      x.fillStyle = "#1a1410"; x.font = "700 " + (t.length > 12 ? 26 : 34) + "px 'Courier New', monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(t, cx + 159, cy + 46);
      x.font = "700 20px 'Courier New', monospace"; x.fillStyle = "#c4111f"; x.fillText("A" + (i + 1) + " · rainn", cx + 159, cy + 76);
    });
  });
  var strip = new THREE.Mesh(new THREE.PlaneGeometry(1.08, .27), Std({ map: cards, emissiveMap: cards, emissive: 0xffffff, emissiveIntensity: .55, roughness: .5 }));
  strip.position.set(0, Y0 + .86, FZ + .006); juke.add(strip);
  var stripFrame = add(new THREE.Mesh(new THREE.BoxGeometry(1.14, .32, .02), chrome)); stripFrame.position.set(0, Y0 + .86, FZ - .004);

  // selector buttons
  for (var k = 0; k < 8; k++) { var btn = add(new THREE.Mesh(new THREE.BoxGeometry(.075, .05, .05), k === 2 ? Std({ color: 0xc4111f, roughness: .25, emissive: 0x3a0308 }) : chrome)); btn.position.set(-.42 + k * .12, Y0 + .66, FZ + .02); }
  // coin slot
  var coin = add(new THREE.Mesh(new THREE.BoxGeometry(.1, .14, .03), chrome)); coin.position.set(.6, Y0 + .66, FZ + .01);
  var cslot = new THREE.Mesh(new THREE.PlaneGeometry(.02, .07), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); cslot.position.set(.6, Y0 + .67, FZ + .03); juke.add(cslot);

  // speaker grille
  var grille = canvasTex(256, 256, function (x, w, h) { px(x, "#0c0807", 0, 0, w, h); x.strokeStyle = "rgba(120,80,50,.35)"; x.lineWidth = 2; for (var i = -h; i < w; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); } });
  var gr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .44), Std({ map: grille, roughness: .95 })); gr.position.set(0, Y0 + .33, FZ + .004); gr.receiveShadow = true; juke.add(gr);
  for (var g = 0; g < 7; g++) { var bar = add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .46, 8), chrome)); bar.position.set(-.54 + g * .18, Y0 + .33, FZ + .02); }

  // plinth + chrome feet
  var plinth = add(new THREE.Mesh(new THREE.BoxGeometry(1.62, .12, .9), black)); plinth.position.y = .08;
  [[-.72, -.36], [.72, -.36], [-.72, .36], [.72, .36]].forEach(function (f) { var ft = add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .04, 14), chrome)); ft.position.set(f[0], .02, f[1]); });

  // records on a cardboard box beside it
  var cardTex = canvasTex(256, 256, function (x, w, h) { px(x, "#8a6a44", 0, 0, w, h); var r = rnd(4); for (var i = 0; i < 400; i++) { x.fillStyle = "rgba(60,40,20," + r() * .2 + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1); } px(x, "rgba(200,180,140,.5)", 0, h / 2 - 8, w, 16); x.strokeStyle = "rgba(40,25,10,.5)"; x.lineWidth = 2; x.strokeRect(20, 30, 70, 50); });
  var crate = add(new THREE.Mesh(new THREE.BoxGeometry(.62, .52, .62), Std({ map: cardTex, roughness: .9 }))); crate.position.set(1.35, .26, .35); crate.rotation.y = -.25;
  for (var v = 0; v < 5; v++) { var lp = add(new THREE.Mesh(new THREE.CylinderGeometry(.155, .155, .012, 40), Std({ color: 0x0a0a0a, roughness: .2, metalness: .1, envMapIntensity: 1.3 }))); lp.position.set(1.33 + Math.sin(v * 2.1) * .03, .53 + v * .014, .37 + Math.cos(v * 1.7) * .03); }
  var sleeveTex = canvasTex(256, 256, function (x, w, h) { px(x, "#ece9e2", 0, 0, w, h); x.strokeStyle = "#d8172b"; x.lineWidth = 7; x.beginPath(); x.arc(128, 128, 70, 0, Math.PI * 2); x.stroke(); x.lineWidth = 5; x.beginPath(); x.arc(128, 128, 22, 0, Math.PI * 2); x.stroke(); x.lineWidth = 6; [[128, 30, 128, 86], [128, 170, 128, 226], [30, 128, 86, 128], [170, 128, 226, 128]].forEach(function (l) { x.beginPath(); x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); x.stroke(); }); x.fillStyle = "rgba(0,0,0,.06)"; x.fillRect(0, 0, w, 8); });
  var sleeve = add(new THREE.Mesh(new THREE.BoxGeometry(.33, .33, .006), Std({ map: sleeveTex, roughness: .7 }))); sleeve.position.set(1.12, .7, .08); sleeve.rotation.set(-.12, -.5, .18);
  // power cable
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.5, .25, -.42), new THREE.Vector3(-.7, .02, -.6), new THREE.Vector3(-1.4, .02, -.3), new THREE.Vector3(-2.4, .02, -.8)]), 30, .018, 6), black));

  var warm = new THREE.PointLight(0xff9a45, 1.3, 3.2, 2); warm.position.set(0, 1.7, .9); juke.add(warm);
  juke.position.x = -.25;
  var turn = new THREE.Group(); turn.add(juke); scene.add(turn);

  function jukeTick(t) {
    record.children.forEach(function () {}); vinyl.rotation.y = t * 3.5; label.rotation.y = t * 3.5;
    bubbles.forEach(function (bm) {
      var p = (bm.userData.o + t * .06) % 1, u = bm.userData.side ? 1 - p * .5 : p * .5;
      var pt = inner.getPointAt(u); bm.position.set(pt.x, pt.y, pt.z + .005);
    });
    var f = 2.2 + Math.sin(t * 2.3) * .15 + Math.sin(t * 7.1) * .05; tubeLight.emissiveIntensity = f; warm.intensity = 1.2 + (f - 2.2) * .8;
  }
