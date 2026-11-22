  /* ---------- wrapped projects (what's coming) ---------- */
  var grp = new THREE.Group();
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || grp).add(m); return m; }
  var steel = Std({ color: 0x7a8088, roughness: .32, metalness: .9 });
  var black = Std({ color: 0x0b0b0d, roughness: .4, metalness: .2 });
  var palletTex = canvasTex(256, 64, function (x, w, h) { var r = rnd(31); px(x, "#7a5c3c", 0, 0, w, h); for (var i = 0; i < 60; i++) { x.strokeStyle = "rgba(" + (r() > .5 ? "120,92,60" : "60,42,26") + "," + (.3 + r() * .4) + ")"; x.lineWidth = .5 + r() * 1.5; var y = r() * h; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + (r() - .5) * 4); x.stroke(); } });
  var pw = Std({ map: palletTex, roughness: .85 });
  var pal = new THREE.Group(); grp.add(pal);
  for (var i = 0; i < 7; i++) add(new THREE.Mesh(new THREE.BoxGeometry(1.2, .022, .13), pw), pal).position.set(0, .145, -.45 + i * .15);
  [-.5, 0, .5].forEach(function (x) { add(new THREE.Mesh(new THREE.BoxGeometry(.1, .1, 1.0), pw), pal).position.set(x, .085, 0); });

  var R = rnd(5);
  function crinkle(geo, amt) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i); var n = Math.sin(x * 23 + y * 7) * Math.cos(z * 19 - y * 11) + (R() - .5) * .6; p.setXYZ(i, x * (1 + n * amt), y + n * amt * .3, z * (1 + n * amt)); } geo.computeVertexNormals(); return geo; }
  var film = new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, roughness: .12, metalness: 0, transparent: true, opacity: .5, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
  var tapeM = Std({ color: 0xbfa676, roughness: .25, metalness: 0 });
  var tagTex = function (title, sub, pct) { return canvasTex(160, 240, function (x, w, h) { px(x, "#e7dcc0", 0, 0, w, h); x.fillStyle = "#3a2a14"; x.beginPath(); x.arc(w / 2, 22, 9, 0, Math.PI * 2); x.fill(); px(x, "#c4111f", 0, 44, w, 6); x.fillStyle = "#1a1410"; x.font = "700 26px 'Courier New', monospace"; x.textAlign = "center"; x.fillText(title, w / 2, 92); x.font = "700 16px 'Courier New', monospace"; x.fillText(sub, w / 2, 122); x.font = "700 40px 'Courier New', monospace"; x.fillStyle = "#c4111f"; x.fillText(pct, w / 2, 190); x.font = "700 12px 'Courier New', monospace"; x.fillStyle = "#1a1410"; x.fillText("AVANCE", w / 2, 214); }); };
  var tags = [];
  function bundle(x, y, z, w, h, d, ry, innerColor, tagInfo, torn) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; grp.add(g);
    add(new THREE.Mesh(new THREE.BoxGeometry(w * .86, h * .9, d * .86), Std({ color: innerColor, roughness: .5, metalness: .2 })), g).position.y = h / 2;
    var wrap = new THREE.Mesh(crinkle(new THREE.BoxGeometry(w, h, d, 10, 14, 10), .035), film); wrap.position.y = h / 2; wrap.renderOrder = 2; g.add(wrap);
    [.25, .72].forEach(function (k) { var t = add(new THREE.Mesh(new THREE.BoxGeometry(w * 1.03, .05, d * 1.03), tapeM), g); t.position.y = h * k; });
    var t2 = add(new THREE.Mesh(new THREE.BoxGeometry(.05, h * 1.01, d * 1.03), tapeM), g); t2.position.set(0, h / 2, 0);
    if (torn) { var hole = new THREE.Mesh(new THREE.CircleGeometry(.12, 7), new THREE.MeshBasicMaterial({ color: 0xff2338, toneMapped: false })); hole.position.set(w * .3, h * .82, d / 2 + .012); g.add(hole); var flap = add(new THREE.Mesh(new THREE.PlaneGeometry(.18, .14), film), g); flap.position.set(w * .3 + .1, h * .82 - .08, d / 2 + .05); flap.rotation.set(.6, .5, .3); }
    // tag on a string
    var tg = new THREE.Group(); tg.position.set(-w * .35, h * .74, d / 2 + .03); g.add(tg);
    var str = new THREE.Mesh(new THREE.CylinderGeometry(.002, .002, .14, 4), Std({ color: 0xd8d0b8, roughness: .8 })); str.position.y = -.07; tg.add(str);
    var tag = add(new THREE.Mesh(new THREE.BoxGeometry(.16, .24, .004), Std({ map: tagTex(tagInfo[0], tagInfo[1], tagInfo[2]), roughness: .7 })), tg); tag.position.y = -.26;
    tags.push(tg); return g;
  }
  bundle(0, .16, 0, .9, 2.1, .7, .05, 0x1a1a1e, ["NEPO", "ÁLBUM", "??%"], true);
  bundle(-1.15, 0, .35, .8, .95, .7, .4, 0x2a2420, ["TEMA", "SIN ESTRENAR", "??%"], false);
  bundle(1.05, 0, .45, .6, .55, .5, -.35, 0x111111, ["BOLSO", "1080", "??%"], false);
  // loose plastic + tape roll on the floor
  var loose = new THREE.Mesh(crinkle(new THREE.PlaneGeometry(1.1, .8, 16, 12), .06), film); loose.rotation.x = -Math.PI / 2 + .05; loose.position.set(.4, .03, 1.05); grp.add(loose);
  var roll = add(new THREE.Mesh(new THREE.TorusGeometry(.07, .035, 10, 20), tapeM)); roll.rotation.x = Math.PI / 2; roll.position.set(-.55, .035, 1.0);
  var cutter = add(new THREE.Mesh(new THREE.BoxGeometry(.14, .03, .04), Std({ color: 0xd8b02a, roughness: .3 }))); cutter.position.set(-.3, .02, 1.15); cutter.rotation.y = .7;

  var turn = new THREE.Group(); turn.add(grp); scene.add(turn);
  function bultosTick(t) { tags.forEach(function (tg, i) { tg.rotation.z = Math.sin(t * 1.1 + i * 1.7) * .08; tg.rotation.x = Math.sin(t * .8 + i) * .05; }); }
