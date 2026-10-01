/* Berral · tienda v3: catálogo con filtros, vitrinas de categoría, «Apartados» y ficha.
   Sin librerías. Sin JS la página se lee entera (el HTML trae las primeras piezas). */
(function () {
  'use strict';
  var R = document.documentElement.getAttribute('data-raiz') || './';
  var WA = 'https://wa.me/34640956035?text=';
  var PASO = 48;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var FINO = ' ';
  var miles = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };  /* es-ES no agrupa 4 cifras: 1.697, 1.275 € */
  var euro = function (n) { var e = Math.floor(n), c = Math.round((n - e) * 100); return miles(e) + (c ? ',' + String(c).padStart(2, '0') : '') + FINO + '€'; };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var GEMA = '<svg viewBox="0 0 24 20" aria-hidden="true"><path d="M7 1.5h10l5 5.5L12 18.5 2 7z"/></svg>';
  var LEY = { Oro: '<span class="ley" title="Oro de ley, 750 milésimas">750</span>', Plata: '<span class="ley plata" title="Plata de ley, 925 milésimas">925</span>', Acero: '<span class="ley acero">Acero</span>' };

  /* ---------- Apartados ---------- */
  var CLAVE = 'berral-apartados';
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) {} pintarContador(); pintarCajon(); marcar(); }
  function esta(id) { return leer().some(function (x) { return x.id === id; }); }
  function alternar(p) { var l = leer(), i = l.findIndex(function (x) { return x.id === p.id; }); if (i >= 0) l.splice(i, 1); else l.push(p); guardar(l); }
  function pintarContador() { $$('[data-contador]').forEach(function (e) { e.textContent = leer().length || ''; }); }
  function marcar() {
    $$('[data-guardar]').forEach(function (b) {
      var si = esta(+b.getAttribute('data-guardar'));
      b.setAttribute('aria-pressed', si ? 'true' : 'false');
      var t = b.querySelector('[data-texto]'); if (t) t.textContent = si ? 'Guardada' : 'Guardar';
    });
  }
  function pintarCajon() {
    var ul = $('#cajon-lista'); if (!ul) return;
    var l = leer(), wa = $('#cajon-wa');
    if (!l.length) { ul.innerHTML = '<li class="vacio-c">Aún no has guardado ninguna pieza. Pulsa «Guardar» en las que te gusten y mándanos la lista para apartarlas.</li>'; $('#cajon-total').textContent = ''; wa.setAttribute('aria-disabled', 'true'); return; }
    ul.innerHTML = l.map(function (x) {
      return '<li><img src="' + R + 'img/p/' + x.id + '-t.webp" alt="" loading="lazy"><div><a href="' + R + 'producto/' + x.slug + '/">' + esc(x.n) + '</a><span>' + (x.op ? esc(x.op) + ' · ' : '') + euro(x.p) + '</span></div><button type="button" data-quitar="' + x.id + '">Quitar</button></li>';
    }).join('');
    var tot = l.reduce(function (s, x) { return s + x.p; }, 0);
    $('#cajon-total').innerHTML = '<span>' + l.length + (l.length === 1 ? ' pieza' : ' piezas') + '</span><span>' + euro(tot) + '</span>';
    var m = 'Hola, Berral. Me gustaría apartar estas piezas para pasar a verlas:\n' + l.map(function (x) {
      return '· ' + x.n + (x.ref ? ' (ref. ' + x.ref + ')' : '') + (x.op ? ', ' + x.op : '') + ' · ' + euro(x.p);
    }).join('\n') + '\n¿Cuándo puedo pasarme?';
    wa.href = WA + encodeURIComponent(m); wa.removeAttribute('aria-disabled');
  }
  var ultimoFoco = null;
  function abrirCajon(si) {
    var c = $('#cajon'), v = $('#velo'); if (!c) return;
    if (si) { ultimoFoco = document.activeElement; c.setAttribute('data-abierto', ''); v.setAttribute('data-abierto', ''); $('.cerrar', c).focus(); }
    else if (c.hasAttribute('data-abierto')) { c.removeAttribute('data-abierto'); v.removeAttribute('data-abierto'); if (ultimoFoco) ultimoFoco.focus(); }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-abrir-cajon]')) { e.preventDefault(); abrirCajon(true); return; }
    if (e.target.closest('[data-cerrar-cajon]')) { abrirCajon(false); return; }
    var q = e.target.closest('[data-quitar]'); if (q) { var id = +q.getAttribute('data-quitar'); guardar(leer().filter(function (x) { return x.id !== id; })); return; }
    var g = e.target.closest('[data-guardar]');
    if (g) { e.preventDefault(); var d = JSON.parse(g.getAttribute('data-pieza')); if (g.classList.contains('apartar-f')) d.op = opcionElegida(); alternar(d); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { abrirCajon(false); abrirFiltros(false); } });

  /* ---------- Ficha ---------- */
  function opcionElegida() {
    return $$('#opciones fieldset').map(function (f) { var c = f.querySelector('input:checked'); return c ? f.getAttribute('data-nombre') + ' ' + c.value : ''; }).filter(Boolean).join(', ');
  }
  var ficha = $('#ficha');
  if (ficha) {
    var d = JSON.parse(ficha.getAttribute('data-pieza'));
    var wa = $('#apartar');
    var actualiza = function () {
      var op = opcionElegida();
      wa.href = WA + encodeURIComponent('Hola, Berral. Me interesa esta pieza y me gustaría apartarla para verla en la tienda: ' + d.n + (d.ref ? ' (ref. ' + d.ref + ')' : '') + (op ? ', ' + op : '') + ', ' + euro(d.p) + '. ' + location.href);
    };
    $$('#opciones input').forEach(function (s) { s.addEventListener('change', actualiza); });
    actualiza();
    var vit = $('.galeria .vitrina'), img = vit && $('img', vit);
    if (img) img.addEventListener('click', function (e) {
      var r = img.getBoundingClientRect();
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
      vit.classList.toggle('lupa');
    });
    $$('.miniaturas button').forEach(function (b) {
      b.addEventListener('click', function () {
        vit.classList.remove('lupa'); img.src = b.getAttribute('data-grande');
        $$('.miniaturas button').forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
      });
    });
  }

  /* ---------- Catálogo ---------- */
  var cat = $('#catalogo');
  function abrirFiltros(si) { var f = $('#filtros'), v = $('#velo'); if (!f) return; if (si) { f.setAttribute('data-abierto', ''); v.setAttribute('data-abierto', ''); } else if (f.hasAttribute('data-abierto')) { f.removeAttribute('data-abierto'); if (!$('#cajon[data-abierto]')) v.removeAttribute('data-abierto'); } }
  if (cat) {
    var fijo = cat.getAttribute('data-cat') ? +cat.getAttribute('data-cat') : null;
    var ESTADO = { q: '', tipo: '', mat: '', oc: '', pr: '', orden: 'nuevo', n: PASO };
    var PRECIOS = [['h50', 'Hasta 50' + FINO + '€', 0, 50], ['50', 'De 50 a 150' + FINO + '€', 50, 150], ['150', 'De 150 a 400' + FINO + '€', 150, 400], ['400', 'Más de 400' + FINO + '€', 400, 1e9]];
    var VITRINAS = [
      { cat: 57, n: 'Compromiso', img: 'img/comp-rosa.webp', ruta: 'fabricacion-en-oro/anillos-de-compromiso-oro' },
      { cat: 22, n: 'Relojería', img: 'img/rel-verde.webp', ruta: 'relojeria' },
      { cat: 28, n: 'Comunión', img: 'img/com-cruz.webp', ruta: 'regalos-para-comuniones' }
    ];
    var todo = [], completo = [];
    try { var u = new URLSearchParams(location.search); ['q', 'tipo', 'mat', 'oc', 'pr', 'orden'].forEach(function (k) { if (u.get(k)) ESTADO[k] = u.get(k); }); } catch (e) {}

    fetch(R + 'tienda/catalogo.json').then(function (r) { return r.json(); }).then(function (j) {
      completo = j.map(function (a) { return { id: a[0], slug: a[1], n: a[2], tipo: a[3], mat: a[4], oc: a[5], p: a[6], pM: a[7], ref: a[8], cats: a[9], foto: a[10], orden: a[11], dup: a[12], b: norm(a[2] + ' ' + a[8] + ' ' + a[3] + ' ' + a[4]) }; });
      todo = fijo ? completo.filter(function (x) { return x.cats.indexOf(fijo) >= 0; }) : completo;
      $('#buscar').value = ESTADO.q;
      pintar(true);
    });

    var pasa = function (x, sin) {
      if (ESTADO.q && sin !== 'q') { var ws = norm(ESTADO.q).split(/\s+/); for (var i = 0; i < ws.length; i++) if (x.b.indexOf(ws[i]) < 0) return false; }
      if (ESTADO.tipo && sin !== 'tipo' && x.tipo !== ESTADO.tipo) return false;
      if (ESTADO.mat && sin !== 'mat' && x.mat !== ESTADO.mat) return false;
      if (ESTADO.oc && sin !== 'oc' && x.oc.indexOf(ESTADO.oc) < 0) return false;
      if (ESTADO.pr && sin !== 'pr') { var r = PRECIOS.filter(function (p) { return p[0] === ESTADO.pr; })[0]; if (r && !(x.p >= r[2] && x.p < r[3])) return false; }
      return true;
    };
    function cuenta(campo, val, fn) { return todo.filter(function (x) { return pasa(x, campo) && fn(x, val); }).length; }
    function grupo(id, titulo, valores, campo, fn, etiqueta) {
      var html = valores.map(function (v) {
        var n = cuenta(campo, v, fn); if (!n && ESTADO[campo] !== v) return '';
        return '<button type="button" class="opcion" data-campo="' + campo + '" data-valor="' + esc(v) + '" aria-pressed="' + (ESTADO[campo] === v) + '">' + (etiqueta ? etiqueta(v) : '<span class="txt">' + esc(v) + '</span>') + '<small>' + n + '</small></button>';
      }).join('');
      $(id).innerHTML = html ? '<h2>' + titulo + '</h2>' + (campo === 'mat' ? '<div class="leyes">' + html + '</div>' : html) : '';
    }
    function pintarFiltros() {
      grupo('#f-tipo', 'Qué buscas', ['Anillos', 'Alianzas', 'Pendientes', 'Pulseras', 'Colgantes y cadenas', 'Relojes', 'Broches y gemelos', 'Conjuntos', 'Regalo'], 'tipo', function (x, v) { return x.tipo === v; });
      grupo('#f-mat', 'Metal', ['Oro', 'Plata', 'Acero'], 'mat', function (x, v) { return x.mat === v; }, function (v) { return LEY[v] + '<span class="txt">' + v + '</span>'; });
      grupo('#f-oc', 'Para', ['Compromiso y boda', 'Comunión', 'Para él', 'Niños', 'Personalizadas'], 'oc', function (x, v) { return x.oc.indexOf(v) >= 0; });
      grupo('#f-pr', 'Precio', PRECIOS.map(function (p) { return p[0]; }), 'pr', function (x, v) { var r = PRECIOS.filter(function (p) { return p[0] === v; })[0]; return x.p >= r[2] && x.p < r[3]; }, function (v) { return '<span class="txt">' + PRECIOS.filter(function (p) { return p[0] === v; })[0][1] + '</span>'; });
      $('#f-borrar').hidden = !(ESTADO.q || ESTADO.tipo || ESTADO.mat || ESTADO.oc || ESTADO.pr);
    }
    function tarjeta(x) {
      var pieza = JSON.stringify({ id: x.id, slug: x.slug, n: x.n, p: x.p, ref: x.ref });
      var precio = !x.p ? 'Consultar' : (x.pM > x.p ? '<small>desde</small>' + euro(x.p) : euro(x.p));
      return '<li class="pz' + (x.foto ? ' foto' : '') + '"><a href="' + R + 'producto/' + x.slug + '/"><figure><img src="' + R + 'img/p/' + x.id + '-t.webp" width="360" height="360" loading="lazy" alt=""></figure>' +
        '<span class="nom">' + esc(x.n) + '</span>' + (x.dup && x.ref ? '<span class="ref">Ref. ' + esc(x.ref) + '</span>' : '') + '</a>' +
        '<div class="pie"><span class="pre">' + precio + '</span><button type="button" class="apartar" data-guardar="' + x.id + '" data-pieza="' + esc(pieza) + '" aria-pressed="' + esta(x.id) + '" aria-label="Guardar ' + esc(x.n) + '">' + GEMA + '<span data-texto>' + (esta(x.id) ? 'Guardada' : 'Guardar') + '</span></button></div></li>';
    }
    function vitrinaCat(v) {
      var xs = completo.filter(function (x) { return x.cats.indexOf(v.cat) >= 0 && x.p; });
      if (!xs.length) return '';
      var min = Math.min.apply(null, xs.map(function (x) { return x.p; }));
      return '<li class="pz vitrina-cat"><a href="' + R + 'categoria-producto/' + v.ruta + '/"><figure><img src="' + R + v.img + '" alt="" loading="lazy"></figure>' +
        '<div><b>' + v.n + '</b><span>' + xs.length + ' piezas, desde ' + euro(min) + '</span><em>Ver la vitrina</em></div></a></li>';
    }
    function pintar(reinicia) {
      if (reinicia) ESTADO.n = PASO;
      var lista = todo.filter(function (x) { return pasa(x); });
      var o = ESTADO.orden;
      lista.sort(o === 'barato' ? function (a, b) { return (a.p || 1e9) - (b.p || 1e9); } : o === 'caro' ? function (a, b) { return b.p - a.p; } : function (a, b) { return a.orden - b.orden; });
      $('#num-res').textContent = lista.length === 1 ? '1 pieza' : miles(lista.length) + ' piezas';
      var html = lista.slice(0, ESTADO.n).map(tarjeta);
      var limpio = !(ESTADO.q || ESTADO.tipo || ESTADO.mat || ESTADO.oc || ESTADO.pr) && o === 'nuevo' && !fijo;
      if (limpio) { [[6, 0], [19, 1], [34, 2]].forEach(function (p) { if (html.length > p[0]) html.splice(p[0], 0, vitrinaCat(VITRINAS[p[1]])); }); }
      $('#rejilla').innerHTML = html.join('') || '<li class="vacio">No hay piezas con esos filtros. Prueba a quitar alguno, o <a class="enlace" href="' + WA + encodeURIComponent('Hola, Berral. Busco ') + '">pregúntanos por WhatsApp</a>: lo que no está en la web, a veces está en la tienda.</li>';
      $('#ver-mas').hidden = lista.length <= ESTADO.n;
      $('#orden').value = o;
      pintarFiltros();
      try {
        var u = new URLSearchParams(); ['q', 'tipo', 'mat', 'oc', 'pr'].forEach(function (k) { if (ESTADO[k]) u.set(k, ESTADO[k]); }); if (o !== 'nuevo') u.set('orden', o);
        history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      } catch (e) {}
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.opcion[data-campo]'); if (!b) return;
      var c = b.getAttribute('data-campo'), v = b.getAttribute('data-valor');
      ESTADO[c] = ESTADO[c] === v ? '' : v; pintar(true);
    });
    $('#f-borrar').addEventListener('click', function () { ESTADO.q = ESTADO.tipo = ESTADO.mat = ESTADO.oc = ESTADO.pr = ''; $('#buscar').value = ''; pintar(true); });
    var t; $('#buscar').addEventListener('input', function (e) { clearTimeout(t); t = setTimeout(function () { ESTADO.q = e.target.value.trim(); pintar(true); }, 180); });
    $('#orden').addEventListener('change', function (e) { ESTADO.orden = e.target.value; pintar(true); });
    $('#ver-mas').addEventListener('click', function () { ESTADO.n += PASO; pintar(false); });
    $$('[data-abrir-filtros]').forEach(function (b) { b.addEventListener('click', function () { abrirFiltros(true); }); });
    $$('[data-cerrar-filtros]').forEach(function (b) { b.addEventListener('click', function () { abrirFiltros(false); }); });
  }
  var velo = $('#velo'); if (velo) velo.addEventListener('click', function () { abrirFiltros(false); abrirCajon(false); });

  pintarContador(); pintarCajon(); marcar();
})();
