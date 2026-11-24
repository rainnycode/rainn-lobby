/* Galgo (greyhound) built in code, so it can really walk.
   make_galgo({ pose: "walk" | "lie", color, offset }) -> { g, tick(t, moving, dt) }
   Faces +Z, real-world meters (shoulder ~0.72 m); scale the group to fit the scene.
   v2: sculpted body (arched back, keel chest, tuck-up), short-coat texture with tone variation,
   finer head (stop, jaw line, rose ears, eye shine), toes and nails, tapered tail, red collar. */
function make_galgo(opts) {
  opts = opts || {};
  var pose = opts.pose || "walk";
  var base = new THREE.Color(opts.color || 0x8b8f96);

  // ---------- coat texture: short hair strokes, used as color + bump ----------
  // short smooth coat: soft mottling + thousands of hairs laid along the body (texture V runs head-to-tail)
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  var FS = 512, furCanvas = document.createElement("canvas"); furCanvas.width = furCanvas.height = FS;
  var fx = furCanvas.getContext("2d"); fx.fillStyle = "#a2a2a2"; fx.fillRect(0, 0, FS, FS);
  function wrapDraw(fn) { for (var ox = -FS; ox <= FS; ox += FS) for (var oy = -FS; oy <= FS; oy += FS) fn(ox, oy); }
  for (var i = 0; i < 60; i++) {   // faint brindle/mottle
    var cx = rnd() * FS, cy = rnd() * FS, r = 20 + rnd() * 70, d = rnd() > .5;
    wrapDraw(function (ox, oy) { var g = fx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, d ? "rgba(60,60,64,.18)" : "rgba(230,230,232,.14)"); g.addColorStop(1, "rgba(0,0,0,0)"); fx.fillStyle = g; fx.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2); });
  }
  for (var i = 0; i < 26000; i++) {
    var x = rnd() * FS, y = rnd() * FS, l = 5 + rnd() * 9, v = rnd() < .5 ? 70 + rnd() * 60 : 170 + rnd() * 85;
    fx.strokeStyle = "rgba(" + (v | 0) + "," + (v | 0) + "," + ((v + 4) | 0) + "," + (.25 + rnd() * .35) + ")"; fx.lineWidth = .6 + rnd() * .6;
    fx.beginPath(); fx.moveTo(x, y); fx.quadraticCurveTo(x + (rnd() - .5) * 1.5, y + l * .5, x + (rnd() - .5) * 2.5, y + l); fx.stroke();
  }
  var fur = new THREE.CanvasTexture(furCanvas); fur.wrapS = fur.wrapT = THREE.RepeatWrapping; fur.repeat.set(3, 3); fur.encoding = THREE.sRGBEncoding; fur.anisotropy = 4;
  var furBump = new THREE.CanvasTexture(furCanvas); furBump.wrapS = furBump.wrapT = THREE.RepeatWrapping; furBump.repeat.set(3, 3);
  // fur tips for the outer shells (soft silhouette)
  var tipC = document.createElement("canvas"); tipC.width = tipC.height = 256; var tx = tipC.getContext("2d"); tx.fillStyle = "#000"; tx.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 9000; i++) { var x = rnd() * 256, y = rnd() * 256, v = 120 + rnd() * 135; tx.strokeStyle = "rgb(" + (v | 0) + "," + (v | 0) + "," + (v | 0) + ")"; tx.lineWidth = .8; tx.beginPath(); tx.moveTo(x, y); tx.lineTo(x + (rnd() - .5), y + 2 + rnd() * 3); tx.stroke(); }
  var tips = new THREE.CanvasTexture(tipC); tips.wrapS = tips.wrapT = THREE.RepeatWrapping; tips.repeat.set(5, 5);
  // matte coat with a soft sheen (no plastic clearcoat); the scene's glossify() skips anything marked matte
  function furMat(color, vc, bump) {
    var m = new THREE.MeshPhysicalMaterial({ color: color, map: fur, bumpMap: furBump, bumpScale: bump || .006, roughness: .86, metalness: 0, vertexColors: !!vc });
    m.sheen = new THREE.Color(0x3a3e45); m.userData.matte = true; return m;
  }

  var coat = furMat(0xffffff, true);
  var coatLeg = furMat(base.clone().multiplyScalar(.93), false, .005);
  var coatMid = furMat(base.clone().multiplyScalar(.9), false);
  var dark = furMat(base.clone().multiplyScalar(.58), false, .004);
  var leather = new THREE.MeshStandardMaterial({ color: 0x1b1a1c, roughness: .35 });
  var eyeM = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: .05, metalness: .1 });
  var shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var nail = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: .3 });
  var collarM = new THREE.MeshStandardMaterial({ color: 0x420910, roughness: .45 });
  var ringM = new THREE.MeshStandardMaterial({ color: 0xc9c9c9, roughness: .2, metalness: .9 });

  var topC = base.clone().multiplyScalar(.82), bellyC = base.clone().lerp(new THREE.Color(0xc4c7cc), .45);
  var root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // ---------- loft: smooth rings interpolated from a few control sections ----------
  // control: [y, z, halfWidth, halfHeight, keel] ; keel narrows the underside (greyhound chest)
  function loft(ctrl, rings, seg) {
    var cPos = new THREE.CatmullRomCurve3(ctrl.map(function (c) { return new THREE.Vector3(c[2], c[1], c[0]); }));
    var cSz = new THREE.CatmullRomCurve3(ctrl.map(function (c) { return new THREE.Vector3(c[3], c[4] || 0, 0); }));
    var pos = [], uv = [], col = [], idx = [], tmp = new THREE.Color();
    for (var i = 0; i < rings; i++) {
      var t = i / (rings - 1), a = cPos.getPoint(t), b = cSz.getPoint(t);
      var hw = a.x, z = a.y, y = a.z, hh = b.x, keel = b.y;
      for (var k = 0; k <= seg; k++) {
        var ang = k / seg * Math.PI * 2, sx = Math.cos(ang), sy = Math.sin(ang);
        var low = Math.max(0, -sy), w = hw * (1 - keel * low * low);
        pos.push(sx * w, y + sy * hh, z); uv.push(k / seg, t);
        tmp.copy(bellyC).lerp(topC, sy * .5 + .5); col.push(tmp.r, tmp.g, tmp.b);   // darker back, lighter chest/belly
      }
    }
    for (var i = 0; i < rings - 1; i++) for (var k = 0; k < seg; k++) {
      var a = i * (seg + 1) + k, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, b, c, b, d, c);
    }
    [0, rings - 1].forEach(function (ri, e) {   // caps
      var t = ri / (rings - 1), a = cPos.getPoint(t), n = pos.length / 3; pos.push(0, a.z, a.y + (e ? .004 : -.004)); uv.push(.5, t);
      tmp.copy(bellyC).lerp(topC, .5); col.push(tmp.r, tmp.g, tmp.b);
      for (var k = 0; k < seg; k++) { var p = ri * (seg + 1) + k; if (e) idx.push(n, p + 1, p); else idx.push(n, p, p + 1); }
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // sweep: a tube along a curve whose radius follows rfn(t)
  function sweep(curve, n, seg, rfn, mat) {
    var fr = curve.computeFrenetFrames(n, false), pos = [], uv = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], r = rfn(t);
      for (var k = 0; k <= seg; k++) { var a = k / seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z)); uv.push(k / seg, t); }
    }
    for (var i = 0; i < n; i++) for (var k = 0; k < seg; k++) { var a = i * (seg + 1) + k, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }

  // ---------- torso: arched loin, deep keel chest, strong tuck-up ----------
  //           y     z     hw    hh   keel
  function shells(mesh, parent) {   // 3 thin offset layers with hair tips cut out by alphaTest
    var g0 = mesh.geometry, n = g0.attributes.normal, p = g0.attributes.position;
    for (var k = 1; k <= 3; k++) {
      var g = g0.clone(), q = g.attributes.position, d = .0028 * k;
      for (var i = 0; i < q.count; i++) q.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
      var m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: !!g.attributes.color, map: fur, alphaMap: tips, alphaTest: .3 + k * .17, roughness: .9 });
      m.userData.matte = true; var sh = new THREE.Mesh(g, m); sh.userData.shell = true; parent.add(sh);
    }
  }
  var torsoMesh = new THREE.Mesh(loft([
    [.655, -.45, .04, .045, 0],
    [.675, -.40, .085, .10, .1],
    [.695, -.33, .112, .128, .15],   // haunches
    [.715, -.24, .105, .118, .2],
    [.735, -.14, .082, .085, .25],   // arched loin
    [.725, -.05, .085, .1, .3],      // tuck-up
    [.67, .04, .108, .165, .45],
    [.62, .13, .125, .205, .55],     // keel chest
    [.63, .2, .128, .19, .45],
    [.68, .265, .112, .14, .25],     // shoulders
    [.735, .305, .075, .085, .1]
  ], 44, 30), coat); body.add(torsoMesh); shells(torsoMesh, body);
  // shoulder blades and haunch muscles: soft bumps under the coat
  // shoulder blades and haunches: shallow bumps that only just break the body line
  [].forEach(function (m) {   // (removed: read as stuck-on discs)
    [-1, 1].forEach(function (s) { var b = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), coatMid); b.scale.set(m[3], m[4], m[5]); b.position.set(s * m[0], m[1], m[2]); body.add(b); });
  });

  // ---------- neck + head ----------
  var neckP = new THREE.Group(); neckP.position.set(0, .74, .28); body.add(neckP);
  var neckMesh = new THREE.Mesh(loft([[-.02, -.06, .075, .085, .1], [.03, .0, .066, .074, .05], [.08, .07, .056, .062, 0], [.13, .17, .046, .05, 0]], 16, 22), coat); neckP.add(neckMesh); shells(neckMesh, neckP);
  var collar = new THREE.Mesh(new THREE.TorusGeometry(.066, .009, 8, 28), collarM); collar.position.set(0, .045, .03); collar.rotation.x = -1.0; collar.scale.set(1, 1.08, 1); neckP.add(collar);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(.012, .003, 6, 14), ringM); ring.position.set(0, -.01, .075); ring.rotation.x = .5; neckP.add(ring);

  var headP = new THREE.Group(); headP.position.set(0, .15, .2); headP.rotation.x = .25; neckP.add(headP);
  headP.add(new THREE.Mesh(loft([   // skull -> stop -> long muzzle
    [.015, -.085, .03, .035, 0], [.03, -.055, .052, .05, .1], [.035, -.015, .056, .052, .15], [.03, .02, .046, .046, .2],
    [.018, .055, .036, .04, .25], [.005, .1, .029, .032, .25], [-.008, .15, .022, .025, .2], [-.018, .195, .015, .017, .1], [-.022, .212, .006, .008, 0]
  ], 30, 22), coat));
  var nose = new THREE.Mesh(new THREE.SphereGeometry(.0145, 14, 10), leather); nose.scale.set(1.1, .8, .9); nose.position.set(0, -.016, .208); headP.add(nose);
  [-1, 1].forEach(function (s) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(.0115, 14, 10), eyeM); eye.scale.set(.7, .85, 1.1); eye.position.set(s * .043, .036, .022); headP.add(eye);
    var hl = new THREE.Mesh(new THREE.SphereGeometry(.0028, 6, 5), shine); hl.position.set(s * .05, .04, .028); headP.add(hl);
    var jaw = sweep(new THREE.CatmullRomCurve3([new THREE.Vector3(s * .028, -.006, .07), new THREE.Vector3(s * .024, -.016, .13), new THREE.Vector3(s * .014, -.024, .19)]), 10, 5, function () { return .0022; }, leather); headP.add(jaw);
    var ear = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), dark);   // rose ear: small, folded back along the skull
    ear.scale.set(.009, .019, .034); ear.position.set(s * .04, .05, -.078); ear.rotation.set(-.35, s * .25, s * .55); headP.add(ear);
    headP.userData["ear" + s] = ear;
  });

  // ---------- tail: long, thin, low, tapering, curl at the tip ----------
  var tailP = new THREE.Group(); tailP.position.set(0, .655, -.44); body.add(tailP);
  tailP.add(sweep(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -.11, -.08), new THREE.Vector3(0, -.3, -.11), new THREE.Vector3(0, -.42, -.04), new THREE.Vector3(0, -.39, .05)]), 36, 10, function (t) { return .02 * (1 - t) + .004; }, coatLeg));

  // ---------- legs ----------
  function seg(len, r0, r1, mat) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 14, 1, true), mat || coatLeg); m.position.y = -len / 2; return m; }
  function joint(r, mat) { return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat || coatLeg); }
  function paw(parent, y) {
    var p = new THREE.Group(); p.position.set(0, y, .012); parent.add(p);
    var pad = new THREE.Mesh(new THREE.SphereGeometry(.024, 14, 10), coatLeg); pad.scale.set(1, .5, 1.25); p.add(pad);
    for (var t = 0; t < 4; t++) {
      var x = (t - 1.5) * .0115, toe = new THREE.Mesh(new THREE.SphereGeometry(.0085, 10, 8), coatLeg); toe.position.set(x, -.003, .026 - Math.abs(x) * .4); toe.scale.set(1, .9, 1.2); p.add(toe);
      var n = new THREE.Mesh(new THREE.ConeGeometry(.0028, .012, 6), nail); n.position.set(x, -.004, .037 - Math.abs(x) * .4); n.rotation.x = 1.45; p.add(n);
    }
  }
  function leg(x, y, z, front) {
    var a = new THREE.Group(); a.position.set(x, y, z); body.add(a);
    var L1 = front ? .27 : .25, L2 = front ? .25 : .27, L3 = front ? .07 : .13;
    var up = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), coatLeg); up.scale.set(front ? .03 : .04, L1 * .42, front ? .04 : .056); up.position.y = -L1 * .3; a.add(up);
    a.add(seg(L1, front ? .04 : .05, front ? .026 : .03));
    var b = new THREE.Group(); b.position.y = -L1; a.add(b); b.add(joint(front ? .027 : .031)); b.add(seg(L2, front ? .024 : .028, .016));
    var c = new THREE.Group(); c.position.y = -L2; b.add(c); c.add(joint(.018)); c.add(seg(L3, .016, .014));
    paw(c, -L3);
    return { a: a, b: b, c: c, front: front };
  }
  var legs = [leg(-.07, .56, .16, true), leg(.07, .56, .16, true), leg(-.08, .64, -.3, false), leg(.08, .64, -.3, false)];
  function rest(l) { if (l.front) { l.a.rotation.x = 0; l.b.rotation.x = 0; l.c.rotation.x = .18; } else { l.a.rotation.x = .35; l.b.rotation.x = -.75; l.c.rotation.x = .42; } }
  legs.forEach(rest);

  if (pose === "lie") {
    // "sphinx" down: body on the floor, front legs forward, hind legs folded along the sides
    body.position.y = -.42; body.rotation.x = .04;
    legs.forEach(function (l, i) {
      if (l.front) { l.a.rotation.x = -1.45; l.b.rotation.x = .05; l.c.rotation.x = -.05; l.a.position.z += .02; }
      else { l.a.rotation.set(-1.15, 0, (i === 2 ? -1 : 1) * .12); l.b.rotation.x = 2.75; l.c.rotation.x = -.2; l.a.position.x *= 1.35; }
    });
    tailP.rotation.set(-.2, 0, .9); neckP.rotation.x = .15;
  }

  var walkPhase = 0, sniff = 0;
  function sm(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function tick(t, moving, dt) {
    dt = dt || 1 / 60;
    if (pose === "walk") {
      var amt = moving ? 1 : 0; walkPhase += dt * 6.2 * amt;
      var p = walkPhase;
      [[0, 0], [1, Math.PI], [2, Math.PI], [3, 0]].forEach(function (q) {   // trot: diagonal pairs together
        var l = legs[q[0]], s = Math.sin(p + q[1]), c = Math.cos(p + q[1]);
        rest(l);
        if (l.front) { l.a.rotation.x += s * .42 * amt; l.b.rotation.x += Math.max(0, -c) * .9 * amt; l.c.rotation.x += Math.max(0, -c) * .4 * amt; }
        else { l.a.rotation.x += s * .38 * amt; l.b.rotation.x -= Math.max(0, c) * .5 * amt; l.c.rotation.x += Math.max(0, c) * .5 * amt; }
      });
      body.position.y = Math.abs(Math.sin(p)) * .012 * amt;
      body.rotation.z = Math.sin(p) * .015 * amt;
      sniff += ((moving ? 0 : 1) - sniff) * Math.min(1, dt * 2);
      neckP.rotation.x = Math.sin(p * 2) * .04 * amt + sniff * .75;
      headP.rotation.x = .25 + sniff * .25 + (moving ? 0 : Math.sin(t * 9) * .04 * sniff);
      headP.rotation.y = sniff * Math.sin(t * .9) * .35;
      tailP.rotation.z = Math.sin(t * (moving ? 3 : 1.4)) * .25;
      tailP.rotation.x = .1;
      body.scale.set(1, 1 + Math.sin(t * 2.2) * .006, 1);
    } else {
      // lying: breathing; chin rests on the floor, then the head comes up to look around, then settles again (16 s loop)
      body.scale.set(1, 1 + Math.sin(t * 1.6) * .012, 1);
      var ph = ((t + (opts.offset || 0)) % 16) / 16;
      var up = sm(.42, .56, ph) * (1 - sm(.82, .97, ph));          // 0 = resting on the floor, 1 = head up
      var look = up * Math.sin((ph - .56) * Math.PI * 2 / .26);      // turns left/right only while up
      neckP.rotation.x = 1.05 - up * .95;
      headP.rotation.x = .25 - (1 - up) * .8 - up * .1;
      headP.rotation.y = look * .45;
      headP.rotation.z = (1 - up) * .06;
      var tw = (t % 7) < .25 ? Math.sin((t % 7) * 40) * .3 : 0;
      headP.userData["ear1"].rotation.x = -.35 + tw;
      tailP.rotation.z = .9 + Math.sin(t * .7) * .05;
    }
  }
  root.traverse(function (o) { if (o.isMesh) { o.castShadow = !o.userData.shell; o.receiveShadow = true; } });
  return { g: root, tick: tick };
}
