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
    FL: [V3(-.06, .1, .22), V3(-.058, -.08, .226), V3(-.055, -.28, .225), V3(-.07, -.37, .275)],
    FR: [V3(.06, .1, .2), V3(.06, -.08, .21), V3(.045, -.28, .21), V3(.088, -.37, .263)],
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
    var front = p.z > .14 && p.z < .37 && p.y < .08 && Math.abs(p.x) > (p.y > -.02 ? .03 : 0), hind = p.z > -.47 && p.z < -.23 && p.y < .04 && !isTail;
    if (isTail) {
      if (p.y > -.08) set(i, "tail0", "tail1", sm(.04, -.08, p.y)); else set(i, "tail1", "tail2", sm(-.1, -.22, p.y));
    } else if (front || hind) {
      var k = front ? (p.x < 0 ? "FL" : "FR") : (p.x < -.015 ? "HL" : "HR"), L = legs[k], q = L.pts;
      var top = front ? .08 : .04;
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

  // ---------- gaits ----------
  // tick(t, gait, dt) with gait = { walk: 0..1, run: 0..1 }; both 0 = idle (breathing, looking, sniffing).
  // WALK: feet are planted with 2-bone IK (sagittal plane): each paw stays still on the floor while the body
  // passes over it, then lifts in an arc. Front elbow bends backward, hind stifle forward; the paw/hock flips on lift.
  // RUN: rotary gallop (shoulder reach, hind drive, spine stretch/gather).
  // Bone x-rotation: + swings backward, - forward (model faces +Z). phi(v): 0 = straight down, + = pointing back.
  function phi(dy, dz) { return Math.atan2(-dz, -dy); }
  var GROUND = -.37, WALK_F = 1.05, STRIDE = .22, LIFT = .055, DROP = .022;
  ["FL", "FR", "HL", "HR"].forEach(function (k) {
    var L = legs[k], q = L.pts;
    L.l1 = Math.hypot(q[1].y - q[0].y, q[1].z - q[0].z); L.l2 = Math.hypot(q[2].y - q[1].y, q[2].z - q[1].z); L.l3 = Math.hypot(q[3].y - q[2].y, q[3].z - q[2].z);
    L.p1 = phi(q[1].y - q[0].y, q[1].z - q[0].z); L.p2 = phi(q[2].y - q[1].y, q[2].z - q[1].z); L.p3 = phi(q[3].y - q[2].y, q[3].z - q[2].z);
    L.footZ = q[3].z;
  });
  function walkLeg(L, u, out) {
    // paw target in body space
    var z, y, sw = 0;
    if (u < .62) { z = L.footZ + STRIDE / 2 - STRIDE * (u / .62); y = GROUND; }
    else { sw = (u - .62) / .38; var e = sw * sw * (3 - 2 * sw); z = L.footZ - STRIDE / 2 + STRIDE * e; y = GROUND + LIFT * Math.sin(Math.PI * sw); }
    y += DROP;                                                   // body is lowered by DROP, so in body space the floor is higher
    var flip = Math.sin(Math.PI * sw);                            // paw / hock flips back while in the air
    var a3 = L.p3 + (L.front ? flip * 1.25 : flip * .45);          // absolute angle of the last segment
    var wy = y + Math.cos(a3) * L.l3, wz = z + Math.sin(a3) * L.l3; // wrist / hock position
    var sy = L.pts[0].y, sz = L.pts[0].z, dy = wy - sy, dz = wz - sz;
    var D = Math.min(Math.hypot(dy, dz), (L.l1 + L.l2) * .999), base = phi(dy, dz);
    var al = Math.acos(Math.max(-1, Math.min(1, (L.l1 * L.l1 + D * D - L.l2 * L.l2) / (2 * L.l1 * D))));
    var a1 = L.front ? base + al : base - al;                      // elbow behind / stifle in front
    var ey = sy - Math.cos(a1) * L.l1, ez = sz - Math.sin(a1) * L.l1;
    var a2 = phi(wy - ey, wz - ez);
    var r1 = a1 - L.p1, r2 = (a2 - L.p2) - r1, r3 = (a3 - L.p3) - (a2 - L.p2);
    out.push(r1, r2, r3);
  }
  var wPhase = 0, rPhase = 0, sniffT = 0, cur = { walk: 0, run: 0 };
  function tick(t, gait, dt) {
    dt = dt || 1 / 60;
    if (typeof gait !== "object") gait = { walk: 0, run: gait ? 1 : 0 };
    cur.walk += (gait.walk - cur.walk) * Math.min(1, dt * 3); cur.run += (gait.run - cur.run) * Math.min(1, dt * 3);
    var W = cur.walk * (1 - cur.run), R = cur.run, idle = Math.max(0, 1 - W - R);
    wPhase += dt * WALK_F * Math.min(1, W * 1.5); rPhase += dt * 2.3 * R;
    // --- walk (lateral sequence: HL, FL, HR, FR) ---
    var wr = [];
    [["FL", .25], ["FR", .75], ["HL", 0], ["HR", .5]].forEach(function (q) { walkLeg(legs[q[0]], ((wPhase + q[1]) % 1 + 1) % 1, wr); });
    // --- gallop ---
    var th = rPhase * Math.PI * 2, rr = [];
    [["FL", 0], ["FR", -.35], ["HL", 0], ["HR", -.35]].forEach(function (q) {
      var L = legs[q[0]], a = th + q[1], c = Math.cos(a), s = Math.sin(a), f;
      if (L.front) { f = Math.max(0, -s); rr.push(-.78 * c - f * .05, f * .55 - Math.max(0, c) * .12, f * 1.35 - Math.max(0, c) * .18); }
      else { f = Math.max(0, s); rr.push(.7 * c, f * .85 + Math.max(0, c) * .1, -f * 1.0 - Math.max(0, c) * .25); }
    });
    ["FL", "FR", "HL", "HR"].forEach(function (k, i) {
      var L = legs[k];
      L.a.rotation.x = W * wr[i * 3] + R * rr[i * 3];
      L.b.rotation.x = W * wr[i * 3 + 1] + R * rr[i * 3 + 1];
      L.c.rotation.x = W * wr[i * 3 + 2] + R * rr[i * 3 + 2];
    });
    // --- body ---
    var wth = wPhase * Math.PI * 2, c0 = Math.cos(th);
    pelvis.rotation.x = R * (-.16 * c0); chest.rotation.x = R * (.1 * c0); spine.rotation.x = R * (-.05 * c0);
    pelvis.rotation.z = W * Math.sin(wth) * .03; chest.rotation.z = W * Math.sin(wth + 1.6) * .025;
    pelvis.rotation.y = W * Math.sin(wth) * .03;
    root.position.y = -W * DROP + W * Math.sin(wth * 4) * .003 + R * (.035 * Math.max(0, Math.sin(th * 2 + .6)) - .01);
    // --- head & tail ---
    sniffT += dt;
    var sniff = idle * Math.max(0, Math.sin(sniffT * .35));
    neck.rotation.x = R * (.32 + Math.sin(th) * .05) + W * (.12 + Math.sin(wth * 2 + .5) * .035) + idle * (sniff * .6 + Math.sin(t * .5) * .03);
    head.rotation.x = R * (-.18) + W * (-.05) + idle * (sniff * .2 + Math.sin(t * 7) * .02 * sniff);
    neck.rotation.y = idle * Math.sin(t * .3) * .35 * (1 - sniff) + W * Math.sin(t * .4) * .12;
    t0.rotation.x = R * .9 + W * .25; t1.rotation.x = R * .2;
    t0.rotation.z = (idle + W) * Math.sin(t * (1.4 + W * 1.2)) * .15 + R * Math.sin(th) * .05; t1.rotation.z = (idle + W) * Math.sin(t * 1.4 - .6) * .12;
    chest.scale.y = 1 + Math.sin(t * (2 + R * 3)) * (.006 + R * .006);
  }
  return { root: sk, tick: tick, bones: bones };
}
