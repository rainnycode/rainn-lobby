  /* ---------- dossier board (collaborations) ---------- */
  var grp = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || grp).add(m); return m; }
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var col = add(new THREE.Mesh(new THREE.BoxGeometry(.9, 4, .9), Std({ color: 0x55595e, roughness: .95 }))); col.position.set(0, 2, -.98);
  var stripe = add(new THREE.Mesh(new THREE.BoxGeometry(.92, .1, .92), Std({ color: 0x8a5a52, roughness: .9 }))); stripe.position.set(0, 1.4, -.98);
  var board = new THREE.Group(); board.position.set(0, .02, -.12); board.rotation.x = -.14; grp.add(board);
  var dryTex = canvasTex(512, 640, function (x, w, h) {
    var r = rnd(9); px(x, "#d6d1c6", 0, 0, w, h); for (var i = 0; i < 2500; i++) { x.fillStyle = "rgba(120,110,100," + r() * .12 + ")"; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
    x.fillStyle = "rgba(30,30,30,.85)"; x.font = "900 34px 'Courier New', monospace"; x.textAlign = "center"; x.fillText("MÚSICA", w * .25, 50); x.fillText("OTRAS COSAS", w * .75, 50);
    x.save(); x.translate(w * .78, h * .9); x.rotate(-.15); x.strokeStyle = "rgba(196,17,31,.75)"; x.lineWidth = 4; x.strokeRect(-110, -26, 220, 48); x.fillStyle = "rgba(196,17,31,.75)"; x.font = "900 26px 'Courier New', monospace"; x.fillText("CONFIDENCIAL", 0, 8); x.restore();
  });
  var sheet = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.75, .04), Std({ map: dryTex, roughness: .85 })), board); sheet.position.y = 1.38;
  var tapeR = add(new THREE.Mesh(new THREE.BoxGeometry(.05, 2.6, .005), Std({ color: 0xc4111f, roughness: .3 })), board); tapeR.position.set(0, 1.35, .024);
  function folder(name, sub, x, y, rz, seed) {
    var tx = canvasTex(256, 200, function (c, w, h) {
      px(c, "#c9a76a", 0, 0, w, h); px(c, "#b8955a", 0, 0, 90, 22); var r = rnd(seed); for (var i = 0; i < 400; i++) { c.fillStyle = "rgba(90,60,30," + r() * .12 + ")"; c.fillRect(r() * w, r() * h, 2, 1); }
      c.fillStyle = "#1b140c"; c.font = "700 14px 'Courier New', monospace"; c.fillText("EXP. 1080", 8, 16);
      px(c, "#efe9d8", 18, 40, 70, 84); c.fillStyle = "#2a2a2a"; c.fillRect(24, 46, 58, 60); c.fillStyle = "#555"; c.beginPath(); c.arc(53, 70, 12, 0, Math.PI * 2); c.fill(); c.fillRect(39, 84, 28, 22);
      c.fillStyle = "#1b140c"; c.font = "900 24px 'Courier New', monospace"; c.fillText(name, 100, 70); c.font = "700 13px 'Courier New', monospace";
      sub.forEach(function (s, k) { c.fillText(s, 100, 96 + k * 18); });
      c.strokeStyle = "rgba(196,17,31,.7)"; c.lineWidth = 3; c.beginPath(); c.arc(220, 170, 16, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(220, 148); c.lineTo(220, 192); c.moveTo(198, 170); c.lineTo(242, 170); c.stroke();
    });
    var f = add(new THREE.Mesh(new THREE.BoxGeometry(.82, .64, .01), Std({ map: tx, roughness: .6 })), board); f.position.set(x, y, .03); f.rotation.z = rz;
    var pin = add(new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), Std({ color: 0xd4152a, roughness: .2 })), board); pin.position.set(x - Math.sin(rz) * .28, y + .28, .05);
  }
  folder("BASKIAT", ["PUMPKIN PIE", "KOPPA (ÁLBUM)"], -.55, 2.1, .04, 3);
  folder("PASH", ["ME COMPRÉ", "UNA CORTA", "120K VISTAS"], -.52, 1.32, -.05, 4);
  folder("SYS VINTAGE", ["× 1080", "VIDEO + ROPA"], .55, 2.1, -.03, 5);
  // empty slots for future allies
  [[-.55, .58], [.55, 1.32]].forEach(function (p, i) { var e = add(new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .004), Std({ color: 0xbdb7aa, roughness: .9, transparent: false })), board); e.position.set(p[0], p[1], .026); });
  // clipboard on a nail
  var cbTex = canvasTex(160, 220, function (x, w, h) { px(x, "#f1ece0", 0, 0, w, h); x.strokeStyle = "rgba(60,60,60,.4)"; for (var y = 40; y < h; y += 18) { x.beginPath(); x.moveTo(10, y); x.lineTo(w - 10, y); x.stroke(); } x.fillStyle = "#222"; x.font = "700 13px 'Courier New', monospace"; x.fillText("PRÓX. ALIADOS:", 10, 30); x.fillText("1. ________", 10, 58); x.fillText("2. ________", 10, 76); });
  var cb = new THREE.Group(); cb.position.set(.6, .7, .06); cb.rotation.z = .06; board.add(cb);
  add(new THREE.Mesh(new THREE.BoxGeometry(.36, .5, .015), Std({ color: 0x6a4a2a, roughness: .5 })), cb);
  var pg = add(new THREE.Mesh(new THREE.PlaneGeometry(.32, .44), Std({ map: cbTex, roughness: .8 })), cb); pg.position.set(0, -.02, .009);
  add(new THREE.Mesh(new THREE.BoxGeometry(.16, .05, .03), steel), cb).position.set(0, .23, .02);
  var turn = new THREE.Group(); turn.add(grp); scene.add(turn);
  function expTick() {}
