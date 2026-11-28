// Gotas: login (Google o link al correo) + contador en el HUD + avisos.
// Usa Supabase (proyecto 1080colorado). Las gotas solo cambian por las funciones del servidor
// (completar_mision, comprar), así que desde aquí no se pueden inventar.
(function () {
  var CFG = window.ESCONDITE_SUPABASE || {
    url: "https://gcqrmufhssizjverddxn.supabase.co",
    key: "sb_publishable_MIHDsCdrFz--Pkrks0TQng_TnMQ83sl"
  };
  var $ = function (id) { return document.getElementById(id); };
  var btn = $("gotas"), num = $("gotas-n"), lbl = $("gotas-l");
  var modal = $("auth"), toast = $("gtoast");
  if (!btn || !modal) return;

  var inFrame = (function () { try { return window.top !== window.self; } catch (e) { return true; } })();
  var sb = null, user = null, perfil = null, listeners = [];
  var DROP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c0 0-6.8 7.6-6.8 12.4a6.8 6.8 0 0013.6 0C18.8 10.1 12 2.5 12 2.5z"/></svg>';

  function sfx(k) { if (window.escSfx) window.escSfx(k); }
  function emit() { listeners.forEach(function (f) { try { f(user, perfil); } catch (e) {} }); }

  // ---------- HUD ----------
  function paint() {
    if (user && perfil) {
      btn.classList.add("in"); lbl.textContent = "gotas"; num.textContent = perfil.gotas;
      btn.setAttribute("aria-label", perfil.gotas + " gotas. Ver tu cuenta");
    } else {
      btn.classList.remove("in"); lbl.textContent = "Entrar"; num.textContent = "";
      btn.setAttribute("aria-label", "Entrar para ganar gotas");
    }
  }
  function bump(to) {
    if (!perfil) return;
    var from = perfil.gotas; perfil.gotas = to; emit();
    if (to === from) { paint(); return; }
    btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
    var t0 = performance.now(), D = 700;
    (function step(now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      num.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else paint();
    })(t0);
  }

  // ---------- toast ("+20 gotas") ----------
  var toastT = 0;
  function showToast(big, small) {
    toast.querySelector(".gt-big").innerHTML = DROP + "<span>" + big + "</span>";
    toast.querySelector(".gt-small").textContent = small || "";
    toast.hidden = false; requestAnimationFrame(function () { toast.classList.add("show"); });
    clearTimeout(toastT); toastT = setTimeout(hideToast, small && small.length > 40 ? 6500 : 3800);
  }
  function hideToast() { toast.classList.remove("show"); setTimeout(function () { if (!toast.classList.contains("show")) toast.hidden = true; }, 260); }
  toast.addEventListener("click", hideToast);

  // ---------- modal ----------
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement; render();
    modal.hidden = false; document.body.classList.add("auth-open");
    requestAnimationFrame(function () { modal.classList.add("open"); });
    sfx("open");
    setTimeout(function () { var f = modal.querySelector(user ? "#au-out" : "#au-google"); if (f && !("ontouchstart" in window)) f.focus({ preventScroll: true }); }, 60);
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.classList.remove("open"); document.body.classList.remove("auth-open"); sfx("back");
    setTimeout(function () { if (!modal.classList.contains("open")) modal.hidden = true; }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function render() {
    var box = modal.querySelector(".au-box");
    if (!sb) {
      box.innerHTML = '<span class="au-eb">Gotas</span><h2>El login no cargó</h2><p class="au-p">Revisa tu conexión y recarga la página.</p><button class="au-ghost" data-close type="button">Cerrar</button>';
      return;
    }
    if (user && perfil) {
      box.innerHTML =
        '<span class="au-eb">Tu cuenta</span>' +
        '<h2>Hola, ' + esc(perfil.nombre || "") + '</h2>' +
        '<div class="au-count">' + DROP + '<b>' + perfil.gotas + '</b><span>gotas</span></div>' +
        '<div class="au-og" id="au-og" hidden><span class="au-og-t">Desde el inicio</span><p>Peleaste contra Kingpin en KILLPIN, el primer juego. Gracias por estar desde el principio: <b>+20 gotas</b>.</p></div>' +
        '<p class="au-p">Gana más gotas con las misiones del escondite. Pronto vas a poder gastarlas en la tienda.</p>' +
        '<ul class="au-mis" id="au-mis"><li class="au-load">Cargando misiones…</li></ul>' +
        '<div class="au-row"><button class="au-ghost" data-close type="button">Seguir explorando</button><button class="au-link" id="au-out" type="button">Salir</button></div>';
      loadMissions();
      return;
    }
    box.innerHTML =
      '<span class="au-eb">Gotas · moneda del escondite</span>' +
      '<h2>Entra al escondite</h2>' +
      '<p class="au-p">Guarda tus gotas y gana más con misiones y secretos. Solo te pedimos tu nombre y correo.</p>' +
      (inFrame ? '<p class="au-warn">El login funciona en la página publicada, no en esta vista previa.</p>' : '') +
      '<button class="au-google" id="au-google" type="button"' + (inFrame ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.3 6.6 2.3 12s4.3 9.8 9.7 9.8c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>Seguir con Google</button>' +
      '<div class="au-or"><span>o con tu correo</span></div>' +
      '<form id="au-form" novalidate><label class="au-lab" for="au-email">Correo</label>' +
      '<input id="au-email" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@gmail.com" required' + (inFrame ? ' disabled' : '') + '>' +
      '<button class="au-red" id="au-send" type="submit"' + (inFrame ? ' disabled' : '') + '>Mandarme el link</button></form>' +
      '<p class="au-msg" id="au-msg" role="status"></p>' +
      '<button class="au-ghost" data-close type="button">Ahora no</button>';
  }

  function msg(t, bad) { var m = $("au-msg"); if (m) { m.textContent = t; m.classList.toggle("bad", !!bad); } }
  function here() { return location.origin + location.pathname; }

  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest("[data-close]")) { closeModal(); return; }
    if (e.target.closest("#au-google")) {
      sfx("select");
      sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: here() } }).then(function (r) { if (r.error) msg("No se pudo abrir Google. Intenta otra vez.", true); });
      return;
    }
    if (e.target.closest("#au-out")) { sb.auth.signOut().then(function () { closeModal(); }); return; }
  });
  modal.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("au-email"), email = (input.value || "").trim(), send = $("au-send");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg("Ese correo no se ve bien.", true); input.focus(); return; }
    send.disabled = true; send.textContent = "Enviando…"; msg("");
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: here() } }).then(function (r) {
      send.disabled = false; send.textContent = "Mandarme el link";
      if (r.error) {
        var limit = /rate|limit|seconds/i.test(r.error.message || "");
        msg(limit ? "Espera un momento y vuelve a intentar." : "No se pudo mandar el link. Intenta otra vez.", true);
        return;
      }
      sfx("select");
      msg("Listo. Revisa tu correo (también spam) y toca el link para entrar.");
    });
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) { e.stopImmediatePropagation(); closeModal(); }
    else if (!modal.hidden) e.stopImmediatePropagation(); // que escribir el correo no mueva la escena
  }, true);
  btn.addEventListener("click", function () { if (modal.hidden) openModal(); else closeModal(); });

  function loadMissions() {
    Promise.all([
      sb.from("misiones").select("id,nombre,recompensa").order("recompensa"),
      sb.from("misiones_hechas").select("mision_id")
    ]).then(function (r) {
      var ul = $("au-mis"); if (!ul) return;
      if (r[0].error) { ul.innerHTML = ""; return; }
      var done = {}; (r[1].data || []).forEach(function (m) { done[m.mision_id] = 1; });
      // Kingpin no es misión: es un agradecimiento a los que estuvieron desde KILLPIN, el primer juego.
      var og = $("au-og"); if (og && done.bienvenida_kingpin) og.hidden = false;
      ul.innerHTML = r[0].data.filter(function (m) { return m.id !== "bienvenida_kingpin"; }).map(function (m) {
        var ok = !!done[m.id], secret = m.id === "diego_telefono" && !ok;
        return '<li class="' + (ok ? "ok" : "") + '"><i aria-hidden="true"></i><span>' + esc(secret ? "???" : m.nombre) + '</span><b>+' + m.recompensa + '</b></li>';
      }).join("");
    });
  }

  // ---------- sesión ----------
  function loadPerfil(tries) {
    return sb.from("perfiles").select("nombre,gotas").maybeSingle().then(function (r) {
      if (r.data) { perfil = r.data; paint(); emit(); return true; }
      if ((tries || 0) < 4) return new Promise(function (ok) { setTimeout(ok, 600); }).then(function () { return loadPerfil((tries || 0) + 1); });
      return false;
    });
  }
  function checkAviso() {
    sb.rpc("ver_aviso").then(function (r) {
      if (r.data) { var m = /(\d+)\s*gotas/.exec(r.data); showToast(m ? "+" + m[1] + " gotas" : "Gotas", r.data); sfx("open"); }
    });
  }
  var handled = null;
  function onSession(session, fresh) {
    var was = handled;
    user = session ? session.user : null;
    if (!user) { handled = null; perfil = null; paint(); emit(); return; }
    if (handled === user.id) return;
    handled = user.id;
    loadPerfil(0).then(function (ok) {
      if (!ok) return;
      checkAviso();
      if (fresh && !was) { showToast("Bienvenido, " + esc((perfil.nombre || "").split(" ")[0]), "Tus gotas se guardan en tu cuenta."); }
      flushPending();
    });
    if (location.hash && /access_token|error_description/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }

  // misiones que se hicieron sin sesión: se guardan y se cobran al entrar
  var pending = [];
  function flushPending() { var p = pending; pending = []; p.forEach(function (id) { completar(id); }); }

  function completar(id) {
    if (!sb) return Promise.resolve(null);
    if (!user) {
      if (pending.indexOf(id) < 0) pending.push(id);
      showToast("Entra para guardar tus gotas", "Toca «Entrar» arriba y no pierdes lo que ganaste.");
      return Promise.resolve(null);
    }
    var before = perfil ? perfil.gotas : 0;
    return sb.rpc("completar_mision", { p_mision: id }).then(function (r) {
      if (r.error) return null;
      var after = r.data;
      if (after > before) { showToast("+" + (after - before) + " gotas", ""); sfx("open"); }
      bump(after); return after;
    });
  }
  function comprar(id) {
    if (!sb || !user) { openModal(); return Promise.resolve({ error: "no_login" }); }
    return sb.rpc("comprar", { p_item: id }).then(function (r) {
      if (r.error) { var m = /(\w+)$/.exec(r.error.message || ""); return { error: m ? m[1] : "error" }; }
      bump(r.data); return { gotas: r.data };
    });
  }

  window.Gotas = {
    completar: completar, comprar: comprar, abrir: openModal,
    user: function () { return user; }, gotas: function () { return perfil ? perfil.gotas : null; },
    onChange: function (f) { listeners.push(f); }
  };

  paint();
  if (!window.supabase || !window.supabase.createClient) { btn.classList.add("off"); return; }
  sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  var arrivedFromLink = /access_token|code=/.test(location.hash + location.search);
  sb.auth.getSession().then(function (r) { onSession(r.data.session, arrivedFromLink); });
  sb.auth.onAuthStateChange(function (ev, session) {
    if (ev === "SIGNED_IN") onSession(session, arrivedFromLink);
    else if (ev === "SIGNED_OUT") onSession(null);
  });
})();
