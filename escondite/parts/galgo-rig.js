/* Skeleton + walk cycle for the sculpted standing greyhound (galgos/galgo-pie.glb).
   The mesh comes from Tripo without bones, so we build them here: each vertex is bound
   to 1-2 bones by region (leg / spine / neck-head / tail) and distance along the bone.
   Model space: faces +Z, 1 unit long, paws at y = -0.37.
   rigGalgo(mesh) -> { root, tick(t, moving, dt) }  (replace the mesh by root in the scene) */
function rigGalgo(mesh) {
  var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  // joint positions measured on the mesh (model space)
  var J = {
    pelvis: V3(0, .1, -.3), spine: V3(0, .15, -.05), chest: V3(0, .12, .2), neck: V3(.01, .2, .3), head: V3(.1, .3, .4), nose: V3(.18, .25, .5),
    tail0: V3(-.045, .06, -.43), tail1: V3(-.045, -.08, -.47), tail2: V3(-.05, -.22, -.5), tailEnd: V3(-.05, -.3, -.5),
    FL: [V3(-.06, .04, .23), V3(-.058, -.08, .226), V3(-.055, -.28, .225), V3(-.07, -.37, .275)],
    FR: [V3(.06, .04, .21), V3(.06, -.08, .21), V3(.045, -.28, .21), V3(.088, -.37, .263)],
    HL: [V3(-.075, .06, -.3), V3(-.085, -.08, -.35), V3(-.135, -.24, -.388), V3(-.17, -.37, -.34)],
    HR: [V3(.065, .06, -.3), V3(.069, -.08, -.3), V3(.06, -.24, -.378), V3(.092, -.37, -.337)]
  };
  var bones = [], idx = {};
  function bone(name, pos, parent) {
    var b = new THREE.Bone(); b.name = name; idx[name] = bones.length; bones.push(b);
    if (parent) { b.position.copy(pos).sub(parent.userData.at); parent.add(b); } else b.position.copy(pos);
    b.userData.at = pos.clone(); return b;
  }
  var root = bone("root", V3(0, 0, 0));
  var pelvis = bone("pelvis", J.pelvis, root), spine = bone("spine", J.spine, pelvis), chest = bone("chest", J.chest, spine);
  var neck = bone("neck", J.neck, chest), head = bone("head", J.head, neck);
  var t0 = bone("tail0", J.tail0, pelvis), t1 = bone("tail1", J.tail1, t0), t2 = bone("tail2", J.tail2, t1);
  var legs = {};
  ["FL", "FR", "HL", "HR"].forEach(function (k) {
    var par = k[0] === "F" ? chest : pelvis, p = J[k];
    var a = bone(k + "1", p[0], par), b = bone(k + "2", p[1], a), c = bone(k + "3", p[2], b);
    legs[k] = { a: a, b: b, c: c, front: k[0] === "F", pts: p };
  });

  // ---------- skin weights ----------
  var g = mesh.geometry, P = g.attributes.position, n = P.count;
  var si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  var v = new THREE.Vector3(), tmp = new THREE.Vector3();
  function segT(p, a, b) { tmp.subVectors(b, a); var t = Math.max(0, Math.min(1, v.copy(p).sub(a).dot(tmp) / tmp.lengthSq())); return t; }
  function segD(p, a, b) { var t = segT(p, a, b); return p.distanceTo(tmp.subVectors(b, a).multiplyScalar(t).add(a)); }
  function set(i, b0, b1, w1) { si[i * 4] = idx[b0]; si[i * 4 + 1] = idx[b1 || b0]; sw[i * 4] = 1 - (w1 || 0); sw[i * 4 + 1] = w1 || 0; }
  function sm(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  for (var i = 0; i < n; i++) {
    var p = V3(P.getX(i), P.getY(i), P.getZ(i));
    var isTail = p.z < -.41 && Math.abs(p.x + .045) < .035 && p.y < .1;
    var front = p.z > .14 && p.z < .37 && p.y < .02, hind = p.z > -.47 && p.z < -.23 && p.y < .04 && !isTail;
    if (isTail) {
      if (p.y > -.08) set(i, "tail0", "tail1", sm(.04, -.08, p.y)); else set(i, "tail1", "tail2", sm(-.1, -.22, p.y));
    } else if (front || hind) {
      var k = front ? (p.x < 0 ? "FL" : "FR") : (p.x < -.015 ? "HL" : "HR"), L = legs[k], q = L.pts;
      var top = front ? .02 : .04;
      // segment by height with soft blends at the joints
      var y1 = q[1].y, y2 = q[2].y;
      if (p.y > y1) set(i, k + "1", front ? "chest" : "pelvis", sm(y1 + .03, top, p.y));      // upper leg, melting into the body at the top
      else if (p.y > y2) set(i, k + "2", k + "1", sm(y1 - .03, y1 + .03, p.y));            // lower leg, blended at the elbow/knee
      else set(i, k + "3", k + "2", sm(y2 - .025, y2 + .025, p.y));
    } else if (p.z > .24 && p.y > .1) {
      var tt = segT(p, J.neck, J.head);
      set(i, "neck", "head", sm(.45, .85, tt));
    } else {
      // body: pelvis -> spine -> chest by length
      if (p.z < -.05) set(i, "pelvis", "spine", sm(-.25, -.05, p.z)); else set(i, "spine", "chest", sm(-.02, .18, p.z));
    }
  }
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  var mat = mesh.material; mat.skinning = true; mat.needsUpdate = true;
  var sk = new THREE.SkinnedMesh(g, mat); sk.add(root); sk.updateMatrixWorld(true); sk.bind(new THREE.Skeleton(bones)); sk.castShadow = true; sk.receiveShadow = true;
  sk.frustumCulled = false;

  // ---------- walk cycle ----------
  var phase = 0, sniff = 0;
  function tick(t, moving, dt) {
    dt = dt || 1 / 60; var amt = moving ? 1 : 0; phase += dt * 6.0 * amt; var p = phase;
    // dog walk (lateral sequence): hind-left, fore-left, hind-right, fore-right, a quarter cycle apart.
    // Each foot: 60% stance (leg sweeps back, nearly straight), 40% swing (lifts, folds, reaches forward).
    // Bone x-rotation: + swings the part backward, - forward (model faces +Z).
    var lift = 0;
    [["HL", 0], ["FL", .25], ["HR", .5], ["FR", .75]].forEach(function (q) {
      var L = legs[q[0]], u = ((p / (Math.PI * 2) + q[1]) % 1 + 1) % 1, A = L.front ? .3 : .26, swing, fold;
      if (u < .6) { swing = -A + 2 * A * (u / .6); fold = 0; }
      else { var w = (u - .6) / .4, e = w * w * (3 - 2 * w); swing = A - 2 * A * e; fold = Math.sin(w * Math.PI); lift += fold; }
      swing *= amt; fold *= amt;
      if (L.front) { L.a.rotation.x = swing; L.b.rotation.x = -fold * .3; L.c.rotation.x = fold * 1.15; }      // elbow forward, wrist folds back
      else { L.a.rotation.x = swing - fold * .15; L.b.rotation.x = fold * .55; L.c.rotation.x = -fold * .75; }  // stifle flexes, hock lifts the foot
    });
    root.position.y = (Math.sin(p * 2) * .004 - .002) * amt;
    pelvis.rotation.z = Math.sin(p) * .025 * amt; chest.rotation.z = Math.sin(p + 1.6) * .02 * amt; pelvis.rotation.y = Math.sin(p) * .03 * amt;
    sniff += ((moving ? 0 : 1) - sniff) * Math.min(1, dt * 2);
    neck.rotation.x = Math.sin(p * 2 + .8) * .025 * amt + sniff * .55;
    head.rotation.x = sniff * .2 + (moving ? 0 : Math.sin(t * 9) * .03 * sniff);
    neck.rotation.y = sniff * Math.sin(t * .9) * .25;
    t0.rotation.z = Math.sin(t * (moving ? 3 : 1.4)) * .2; t1.rotation.z = Math.sin(t * (moving ? 3 : 1.4) - .6) * .15;
    chest.scale.y = 1 + Math.sin(t * 2.2) * .006;
  }
  return { root: sk, tick: tick, bones: bones };
}
