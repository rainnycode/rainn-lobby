  /* ---------- pallet stage ---------- */
  var st = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || st).add(m); return m; }
  var chrome = Std({ color: 0xdfe3e8, roughness: .12, metalness: 1 });
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var rubber = Std({ color: 0x141414, roughness: .85 });

  var palletTex = canvasTex(256, 64, function (x, w, h) {
    var r = rnd(31); px(x, "#7a5c3c", 0, 0, w, h);
    for (var i = 0; i < 60; i++) { x.strokeStyle = "rgba(" + (r() > .5 ? "120,92,60" : "60,42,26") + "," + (.3 + r() * .4) + ")"; x.lineWidth = .5 + r() * 1.5; var y = r() * h; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (r() - .5) * 4); x.stroke(); }
    for (var k = 0; k < 6; k++) { x.fillStyle = "rgba(40,28,16,.55)"; x.beginPath(); x.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3, 0, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = "rgba(20,20,20,.5)"; [20, w - 24].forEach(function (nx) { x.fillRect(nx, h * .3, 3, 3); x.fillRect(nx, h * .65, 3, 3); });
  });
  var palletWood = Std({ map: palletTex, roughness: .85 });
  function pallet(px0, pz0, ry) {
    var g = new THREE.Group(); g.position.set(px0, 0, pz0); g.rotation.y = ry || 0; st.add(g);
    for (var i = 0; i < 7; i++) add(new THREE.Mesh(new THREE.BoxGeometry(1.2, .022, .13), palletWood), g).position.set(0, .145, -.45 + i * .15);
    [-.5, 0, .5].forEach(function (x) { add(new THREE.Mesh(new THREE.BoxGeometry(.1, .1, 1.0), palletWood), g).position.set(x, .085, 0); });
    for (var j = 0; j < 3; j++) add(new THREE.Mesh(new THREE.BoxGeometry(1.2, .022, .13), palletWood), g).position.set(0, .011, -.42 + j * .42);
  }
  pallet(-.62, -.35, .02); pallet(.62, -.33, -.015); pallet(-.6, .68, -.01); pallet(.63, .7, .025);
  // black carpet thrown on top
  var carpet = new THREE.PlaneGeometry(2.3, 1.95, 30, 24), cp = carpet.attributes.position;
  for (var i = 0; i < cp.count; i++) { var X = cp.getX(i), Y = cp.getY(i), edge = Math.max(Math.abs(X) - 1.05, Math.abs(Y) - .9, 0); cp.setZ(i, Math.sin(X * 6) * .006 + Math.cos(Y * 5) * .006 - edge * .5); }
  carpet.computeVertexNormals();
  var rug = add(new THREE.Mesh(carpet, Std({ color: 0x060607, roughness: .98, side: THREE.DoubleSide }))); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .172, .17);

  // draped black cloth backdrop on a pipe
  var pipeBar = add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.6, 10), steel)); pipeBar.rotation.z = Math.PI / 2; pipeBar.position.set(0, 3.1, -1.05);
  [-1.3, 1.3].forEach(function (x) { add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3.1, 10), steel)).position.set(x, 1.55, -1.05); add(new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .5), steel)).position.set(x, .015, -1.05); });
  var drape = new THREE.PlaneGeometry(2.5, 3.0, 80, 20), dpz = drape.attributes.position;
  for (var d = 0; d < dpz.count; d++) { var dx = dpz.getX(d), dy = dpz.getY(d); dpz.setZ(d, Math.sin(dx * 16) * .05 * (1 + (1.5 - dy) * .15) + Math.sin(dx * 5.3) * .03); }
  drape.computeVertexNormals();
  var cloth = add(new THREE.Mesh(drape, Std({ color: 0x0a0a0c, roughness: .9, side: THREE.DoubleSide }))); cloth.position.set(0, 1.58, -1.1);

  // mic stand + mic
  var micStand = new THREE.Group(); micStand.position.set(.05, .165, .45); st.add(micStand);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .17, .03, 28), Std({ color: 0x151515, roughness: .3, metalness: .7 })), micStand).position.y = .015;
  add(new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, 1.25, 10), chrome), micStand).position.y = .64;
  add(new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .06, 12), black), micStand).position.y = 1.2;
  var clip = add(new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .07, 12), black), micStand); clip.position.set(0, 1.3, .03); clip.rotation.x = .5;
  var micB = add(new THREE.Mesh(new THREE.CylinderGeometry(.02, .016, .17, 16), Std({ color: 0x1b1b1d, roughness: .35, metalness: .5 })), micStand); micB.position.set(0, 1.34, .08); micB.rotation.x = .9;
  var grilleTex = canvasTex(64, 64, function (x, w, h) { px(x, "#6b6f75", 0, 0, w, h); x.fillStyle = "#1a1a1a"; for (var i = 0; i < w; i += 4) for (var j = 0; j < h; j += 4) x.fillRect(i + ((j / 4) % 2) * 2, j, 2, 2); });
  grilleTex.wrapS = grilleTex.wrapT = THREE.RepeatWrapping; grilleTex.repeat.set(3, 3);
  var head = add(new THREE.Mesh(new THREE.SphereGeometry(.036, 20, 14), Std({ map: grilleTex, roughness: .4, metalness: .8 })), micStand); head.position.set(0, 1.405, .14);
  // mic cable snaking to the floor and off stage
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.05, 1.45, .56), new THREE.Vector3(.08, .9, .5), new THREE.Vector3(.1, .2, .62), new THREE.Vector3(.5, .17, .9), new THREE.Vector3(1.0, .17, .4), new THREE.Vector3(1.18, .03, -.2), new THREE.Vector3(2.0, .02, -.6)]), 80, .009, 6), rubber));

  // floor wedge monitors
  function wedge(x, z, ry) {
    var g = new THREE.Group(); g.position.set(x, .165, z); g.rotation.y = ry; st.add(g);
    var s = new THREE.Shape(); s.moveTo(-.22, 0); s.lineTo(.22, 0); s.lineTo(.22, .14); s.lineTo(-.22, .34); s.lineTo(-.22, 0);
    var geo = new THREE.ExtrudeGeometry(s, { depth: .52, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2 }); geo.translate(0, 0, -.26);
    var box = add(new THREE.Mesh(geo, Std({ color: 0x141416, roughness: .75 })), g); box.rotation.y = Math.PI / 2;
    var gr = new THREE.Mesh(new THREE.PlaneGeometry(.5, .46), Std({ map: grilleTex, roughness: .5, metalness: .7, color: 0x555555 })); gr.position.set(0, .255, 0); gr.rotation.set(-1.99, 0, 0); g.add(gr);
    [[-.1, .2], [.1, .2]].forEach(function (c) { var cn = add(new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .04), steel), g); cn.position.set(c[0], .02, -.22); });
    return g;
  }
  wedge(-.65, 1.0, -.35); wedge(.72, 1.0, .3);

  // DJ table stage-left: folding table, controller, laptop
  var table = new THREE.Group(); table.position.set(-1.55, 0, -.25); table.rotation.y = .55; st.add(table);
  var top = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, .04, .55), Std({ color: 0x1c1d20, roughness: .6 })), table); top.position.y = .92;
  [[-.45, -.22], [.45, -.22], [-.45, .22], [.45, .22]].forEach(function (l) { add(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .9, 8), steel), table).position.set(l[0], .45, l[1]); });
  var ctrl = add(new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .36), Std({ color: 0x121214, roughness: .35, metalness: .4 })), table); ctrl.position.set(0, .965, .03);
  [-.2, .2].forEach(function (x) { var jog = add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .02, 32), Std({ color: 0x2a2a2e, roughness: .25, metalness: .7 })), table); jog.position.set(x, 1.0, .03); var dot = new THREE.Mesh(new THREE.CircleGeometry(.025, 16), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); dot.rotation.x = -Math.PI / 2; dot.position.set(x, 1.012, .03); table.add(dot); });
  var pads = [];
  for (var p = 0; p < 8; p++) { var pd = new THREE.Mesh(new THREE.BoxGeometry(.035, .01, .035), new THREE.MeshBasicMaterial({ color: p % 3 ? 0x2a6bd6 : 0xff2338, toneMapped: false })); pd.position.set(-.07 + (p % 4) * .047, .995, .1 + Math.floor(p / 4) * .05); table.add(pd); pads.push(pd); }
  var lapBase = add(new THREE.Mesh(new THREE.BoxGeometry(.34, .015, .24), Std({ color: 0x8a8e94, roughness: .3, metalness: .8 })), table); lapBase.position.set(.1, .95, -.18);
  var lapScr = add(new THREE.Mesh(new THREE.BoxGeometry(.34, .23, .01), Std({ color: 0x8a8e94, roughness: .3, metalness: .8 })), table); lapScr.position.set(.1, 1.06, -.3); lapScr.rotation.x = -.25;
  var wave = canvasTex(128, 80, function (x, w, h) { px(x, "#05070c", 0, 0, w, h); x.strokeStyle = "#2a8cff"; x.lineWidth = 1; for (var i = 0; i < w; i++) { var a = Math.abs(Math.sin(i * .21) * Math.sin(i * .043)) * 14 + 2; x.beginPath(); x.moveTo(i, 22 - a); x.lineTo(i, 22 + a); x.stroke(); } x.strokeStyle = "#ff2338"; for (var j = 0; j < w; j++) { var b = Math.abs(Math.sin(j * .17 + 1) * Math.cos(j * .05)) * 12 + 2; x.beginPath(); x.moveTo(j, 58 - b); x.lineTo(j, 58 + b); x.stroke(); } });
  var lapGlow = new THREE.Mesh(new THREE.PlaneGeometry(.31, .2), new THREE.MeshBasicMaterial({ map: wave, toneMapped: false, color: 0x9a9a9a })); lapGlow.position.set(.1, 1.06, -.293); lapGlow.rotation.x = -.25; table.add(lapGlow);
  var djLight = new THREE.PointLight(0x4a7dff, .6, 1.6, 2); djLight.position.set(0, 1.25, .1); table.add(djLight);

  // setlist taped to the floor
  var setTex = canvasTex(256, 360, function (x, w, h) {
    px(x, "#eeeae0", 0, 0, w, h); x.fillStyle = "#151515"; x.font = "700 30px 'Courier New', monospace"; x.fillText("SETLIST", 24, 48);
    px(x, "#c4111f", 24, 60, 120, 4);
    x.font = "700 22px 'Courier New', monospace";
    ["1. SUELTA!", "2. ASHHH", "3. NEPO GIRL", "4. ME COMPRÉ", "   UNA CORTA", "5. KIM ATENEA"].forEach(function (t, i) { x.fillText(t, 24, 110 + i * 40); });
    px(x, "rgba(210,200,160,.7)", w / 2 - 50, 0, 100, 22); px(x, "rgba(210,200,160,.7)", w / 2 - 50, h - 22, 100, 22);
  });
  var setlist = new THREE.Mesh(new THREE.PlaneGeometry(.26, .36), Std({ map: setTex, roughness: .8 })); setlist.rotation.set(-Math.PI / 2, 0, .2); setlist.position.set(-.3, .17, .9); setlist.receiveShadow = true; st.add(setlist);
  // water bottle
  var bottle = add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .2, 16), new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, roughness: .05, transparent: true, opacity: .45, clearcoat: 1 }))); bottle.position.set(.45, .265, .78);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .03, 12), Std({ color: 0x2a6bd6, roughness: .4 }))).position.set(.45, .38, .78);

  st.position.set(.1, 0, -.1);
  var turn = new THREE.Group(); turn.add(st); scene.add(turn);
  function stageTick(t) { pads.forEach(function (pd, i) { pd.visible = ((Math.floor(t * 4) + i * 3) % 5) !== 0; }); djLight.intensity = .5 + Math.sin(t * 6) * .1; }
