  /* ---------- TV + camera set ---------- */
  var set = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || set).add(m); return m; }
  var chrome = Std({ color: 0xdfe3e8, roughness: .12, metalness: 1 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var plastic = Std({ color: 0x1f2125, roughness: .5, metalness: .05 });
  var rubber = Std({ color: 0x151515, roughness: .85 });
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });

  // cardboard boxes with tape
  var cardTex = canvasTex(512, 512, function (x, w, h) {
    px(x, "#8a6a44", 0, 0, w, h); var r = rnd(4);
    for (var i = 0; i < 1500; i++) { x.fillStyle = "rgba(60,40,20," + r() * .18 + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1); }
    px(x, "rgba(205,190,150,.75)", 0, h / 2 - 20, w, 40);
    x.strokeStyle = "rgba(40,25,10,.55)"; x.lineWidth = 3; x.strokeRect(36, 60, 120, 80); x.beginPath(); x.moveTo(60, 110); x.lineTo(130, 110); x.stroke();
    for (var k = 0; k < 18; k++) { x.fillStyle = "rgba(30,20,10," + r() * .25 + ")"; x.beginPath(); x.ellipse(r() * w, h - r() * 90, 6 + r() * 30, 3 + r() * 10, 0, 0, Math.PI * 2); x.fill(); }
  });
  var card = Std({ map: cardTex, roughness: .92 });
  var b1 = add(new THREE.Mesh(new THREE.BoxGeometry(1.25, .72, .95), card)); b1.position.set(-.2, .36, 0);
  var b2 = add(new THREE.Mesh(new THREE.BoxGeometry(1.05, .62, .85), card)); b2.position.set(-.18, 1.03, .02); b2.rotation.y = .06;

  // CRT: rounded front shell + tapered back
  var tw = 1.1, th = .86, rr = .09;
  var rs = new THREE.Shape(); rs.moveTo(-tw / 2 + rr, -th / 2); rs.lineTo(tw / 2 - rr, -th / 2); rs.quadraticCurveTo(tw / 2, -th / 2, tw / 2, -th / 2 + rr); rs.lineTo(tw / 2, th / 2 - rr); rs.quadraticCurveTo(tw / 2, th / 2, tw / 2 - rr, th / 2); rs.lineTo(-tw / 2 + rr, th / 2); rs.quadraticCurveTo(-tw / 2, th / 2, -tw / 2, th / 2 - rr); rs.lineTo(-tw / 2, -th / 2 + rr); rs.quadraticCurveTo(-tw / 2, -th / 2, -tw / 2 + rr, -th / 2);
  var sw = .7, shh = .54, sr = .07; var hole = new THREE.Path(); var sx0 = -.14;
  hole.moveTo(sx0 - sw / 2 + sr, -shh / 2); hole.lineTo(sx0 + sw / 2 - sr, -shh / 2); hole.quadraticCurveTo(sx0 + sw / 2, -shh / 2, sx0 + sw / 2, -shh / 2 + sr); hole.lineTo(sx0 + sw / 2, shh / 2 - sr); hole.quadraticCurveTo(sx0 + sw / 2, shh / 2, sx0 + sw / 2 - sr, shh / 2); hole.lineTo(sx0 - sw / 2 + sr, shh / 2); hole.quadraticCurveTo(sx0 - sw / 2, shh / 2, sx0 - sw / 2, shh / 2 - sr); hole.lineTo(sx0 - sw / 2, -shh / 2 + sr); hole.quadraticCurveTo(sx0 - sw / 2, -shh / 2, sx0 - sw / 2 + sr, -shh / 2);
  rs.holes.push(hole);
  var tv = new THREE.Group(); tv.position.set(-.18, 1.34 + th / 2, .08); tv.rotation.y = .06; set.add(tv);
  var shell = add(new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: .26, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 3, curveSegments: 10 }), plastic), tv);
  shell.position.z = -.26;
  var backGeo = new THREE.BoxGeometry(1.0, .76, .6, 1, 1, 1), bp = backGeo.attributes.position;
  for (var bi = 0; bi < bp.count; bi++) { if (bp.getZ(bi) < 0) { bp.setX(bi, bp.getX(bi) * .58); bp.setY(bi, bp.getY(bi) * .62 + .03); } }
  backGeo.computeVertexNormals();
  var back = add(new THREE.Mesh(backGeo, plastic), tv); back.position.z = -.56;
  // vents
  for (var v = 0; v < 7; v++) { var vt = add(new THREE.Mesh(new THREE.BoxGeometry(.5, .015, .01), black), tv); vt.position.set(0, .28 - v * .035, -.86); }
  // curved screen glass
  var sg = new THREE.PlaneGeometry(sw - .02, shh - .02, 24, 18), pos = sg.attributes.position;
  for (var i = 0; i < pos.count; i++) { var X = pos.getX(i), Y = pos.getY(i); pos.setZ(i, .05 - (X * X + Y * Y) * .18); }
  sg.computeVertexNormals();
  var scr = canvasTex(192, 144, function () {}, { pixel: true });
  var screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); screen.position.set(sx0, 0, -.06); tv.add(screen);
  var glass = new THREE.Mesh(sg.clone(), new THREE.MeshPhysicalMaterial({ color: 0x0a0d12, roughness: .03, transparent: true, opacity: .14, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false })); glass.position.set(sx0, 0, -.05); tv.add(glass);
  // control column: knobs, speaker slots, power LED
  [.2, .03].forEach(function (y) { var k = add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .055, .05, 18), black), tv); k.rotation.x = Math.PI / 2; k.position.set(.38, y, .03); var tick = add(new THREE.Mesh(new THREE.BoxGeometry(.008, .04, .01), chrome), tv); tick.position.set(.38, y + .02, .06); });
  for (var s = 0; s < 5; s++) { var sl = add(new THREE.Mesh(new THREE.BoxGeometry(.13, .012, .01), black), tv); sl.position.set(.38, -.1 - s * .04, .01); }
  var led = new THREE.Mesh(new THREE.CircleGeometry(.012, 10), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); led.position.set(.38, -.33, .035); tv.add(led);
  // rabbit-ear antenna
  var abase = add(new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), black), tv); abase.position.set(0, th / 2 + .02, -.3);
  [-.5, .62].forEach(function (a) { var rod = add(new THREE.Mesh(new THREE.CylinderGeometry(.006, .01, .8, 6), chrome), tv); rod.position.set(Math.sin(a) * .4, th / 2 + .04 + Math.cos(a) * .4, -.3); rod.rotation.z = -a; var tip = add(new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), chrome), tv); tip.position.set(Math.sin(a) * .8, th / 2 + .04 + Math.cos(a) * .8, -.3); });
  var tvGlow = new THREE.PointLight(0xa8c4ff, 1.4, 3, 2); tvGlow.position.set(-.3, 1.75, 1.0); set.add(tvGlow);

  // camera on tripod, aimed at the TV
  var rig = new THREE.Group(); rig.position.set(1.45, 0, 1.15); rig.rotation.y = -2.25; set.add(rig);
  var legM = Std({ color: 0x1a1b1e, roughness: .4, metalness: .6 });
  for (var l = 0; l < 3; l++) { var ang = l / 3 * Math.PI * 2; var leg = add(new THREE.Mesh(new THREE.CylinderGeometry(.018, .012, 1.62, 8), legM), rig); leg.position.set(Math.sin(ang) * .26, .78, Math.cos(ang) * .26); leg.rotation.set(Math.cos(ang) * -.33, 0, Math.sin(ang) * .33); var foot = add(new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), rubber), rig); foot.position.set(Math.sin(ang) * .52, .02, Math.cos(ang) * .52); }
  var col = add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .3, 10), legM), rig); col.position.y = 1.6;
  var headB = add(new THREE.Mesh(new THREE.BoxGeometry(.14, .08, .14), legM), rig); headB.position.y = 1.76;
  var handle = add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5, 8), rubber), rig); handle.position.set(-.18, 1.78, -.2); handle.rotation.set(.6, 0, 1.2);
  var cam = new THREE.Group(); cam.position.set(0, 1.9, 0); rig.add(cam);
  var cbody = add(new THREE.Mesh(new THREE.BoxGeometry(.2, .19, .34), Std({ color: 0x121316, roughness: .45, metalness: .3 })), cam);
  var grip = add(new THREE.Mesh(new THREE.BoxGeometry(.07, .16, .12), rubber), cam); grip.position.set(.13, -.01, .06);
  var lens = add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .2, 24), black), cam); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0, .26);
  var ring = add(new THREE.Mesh(new THREE.CylinderGeometry(.082, .082, .04, 24), Std({ color: 0x2a2a2a, roughness: .7 })), cam); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0, .22);
  var lensGlass = new THREE.Mesh(new THREE.CircleGeometry(.062, 24), Std({ color: 0x0a1426, roughness: .02, metalness: .4, envMapIntensity: 2.5 })); lensGlass.position.set(0, 0, .361); cam.add(lensGlass);
  var vf = add(new THREE.Mesh(new THREE.BoxGeometry(.09, .07, .1), rubber), cam); vf.position.set(-.04, .13, -.15);
  var mic = add(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .16, 10), Std({ color: 0x3a3a3a, roughness: .9 })), cam); mic.rotation.x = Math.PI / 2; mic.position.set(0, .14, .1);
  var tally = new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); tally.position.set(.07, .07, .172); cam.add(tally);
  var tallyLight = new THREE.PointLight(0xff2338, .4, .6, 2); tallyLight.position.set(.07, .07, .2); cam.add(tallyLight);

  // LED panel on a stand, cool fill
  var stand = new THREE.Group(); stand.position.set(-1.6, 0, .9); stand.rotation.y = .9; set.add(stand);
  for (var q = 0; q < 3; q++) { var a2 = q / 3 * Math.PI * 2; var lg = add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5, 6), legM), stand); lg.position.set(Math.sin(a2) * .18, .2, Math.cos(a2) * .18); lg.rotation.set(Math.cos(a2) * -.8, 0, Math.sin(a2) * .8); }
  var pole = add(new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 1.7, 8), legM), stand); pole.position.y = 1.15;
  var panelBox = add(new THREE.Mesh(new THREE.BoxGeometry(.5, .34, .05), Std({ color: 0x1a1b1e, roughness: .4, metalness: .5 })), stand); panelBox.position.y = 2.05; panelBox.rotation.x = .25;
  var panelFace = new THREE.Mesh(new THREE.PlaneGeometry(.44, .28), new THREE.MeshBasicMaterial({ color: 0xdfe9ff, toneMapped: false })); panelFace.position.set(0, 2.05 - .006, .028); panelFace.rotation.x = .25; stand.add(panelFace);
  var fill = new THREE.SpotLight(0xcfe0ff, 3.2, 6, .7, .9, 2); fill.position.set(0, 2.05, .1); fill.target.position.set(1.4, 1.2, -1.3); stand.add(fill); stand.add(fill.target);

  // clapperboard leaning on the boxes
  var slateTex = canvasTex(256, 220, function (x, w, h) {
    px(x, "#151515", 0, 0, w, h); x.strokeStyle = "rgba(230,230,230,.8)"; x.lineWidth = 3; x.strokeRect(14, 70, w - 28, h - 84);
    x.beginPath(); x.moveTo(14, 140); x.lineTo(w - 14, 140); x.moveTo(w / 2, 70); x.lineTo(w / 2, 140); x.stroke();
    x.fillStyle = "rgba(235,235,235,.9)"; x.font = "700 30px 'Courier New', monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("1080", w / 4 + 4, 106); x.fillText("T 1", w * .75, 106); x.font = "700 26px 'Courier New', monospace"; x.fillText("rainn", w / 2, 180);
    for (var i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#e9e9e9" : "#151515"; x.beginPath(); x.moveTo(i * 34, 56); x.lineTo(i * 34 + 22, 14); x.lineTo(i * 34 + 56, 14); x.lineTo(i * 34 + 34, 56); x.fill(); }
  });
  var slate = add(new THREE.Mesh(new THREE.BoxGeometry(.42, .36, .02), Std({ map: slateTex, roughness: .6 }))); slate.position.set(.62, .2, .58); slate.rotation.set(-.28, -.35, 0);

  // coiled cables on the floor
  var coil = []; for (var c = 0; c <= 120; c++) { var t0 = c / 120 * Math.PI * 6, rad = .18 + c / 120 * .05; coil.push(new THREE.Vector3(.95 + Math.cos(t0) * rad, .02 + c * .0003, -.55 + Math.sin(t0) * rad)); }
  coil.push(new THREE.Vector3(1.4, .02, .2), new THREE.Vector3(1.45, .02, 1.05));
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 300, .014, 6), black));
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.5, 1.5, -.5), new THREE.Vector3(-.75, .5, -.6), new THREE.Vector3(-1.1, .02, -.2), new THREE.Vector3(-1.55, .02, .7)]), 40, .016, 6), black));

  set.position.x = -.1;
  var turn = new THREE.Group(); turn.add(set); scene.add(turn);

  /* animated TV picture: static, rolling bar, OSD, cuts to a test card */
  var R2 = rnd(99);
  function drawTV(t) {
    var x = scr.userData.ctx, w = 192, h = 144, phase = t % 7;
    if (phase < 4.2) {
      var img = x.createImageData(w, h), d = img.data;
      for (var i = 0; i < d.length; i += 4) { var v = (Math.random() * 180) | 0; d[i] = v * .82; d[i + 1] = v * .9; d[i + 2] = v; d[i + 3] = 255; }
      x.putImageData(img, 0, 0);
      var by = (t * 40) % (h + 40) - 20; x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(0, by, w, 18);
      x.fillStyle = "#7dff8a"; x.font = "bold 12px monospace"; x.fillText("CH 03", 10, 18);
    } else {
      px(x, "#0d0f14", 0, 0, w, h);
      var cols = ["#d8d8d8", "#c9c200", "#00b8c4", "#00b000", "#b800b8", "#c40000", "#0000c0"];
      cols.forEach(function (c, k) { px(x, c, k * (w / 7), 0, w / 7 + 1, h * .62); });
      px(x, "#111", 0, h * .62, w, h * .38);
      x.strokeStyle = "#ff2338"; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, h * .35, 26, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(w / 2, h * .35 - 38); x.lineTo(w / 2, h * .35 + 38); x.moveTo(w / 2 - 38, h * .35); x.lineTo(w / 2 + 38, h * .35); x.stroke();
      x.fillStyle = "#f1f1f1"; x.font = "bold 14px monospace"; x.textAlign = "center"; x.fillText("1080 · EN CASA", w / 2, h * .82); x.textAlign = "left";
      if (Math.floor(t * 2) % 2) { x.fillStyle = "#ff2338"; x.beginPath(); x.arc(14, 16, 5, 0, Math.PI * 2); x.fill(); x.font = "bold 12px monospace"; x.fillText("REC", 24, 20); }
    }
    for (var y = 0; y < h; y += 3) { x.fillStyle = "rgba(0,0,0,.22)"; x.fillRect(0, y, w, 1); }
    scr.needsUpdate = true;
  }
  drawTV(4.5);
  function tvTick(t) {
    drawTV(t);
    var on = (t % 7) >= 4.2;
    tvGlow.intensity = (on ? 1.6 : 1.1) + (Math.random() - .5) * .25;
    tvGlow.color.setHex(on ? 0xc0c8ff : 0xa8c4ff);
    var blink = Math.floor(t * 1.6) % 2 === 0; tally.visible = blink; tallyLight.intensity = blink ? .4 : 0;
  }
