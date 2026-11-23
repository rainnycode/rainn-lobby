/* Galgo (greyhound) built in code, so it can really walk.
   make_galgo({ pose: "walk" | "lie", color }) -> { g, tick(t, moving) }
   Faces +Z, real-world meters (shoulder ~0.72 m); scale the group to fit the scene. */
function make_galgo(opts) {
  opts = opts || {};
  var pose = opts.pose || "walk";
  var coat = new THREE.MeshStandardMaterial({ color: opts.color || 0x8b8f96, roughness: .55, metalness: 0 });
  var dark = new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: .6 });
  var eyeM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .15 });
  var root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // Lofted body: rings along a spine, each an ellipse (half-width, half-height) with its own center.
  function loft(rings, seg) {
    seg = seg || 18;
    var pos = [], idx = [];
    rings.forEach(function (r) {
      for (var k = 0; k < seg; k++) { var a = k / seg * Math.PI * 2; pos.push(r[0] + Math.cos(a) * r[3], r[1] + Math.sin(a) * r[4], r[2]); }
    });
    for (var i = 0; i < rings.length - 1; i++) for (var k = 0; k < seg; k++) {
      var a = i * seg + k, b = i * seg + (k + 1) % seg, c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c);
    }
    // caps
    var n = pos.length / 3, f = rings[0], l = rings[rings.length - 1];
    pos.push(f[0], f[1], f[2] - .01, l[0], l[1], l[2] + .01);
    for (var k = 0; k < seg; k++) { idx.push(n, k, (k + 1) % seg); idx.push(n + 1, (rings.length - 1) * seg + (k + 1) % seg, (rings.length - 1) * seg + k); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  //            x   y(center) z      half-w half-h
  var torso = loft([
    [0, .64, -.44, .045, .05],
    [0, .67, -.36, .10, .12],
    [0, .68, -.26, .115, .13],
    [0, .70, -.12, .085, .085],
    [0, .69, -.02, .09, .10],
    [0, .63, .08, .12, .17],
    [0, .61, .17, .13, .2],
    [0, .65, .25, .11, .16],
    [0, .72, .3, .07, .08]
  ], 22);
  body.add(new THREE.Mesh(torso, coat));

  // neck + head on a pivot so it can look around
  var neckP = new THREE.Group(); neckP.position.set(0, .74, .28); body.add(neckP);
  neckP.add(new THREE.Mesh(loft([[0, -.01, -.05, .07, .08], [0, .07, .06, .058, .062], [0, .13, .17, .046, .05]], 16), coat));
  var headP = new THREE.Group(); headP.position.set(0, .15, .2); headP.rotation.x = .25; neckP.add(headP);
  headP.add(new THREE.Mesh(loft([[0, .02, -.08, .035, .04], [0, .03, -.04, .055, .055], [0, .02, .03, .045, .045], [0, -.005, .12, .028, .03], [0, -.02, .2, .016, .018]], 16), coat));
  var nose = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), eyeM); nose.position.set(0, -.018, .205); headP.add(nose);
  [-1, 1].forEach(function (s) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), eyeM); eye.position.set(s * .033, .04, .02); headP.add(eye);
    var ear = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), dark); ear.scale.set(.4, .55, 1.15); ear.position.set(s * .04, .065, -.07); ear.rotation.set(-.7, 0, s * .6); headP.add(ear);
    headP.userData["ear" + s] = ear;
  });

  // tail: long, thin, low, curling up at the tip
  var tailP = new THREE.Group(); tailP.position.set(0, .66, -.44); body.add(tailP);
  var tc = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -.12, -.08), new THREE.Vector3(0, -.32, -.1), new THREE.Vector3(0, -.42, -.02), new THREE.Vector3(0, -.38, .06)]);
  tailP.add(new THREE.Mesh(new THREE.TubeGeometry(tc, 24, .014, 8, false), coat));

  // legs: hip/shoulder -> knee -> ankle -> paw, each joint a pivot
  function seg(len, r0, r1) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 10, 1, true), coat); m.position.y = -len / 2; return m; }
  function leg(x, y, z, front) {
    var a = new THREE.Group(); a.position.set(x, y, z); body.add(a);
    var L1 = front ? .27 : .25, L2 = front ? .25 : .27, L3 = front ? .06 : .13;
    // muscled upper leg: a stretched sphere blends it into the body
    var up = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), coat); up.scale.set(front ? .036 : .048, L1 * .5, front ? .05 : .07); up.position.y = -L1 * .32; a.add(up);
    a.add(seg(L1, front ? .04 : .05, front ? .028 : .032));
    var b = new THREE.Group(); b.position.y = -L1; a.add(b); b.add(seg(L2, .026, .018));
    var kn = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), coat); b.add(kn);
    var c = new THREE.Group(); c.position.y = -L2; b.add(c); c.add(seg(L3, .017, .015));
    var an = new THREE.Mesh(new THREE.SphereGeometry(.019, 8, 6), coat); c.add(an);
    var paw = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 8), coat); paw.scale.set(1, .55, 1.5); paw.position.set(0, -L3, .02); c.add(paw);
    return { a: a, b: b, c: c, front: front };
  }
  var legs = [leg(-.07, .56, .16, true), leg(.07, .56, .16, true), leg(-.08, .64, -.3, false), leg(.08, .64, -.3, false)];
  // rest angles so hind legs have the greyhound's angled hock
  function rest(l) { if (l.front) { l.a.rotation.x = 0; l.b.rotation.x = 0; l.c.rotation.x = .15; } else { l.a.rotation.x = .35; l.b.rotation.x = -.75; l.c.rotation.x = .4; } }
  legs.forEach(rest);

  if (pose === "lie") {
    // "sphinx" down: body on the floor, front legs forward, hind legs folded to the side
    body.position.y = -.42; body.rotation.x = .04;
    legs.forEach(function (l, i) {
      if (l.front) { l.a.rotation.x = -1.45; l.b.rotation.x = .05; l.c.rotation.x = .1; l.a.position.z += .02; }
      else { l.a.rotation.set(-1.15, 0, (i === 2 ? -1 : 1) * .12); l.b.rotation.x = 2.75; l.c.rotation.x = -.2; l.a.position.x *= 1.35; }
    });
    tailP.rotation.set(-.2, 0, .9); neckP.rotation.x = .15;
  }

  var walkPhase = 0, sniff = 0;
  function tick(t, moving, dt) {
    dt = dt || 1 / 60;
    if (pose === "walk") {
      var amt = moving ? 1 : 0; walkPhase += dt * 6.2 * amt;
      var p = walkPhase;
      // trot: diagonal pairs move together
      [[0, 0], [1, Math.PI], [2, Math.PI], [3, 0]].forEach(function (q) {
        var l = legs[q[0]], s = Math.sin(p + q[1]), c = Math.cos(p + q[1]);
        rest(l);
        if (l.front) { l.a.rotation.x += s * .42 * amt; l.b.rotation.x += Math.max(0, -c) * .9 * amt; l.c.rotation.x += Math.max(0, -c) * .4 * amt; }
        else { l.a.rotation.x += s * .38 * amt; l.b.rotation.x -= Math.max(0, c) * .5 * amt; l.c.rotation.x += Math.max(0, c) * .5 * amt; }
      });
      body.position.y = Math.abs(Math.sin(p)) * .012 * amt;
      sniff += ((moving ? 0 : 1) - sniff) * Math.min(1, dt * 2);
      neckP.rotation.x = Math.sin(p * 2) * .04 * amt + sniff * .75;
      headP.rotation.x = .25 + sniff * .25 + (moving ? 0 : Math.sin(t * 9) * .04 * sniff);
      headP.rotation.y = sniff * Math.sin(t * .9) * .35;
      tailP.rotation.z = Math.sin(t * (moving ? 3 : 1.4)) * .25;
      tailP.rotation.x = .1;
    } else {
      // lying: breathing, a slow look around now and then, an ear twitch
      body.scale.set(1, 1 + Math.sin(t * 1.6) * .012, 1);
      var look = Math.max(0, Math.sin(t * .23)) ;
      neckP.rotation.x = .15 - look * .1; headP.rotation.y = Math.sin(t * .23) * .5 * look;
      var tw = (t % 7) < .25 ? Math.sin((t % 7) * 40) * .4 : 0;
      headP.userData["ear1"].rotation.x = -.6 + tw;
      tailP.rotation.z = .9 + Math.sin(t * .7) * .05;
    }
  }
  root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g: root, tick: tick };
}
