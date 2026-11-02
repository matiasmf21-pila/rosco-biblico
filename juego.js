/* Rosco Bíblico, modo presencial.
   Cada jugador tiene su propio rosco y su propio reloj, que solo corre en su turno.
   Se responde en voz alta: alguien toca "Ver respuesta" y el grupo marca "Acertó" o "Falló".
   Cada jugador juega su rosco completo; el turno pasa al siguiente cuando termina o se le acaba el tiempo. */
(function () {
  'use strict';

  var BANCO = window.BANCO || {};
  var ORDEN = 'ABCDEFGHIJLMNOPQRSTUVXZ'.split('').filter(function (l) { return BANCO[l] && BANCO[l].length; });
  var N = ORDEN.length;
  var K_CFG = 'rosco-config';
  var K_VISTAS = 'rosco-vistas';
  var NOMBRES_BASE = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6', 'Jugador 7', 'Jugador 8'];
  var NOTA_MODO = {
    anfitrion: 'Quien sostiene la pantalla lee la pista en voz alta, ve la respuesta correcta y marca si el jugador acertó. Los jugadores no miran la pantalla.',
    compartida: 'Todos ven la pista en la pantalla. La respuesta se muestra solo después de que el jugador responda en voz alta, y el grupo marca si acertó.'
  };

  function $(id) { return document.getElementById(id); }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function leer(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
  function mezclar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  /* ---------- Ajustes ---------- */
  var cfg = leer(K_CFG, {});
  cfg.n = cfg.n || 2;
  cfg.time = (cfg.time === 0 || cfg.time) ? cfg.time : 150;
  cfg.dif = cfg.dif || 'mezcla';
  cfg.cat = cfg.cat || { p: true, l: true, o: true };
  cfg.names = cfg.names || [];
  cfg.modo = cfg.modo || 'anfitrion';
  function esAnfitrion() { return cfg.modo === 'anfitrion'; }

  function mostrar(id) {
    ['inicio', 'juego', 'final'].forEach(function (p) { $(p).hidden = (p !== id); });
    window.scrollTo(0, 0);
  }

  function pintarAjustes() {
    Array.prototype.forEach.call(document.querySelectorAll('.seg[data-key]'), function (seg) {
      var k = seg.dataset.key;
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.v) === String(cfg[k]) ? 'true' : 'false');
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('#cats button'), function (b) {
      b.setAttribute('aria-pressed', cfg.cat[b.dataset.cat] ? 'true' : 'false');
    });
    $('notaModo').textContent = NOTA_MODO[cfg.modo];
    var box = $('nombres');
    box.textContent = '';
    for (var i = 0; i < cfg.n; i++) {
      var inp = el('input');
      inp.type = 'text';
      inp.maxLength = 14;
      inp.placeholder = NOMBRES_BASE[i];
      inp.value = cfg.names[i] || '';
      inp.dataset.i = i;
      inp.setAttribute('aria-label', 'Nombre del jugador ' + (i + 1));
      box.appendChild(inp);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.seg[data-key]'), function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var k = seg.dataset.key;
      cfg[k] = (k === 'dif' || k === 'modo') ? b.dataset.v : parseInt(b.dataset.v, 10);
      guardar(K_CFG, cfg);
      pintarAjustes();
    });
  });
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var c = b.dataset.cat;
    var activos = Object.keys(cfg.cat).filter(function (x) { return cfg.cat[x]; });
    if (cfg.cat[c] && activos.length === 1) return;
    cfg.cat[c] = !cfg.cat[c];
    guardar(K_CFG, cfg);
    pintarAjustes();
  });
  $('nombres').addEventListener('input', function (e) {
    var i = e.target.dataset.i;
    if (i === undefined) return;
    cfg.names[i] = e.target.value;
    guardar(K_CFG, cfg);
  });
  $('btnOlvidar').addEventListener('click', function () {
    guardar(K_VISTAS, []);
    $('avisoOlvidar').textContent = 'Listo: todas las preguntas vuelven a estar disponibles.';
    setTimeout(function () { $('avisoOlvidar').textContent = ''; }, 3500);
  });

  /* ---------- Preguntas ---------- */
  function permitida(e) {
    if (!cfg.cat[e[0]]) return false;
    if (cfg.dif === 'facil') return e[1] <= 2;
    if (cfg.dif === 'dificil') return e[1] >= 2;
    return true;
  }
  function idDe(L, e) { return L + ':' + norm(e[2]); }
  function crearPregunta(L, e) {
    return { L: L, modo: norm(e[2]).indexOf(L.toLowerCase()) === 0 ? 's' : 'c', ans: e[2], alt: e[4] || '', clue: e[3] };
  }

  /* Reparte una pregunta distinta por letra a cada jugador.
     Prefiere las que todavía no salieron en partidas anteriores; si se agotan, repite. */
  function repartir(nombres) {
    var vistas = leer(K_VISTAS, []);
    var set = {};
    vistas.forEach(function (v) { set[v] = 1; });
    var jugadores = nombres.map(function (n) {
      return { name: n, qs: [], st: [], cur: 0, time: cfg.time, used: 0, ok: 0, bad: 0, done: false };
    });
    var nuevas = [];
    ORDEN.forEach(function (L) {
      var banco = BANCO[L];
      var tandas = [
        banco.filter(function (e) { return permitida(e) && !set[idDe(L, e)]; }),
        banco.filter(permitida),
        banco
      ];
      var elegidas = [];
      tandas.forEach(function (t) {
        mezclar(t).forEach(function (e) {
          if (elegidas.length < jugadores.length && elegidas.indexOf(e) === -1) elegidas.push(e);
        });
      });
      jugadores.forEach(function (j, i) {
        var e = elegidas[i % elegidas.length];
        j.qs.push(crearPregunta(L, e));
        j.st.push('idle');
        nuevas.push(idDe(L, e));
      });
    });
    guardar(K_VISTAS, vistas.concat(nuevas).slice(-3000));
    return jugadores;
  }

  /* ---------- Rosco ---------- */
  var bubbles = [];
  function construirRing() {
    var ring = $('ring');
    ORDEN.forEach(function (L, i) {
      var ang = (-90 + i * 360 / N) * Math.PI / 180;
      var d = el('div', 'bubble', L);
      d.setAttribute('aria-hidden', 'true');
      d.style.left = (50 + 45 * Math.cos(ang)).toFixed(3) + '%';
      d.style.top = (50 + 45 * Math.sin(ang)).toFixed(3) + '%';
      ring.appendChild(d);
      bubbles.push(d);
    });
  }

  /* ---------- Partida ---------- */
  var g = null;
  var avisoTimer = null, avisoCb = null, lock = null;

  function activo() { return g.jugadores[g.turno]; }

  function siguienteLetra(j, desde) {
    for (var s = 1; s <= N; s++) {
      var k = (desde + s) % N;
      if (j.st[k] === 'idle' || j.st[k] === 'pass') return k;
    }
    return -1;
  }

  function anunciar(titulo, sub, cb, boton) {
    clearTimeout(avisoTimer);
    g.aviso = true;
    $('ovTitulo').textContent = titulo;
    $('ovSub').textContent = sub || '';
    var b = $('ovBtn');
    b.hidden = !boton;
    b.textContent = boton || 'Continuar';
    avisoCb = cb || null;
    $('overlay').hidden = false;
    if (boton) b.focus(); else avisoTimer = setTimeout(cerrarAviso, 1800);
  }
  function cerrarAviso() {
    clearTimeout(avisoTimer);
    $('overlay').hidden = true;
    if (g) { g.aviso = false; g.ultimo = Date.now(); }
    var cb = avisoCb;
    avisoCb = null;
    if (cb) cb();
  }
  $('overlay').addEventListener('click', function (e) {
    if ($('ovBtn').hidden || e.target.id === 'ovBtn') cerrarAviso();
  });

  function iniciarPartida(nombres) {
    if (g && g.reloj) clearInterval(g.reloj);
    clearTimeout(avisoTimer);
    $('overlay').hidden = true;
    g = { nombres: nombres, jugadores: repartir(nombres), turno: 0, revelada: false, aviso: false, activa: true, ultimo: Date.now(), reloj: null, dets: [] };
    mostrar('juego');
    pedirPantallaActiva();
    render();
    var q = g.jugadores[0].qs[0];
    anunciar('Turno de ' + nombres[0], 'Empieza con la ' + q.L, null, 'Comenzar');
    g.reloj = setInterval(tic, 200);
  }

  function render() {
    var j = activo();
    var q = j.qs[j.cur];

    var m = $('marcador');
    m.textContent = '';
    g.dets = [];
    g.jugadores.forEach(function (p, i) {
      var d = el('div', 'jug' + (i === g.turno ? ' act' : '') + (p.done ? ' fin' : ''));
      d.appendChild(el('span', 'nom', p.name));
      d.appendChild(el('span', 'num', p.ok));
      var det = el('span', 'det');
      d.appendChild(det);
      m.appendChild(d);
      g.dets.push(det);
    });

    for (var i = 0; i < N; i++) bubbles[i].className = 'bubble ' + j.st[i] + (i === j.cur ? ' cur' : '');
    $('bigLetter').textContent = q.L;
    $('nOk').textContent = j.ok;
    $('nBad').textContent = j.bad;

    $('turnoDe').textContent = 'Turno de ' + j.name;
    $('tipo').textContent = (q.modo === 'c' ? 'Contiene la ' : 'Empieza con ') + q.L;
    $('pista').textContent = q.clue;
    var anf = esAnfitrion();
    var verResp = anf || g.revelada;
    $('revela').hidden = !verResp;
    $('lbResp').textContent = anf ? 'Respuesta (solo para quien tiene la pantalla)' : 'Respuesta';
    $('respuesta').textContent = q.ans;
    $('tambien').textContent = q.alt ? 'También vale: ' + q.alt : '';
    $('acc1').hidden = anf || g.revelada;
    $('acc2').hidden = !verResp;
    $('btnPasa2').hidden = !anf;
    $('atajos').textContent = anf ? 'A: acertó · F: falló · P: pasapalabra' : (g.revelada ? 'A: acertó · F: falló' : 'Espacio: ver respuesta · P: pasapalabra');
    pintarReloj();
  }

  function pintarReloj() {
    g.jugadores.forEach(function (p, i) {
      var t = p.done ? 'terminó' : (cfg.time > 0 ? fmt(p.time) : fmt(p.used));
      g.dets[i].textContent = p.bad + (p.bad === 1 ? ' fallo' : ' fallos') + ' · ' + t;
    });
    var j = activo();
    var c = $('clock');
    c.textContent = cfg.time > 0 ? fmt(j.time) : fmt(j.used);
    c.classList.toggle('warn', cfg.time > 0 && j.time <= 15);
    var anillo = $('ring');
    anillo.style.setProperty('--t', cfg.time > 0 ? Math.max(0, Math.min(1, j.time / cfg.time)).toFixed(4) : '0');
    anillo.classList.toggle('warn', cfg.time > 0 && j.time <= 15);
  }

  function tic() {
    if (!g || !g.activa) return;
    var ahora = Date.now();
    if (g.aviso) { g.ultimo = ahora; return; }
    var dt = (ahora - g.ultimo) / 1000;
    g.ultimo = ahora;
    var j = activo();
    if (!g.revelada) {
      j.used += dt;
      if (cfg.time > 0) {
        j.time -= dt;
        if (j.time <= 0) {
          j.time = 0;
          j.done = true;
          cambiarTurno('tiempo');
          return;
        }
      }
    }
    pintarReloj();
  }

  function ver() {
    if (!g || !g.activa || g.aviso || g.revelada) return;
    g.revelada = true;
    render();
  }

  function veredicto(acerto) {
    if (!g || !g.activa || g.aviso || !(g.revelada || esAnfitrion())) return;
    var j = activo();
    var letra = j.qs[j.cur].L;
    j.st[j.cur] = acerto ? 'ok' : 'bad';
    if (acerto) j.ok++; else j.bad++;
    g.revelada = false;
    var k = siguienteLetra(j, j.cur);
    if (k === -1) j.done = true; else j.cur = k;
    if (j.done) cambiarTurno('termino', letra); else render();
  }

  function pasar() {
    if (!g || !g.activa || g.aviso || g.revelada) return;
    var j = activo();
    j.st[j.cur] = 'pass';
    j.cur = siguienteLetra(j, j.cur);
    render();
  }

  function cambiarTurno(motivo, letra) {
    var anterior = activo();
    g.revelada = false;
    var sig = -1;
    for (var s = 1; s <= g.jugadores.length; s++) {
      var k = (g.turno + s) % g.jugadores.length;
      if (!g.jugadores[k].done) { sig = k; break; }
    }
    if (sig === -1) { render(); terminarPartida(); return; }
    if (sig === g.turno) { render(); return; }
    g.turno = sig;
    render();
    var msg = {
      fallo: 'Falló la ' + letra + ': pasa el turno',
      pasa: anterior.name + ' dijo pasapalabra',
      termino: anterior.name + ' completó su rosco',
      tiempo: anterior.name + ' se quedó sin tiempo'
    }[motivo];
    anunciar('Turno de ' + g.jugadores[sig].name, msg + ' · Empieza con la ' + g.jugadores[sig].qs[g.jugadores[sig].cur].L, null, 'Comenzar');
  }

  function pausar() {
    if (!g || !g.activa || g.aviso) return;
    anunciar('Pausa', 'El reloj está detenido', null, 'Reanudar');
  }

  /* ---------- Resultados ---------- */
  function terminarPartida() {
    if (!g || !g.activa) return;
    g.activa = false;
    clearInterval(g.reloj);
    clearTimeout(avisoTimer);
    $('overlay').hidden = true;
    liberarPantalla();

    var orden = g.jugadores.slice().sort(function (a, b) { return (b.ok - a.ok) || (a.bad - b.bad) || (a.used - b.used); });
    var a = orden[0], b = orden[1];
    var empate = b && a.ok === b.ok && a.bad === b.bad && Math.abs(a.used - b.used) < 1;
    $('tituloFinal').textContent = empate ? 'Empate' : '¡Ganó ' + a.name + '!';
    $('subFinal').textContent = a.ok + ' de ' + N + ' aciertos';

    var podio = $('podio');
    podio.textContent = '';
    orden.forEach(function (p, i) {
      var li = el('li', i === 0 && !empate ? 'primero' : '');
      li.appendChild(el('span', 'pos', (i + 1) + 'º'));
      li.appendChild(el('span', 'quien', p.name));
      var pt = el('span', 'puntaje', String(p.ok));
      pt.appendChild(el('small', '', ' / ' + N));
      li.appendChild(pt);
      var minis = el('div', 'minis');
      p.qs.forEach(function (q, k) { minis.appendChild(el('span', 'mini ' + p.st[k], q.L)); });
      li.appendChild(minis);
      var sinResp = p.st.filter(function (s) { return s === 'idle' || s === 'pass'; }).length;
      li.appendChild(el('div', 'stats', p.bad + ' fallos · ' + sinResp + ' sin responder · tiempo usado ' + fmt(p.used)));
      podio.appendChild(li);
    });

    var rep = $('repaso');
    rep.textContent = '';
    var visto = {}, lista = [];
    g.jugadores.forEach(function (p) {
      p.qs.forEach(function (q, k) {
        if (p.st[k] === 'ok') return;
        var id = q.L + q.ans;
        if (visto[id]) return;
        visto[id] = 1;
        lista.push(q);
      });
    });
    lista.slice(0, 40).forEach(function (q) {
      var li = el('li');
      li.appendChild(el('span', 'l', q.L));
      var t = el('span', '', q.ans);
      t.appendChild(el('small', '', q.clue));
      li.appendChild(t);
      rep.appendChild(li);
    });
    if (lista.length > 40) rep.appendChild(el('li', '', '… y ' + (lista.length - 40) + ' más'));
    $('repasoBox').hidden = !rep.children.length;
    mostrar('final');
  }

  /* ---------- Pantalla ---------- */
  function pedirPantallaActiva() {
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); } catch (e) {}
  }
  function liberarPantalla() {
    try { if (lock) { lock.release(); lock = null; } } catch (e) {}
  }

  /* ---------- Conexiones ---------- */
  $('btnEmpezar').addEventListener('click', function () {
    if (!N) {
      $('avisoOlvidar').textContent = 'No se cargaron las preguntas: falta subir la carpeta "preguntas" junto a index.html.';
      return;
    }
    var nombres = [];
    for (var i = 0; i < cfg.n; i++) nombres.push(((cfg.names[i] || '').trim()) || NOMBRES_BASE[i]);
    iniciarPartida(nombres);
  });
  $('btnVer').addEventListener('click', ver);
  $('btnPasa').addEventListener('click', pasar);
  $('btnPasa2').addEventListener('click', pasar);
  $('btnOk').addEventListener('click', function () { veredicto(true); });
  $('btnMal').addEventListener('click', function () { veredicto(false); });
  $('btnPausa').addEventListener('click', pausar);
  $('btnTerminar').addEventListener('click', function () {
    if (window.confirm('¿Terminar la partida ahora?')) terminarPartida();
  });
  $('btnPantalla').addEventListener('click', function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) {}
  });
  $('btnRevancha').addEventListener('click', function () { iniciarPartida(g.nombres); });
  $('btnNueva').addEventListener('click', function () { mostrar('inicio'); });

  document.addEventListener('keydown', function (e) {
    if (!g || !g.activa || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (g.aviso) { if ((k === 'enter' || k === ' ') && !$('ovBtn').hidden) { e.preventDefault(); cerrarAviso(); } return; }
    if (k === 'escape') { pausar(); return; }
    if (esAnfitrion()) {
      if (k === 'a' || k === '1') veredicto(true);
      else if (k === 'f' || k === '2') veredicto(false);
      else if (k === 'p') pasar();
    } else if (!g.revelada) {
      if (k === ' ' || k === 'enter') { e.preventDefault(); ver(); }
      else if (k === 'p') pasar();
    } else {
      if (k === 'a' || k === '1') veredicto(true);
      else if (k === 'f' || k === '2') veredicto(false);
    }
  });

  /* ---------- Inicio ---------- */
  var total = 0;
  ORDEN.forEach(function (L) { total += BANCO[L].length; });
  $('infoBanco').textContent = total + ' preguntas · ' + N + ' letras · para jugar en familia o con amigos';
  construirRing();
  pintarAjustes();
})();