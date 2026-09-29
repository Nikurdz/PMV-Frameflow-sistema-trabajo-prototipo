/* Explorar · listado de prestadores con búsqueda, filtros y orden (RF-20, RF-21, RF-22, RF-23). Visión MVP: demostrativo. */
window.FF = window.FF || {};
FF.views = FF.views || {};

(function () {
  var ui = FF.ui, esc = ui.esc;

  var MIN_OPTS = [{ v: 0, l: "Todas" }, { v: 3, l: "3 ★ o más" }, { v: 4, l: "4 ★ o más" }, { v: 4.5, l: "4,5 ★ o más" }];
  var SORTS = [{ v: "rating", l: "Mejor calificación" }, { v: "trabajos", l: "Más opiniones" }, { v: "nombre", l: "Nombre (A–Z)" }];
  var PAGE = FF.config.PAGE_SIZE;
  var MODS = [{ v: "", l: "Cualquiera" }, { v: "domicilio", l: "A domicilio" }, { v: "local", l: "En su local" }];

  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  /* Variantes de una palabra: "plomeros" ≈ "plomero", "peluquera" ≈ "peluquer" */
  function stems(t) {
    var out = [t];
    if (t.length > 3 && /s$/.test(t)) out.push(t.slice(0, -1));
    var last = out[out.length - 1];
    if (last.length > 4 && /[ao]$/.test(last)) out.push(last.slice(0, -1));
    return out;
  }

  function haystack(p) {
    return norm([p.nombre, FF.data.oficiosNombres(p).join(" "), p.servicios.join(" "), FF.data.zonaLargo(p.zona)].join(" "));
  }

  function all() {
    var list = FF.data.providers.slice(), own = FF.store.own();
    if (own) list.unshift(own);
    return list;
  }

  function filter(f) {
    var tokens = norm(f.q).split(/\s+/).filter(Boolean);
    var list = all().filter(function (p) {
      if (f.cat && !p.oficios.some(function (id) { var o = FF.data.oficio(id); return o && o.grupo === f.cat; })) return false;
      if (f.of && p.oficios.indexOf(f.of) < 0) return false;
      if (f.zona && p.zona !== f.zona) return false;
      if (f.mod && p.modalidad.indexOf(f.mod) < 0) return false;
      if (f.min && (FF.reviews.rating(p) || 0) < f.min) return false;
      if (f.foto && !(p.fotos > 0)) return false;
      if (tokens.length) {
        var h = haystack(p);
        return tokens.every(function (t) { return stems(t).some(function (s) { return h.indexOf(s) >= 0; }); });
      }
      return true;
    });
    list.sort(function (a, b) {
      if (a.own !== b.own) return a.own ? -1 : 1;             // tu perfil siempre primero
      if (f.orden === "nombre") return a.nombre.localeCompare(b.nombre, "es");
      var ra = FF.reviews.rating(a) || 0, rb = FF.reviews.rating(b) || 0, ca = FF.reviews.count(a), cb = FF.reviews.count(b);
      if (f.orden === "trabajos") return (cb - ca) || (rb - ra);
      return (rb - ra) || (cb - ca);
    });
    return list;
  }

  function parse(q) {
    var d = FF.store.defaultFilters();
    if (q.q) d.q = q.q;
    if (q.cat && FF.data.groups.some(function (g) { return g.id === q.cat; })) d.cat = q.cat;
    if (q.of && FF.data.oficio(q.of)) d.of = q.of;
    if (q.zona && FF.data.zona(q.zona)) d.zona = q.zona;
    if (q.mod === "domicilio" || q.mod === "local") d.mod = q.mod;
    if (q.min && MIN_OPTS.some(function (m) { return String(m.v) === q.min; })) d.min = parseFloat(q.min);
    if (q.foto === "1") d.foto = true;
    if (q.orden && SORTS.some(function (s) { return s.v === q.orden; })) d.orden = q.orden;
    if (/^\d+$/.test(q.pag || "") && +q.pag > 1) d.pag = +q.pag;
    return d;
  }

  function serialize(f) {
    var d = FF.store.defaultFilters(), p = new URLSearchParams();
    ["q", "cat", "of", "zona", "mod", "min", "orden"].forEach(function (k) { if (f[k] && f[k] !== d[k]) p.set(k, f[k]); });
    if (f.foto) p.set("foto", "1");
    if (f.pag > 1) p.set("pag", f.pag);
    var s = p.toString();
    return "#/explorar" + (s ? "?" + s : "");
  }

  function activeList(f) {
    var a = [];
    if (f.cat) a.push({ k: "cat", l: FF.data.groups.filter(function (g) { return g.id === f.cat; })[0].nombre });
    if (f.of) a.push({ k: "of", l: FF.data.oficio(f.of).nombre });
    if (f.zona) a.push({ k: "zona", l: FF.data.zona(f.zona).largo });
    if (f.mod) a.push({ k: "mod", l: f.mod === "domicilio" ? "A domicilio" : "En su local" });
    if (f.min) a.push({ k: "min", l: MIN_OPTS.filter(function (m) { return m.v === f.min; })[0].l });
    if (f.foto) a.push({ k: "foto", l: "Con fotos de trabajos" });
    return a;
  }

  function radio(key, v, label, cur) {
    return '<button type="button" class="chip" role="radio" aria-checked="' + (String(cur) === String(v)) + '" data-f="' + key + '" data-v="' + esc(v) + '">' + esc(label) + '</button>';
  }

  function ofOptions(cat, cur) {
    var list = FF.data.oficios.filter(function (o) { return !cat || o.grupo === cat; });
    return '<option value="">Todos los oficios</option>' + list.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === cur ? " selected" : "") + '>' + esc(o.nombre) + '</option>';
    }).join("");
  }

  function panel(f) {
    return '<aside class="filters" id="filters" aria-label="Filtros de búsqueda">' +
      '<div class="filters-head"><h2>Filtros</h2><button type="button" class="iconbtn" id="f-close" aria-label="Cerrar filtros">' + ui.icon("close") + '</button></div>' +
      '<div class="fgroup"><h3 id="fg-cat">Categoría</h3><div class="chips" role="radiogroup" aria-labelledby="fg-cat">' +
        radio("cat", "", "Todas", f.cat) + FF.data.groups.map(function (g) { return radio("cat", g.id, g.nombre, f.cat); }).join("") + '</div></div>' +
      '<div class="fgroup field"><label for="f-of">Oficio</label><select class="input" id="f-of">' + ofOptions(f.cat, f.of) + '</select></div>' +
      '<div class="fgroup"><h3 id="fg-zona">Zona de Quito</h3><div class="chips" role="radiogroup" aria-labelledby="fg-zona">' +
        radio("zona", "", "Todas", f.zona) + FF.data.zonas.map(function (z) { return radio("zona", z.id, z.nombre, f.zona); }).join("") + '</div></div>' +
      '<div class="fgroup"><h3 id="fg-mod">Modalidad</h3><div class="chips" role="radiogroup" aria-labelledby="fg-mod">' +
        MODS.map(function (m) { return radio("mod", m.v, m.l, f.mod); }).join("") + '</div></div>' +
      '<div class="fgroup"><h3 id="fg-min">Calificación mínima</h3><div class="chips" role="radiogroup" aria-labelledby="fg-min">' +
        MIN_OPTS.map(function (m) { return radio("min", m.v, m.l, f.min); }).join("") + '</div></div>' +
      '<div class="fgroup"><button type="button" class="chip" aria-pressed="' + f.foto + '" data-f="foto">Solo con fotos de trabajos</button></div>' +
      '<div class="filters-foot"><button type="button" class="btn btn-secondary" id="f-clear">Limpiar filtros</button>' +
        '<button type="button" class="btn btn-primary" id="f-apply">Ver resultados</button></div>' +
    '</aside>';
  }

  /* Nunca se dibujan más de PAGE_SIZE (20) prestadores a la vez */
  function pageOf(list, f) {
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    f.pag = Math.min(Math.max(1, f.pag), pages);
    return { items: list.slice((f.pag - 1) * PAGE, f.pag * PAGE), pages: pages };
  }

  function pagerHtml(f, pages) {
    if (pages < 2) return "";
    return '<nav class="pager" aria-label="Páginas de resultados">' +
      '<button type="button" class="btn btn-secondary" data-page="prev"' + (f.pag <= 1 ? " disabled" : "") + '>Anterior</button>' +
      '<span class="pager-info" aria-current="page">Página ' + f.pag + ' de ' + pages + '</span>' +
      '<button type="button" class="btn btn-secondary" data-page="next"' + (f.pag >= pages ? " disabled" : "") + '>Siguiente</button></nav>';
  }

  function countText(f, total, shown) {
    var zona = f.zona ? " en " + FF.data.zona(f.zona).largo : " en Quito";
    if (total > shown.length) {
      var from = (f.pag - 1) * PAGE + 1;
      return "Mostrando " + from + "–" + (from + shown.length - 1) + " de " + total + " prestadores" + zona;
    }
    return total + (total === 1 ? " prestador" : " prestadores") + zona;
  }

  function resultsHtml(list) {
    if (!list.length) {
      return '<div class="card empty"><span class="empty-ic" aria-hidden="true">' + ui.icon("search", "icon-xl") + '</span>' +
        '<h2>No encontramos prestadores con esos filtros</h2>' +
        '<p class="muted">Prueba con otra zona, otro oficio o quita algún filtro.</p>' +
        '<button type="button" class="btn btn-primary" data-clear>Limpiar filtros</button></div>';
    }
    var out = "";
    list.forEach(function (p, i) {
      out += ui.resultCard(p);
      if (i === 3 && list.length > 4) {   // RN-07: la publicidad va marcada y no cambia el orden orgánico
        out += '<aside class="card ad" aria-label="Publicidad"><span class="tag tag-gray">Publicidad</span>' +
          '<h3>Ferretería El Constructor</h3><p class="muted">10% de descuento en materiales para tus trabajos. Anuncio de ejemplo.</p></aside>';
      }
    });
    return out;
  }

  FF.views.explorar = {
    title: "Explorar prestadores · Frameflow",

    render: function (route) {
      var f = FF.state.filters = parse(route.query);
      var list = filter(f), pg = pageOf(list, f);
      return '<section class="view explorar"><div class="container">' +
        '<div class="page-head"><h1 tabindex="-1">Explorar prestadores</h1>' +
        '<span class="tag tag-warn">Datos de ejemplo</span></div>' +
        '<div class="searchbar">' + ui.icon("search") +
          '<label for="f-q" class="sr-only">Buscar por nombre, oficio o servicio</label>' +
          '<input class="input" id="f-q" type="search" placeholder="Busca un oficio, servicio o nombre" autocomplete="off" value="' + esc(f.q) + '"></div>' +
        '<div class="toolbar">' +
          '<button type="button" class="btn btn-secondary btn-sm" id="f-open" aria-controls="filters">' + ui.icon("sliders", "icon-sm") + ' Filtros <span class="badge" id="f-badge" hidden></span></button>' +
          '<div class="sort"><label for="f-sort" class="label-sm">Ordenar</label>' +
            '<select class="input" id="f-sort">' + SORTS.map(function (s) { return '<option value="' + s.v + '"' + (s.v === f.orden ? " selected" : "") + '>' + s.l + '</option>'; }).join("") + '</select></div>' +
        '</div>' +
        '<div class="explorar-grid">' + panel(f) + '<div class="filters-backdrop" id="f-backdrop"></div>' +
          '<div class="explorar-main"><div class="chips active-chips" id="f-active"></div>' +
            '<p class="count on-bg" id="f-count" role="status" aria-live="polite">' + countText(f, list.length, pg.items) + '</p>' +
            '<div class="results-grid" id="results">' + resultsHtml(pg.items) + '</div>' +
            '<div id="f-pager">' + pagerHtml(f, pg.pages) + '</div></div>' +
        '</div></div></section>';
    },

    mount: function (root) {
      var f = FF.state.filters;
      var $ = function (s) { return root.querySelector(s); };
      var panelEl = $("#filters"), backdrop = $("#f-backdrop");

      function openPanel() { panelEl.classList.add("open"); backdrop.classList.add("open"); document.body.classList.add("no-scroll"); $("#f-close").focus(); }
      function closePanel() { panelEl.classList.remove("open"); backdrop.classList.remove("open"); document.body.classList.remove("no-scroll"); }

      function syncControls() {
        root.querySelectorAll("[data-f]").forEach(function (b) {
          var k = b.getAttribute("data-f"), v = b.getAttribute("data-v");
          if (k === "foto") b.setAttribute("aria-pressed", String(f.foto));
          else b.setAttribute("aria-checked", String(String(f[k]) === v));
        });
        $("#f-of").innerHTML = ofOptions(f.cat, f.of);
        $("#f-sort").value = f.orden;
      }

      function update() {
        var list = filter(f), act = activeList(f), pg = pageOf(list, f);
        $("#results").innerHTML = resultsHtml(pg.items);
        $("#f-pager").innerHTML = pagerHtml(f, pg.pages);
        var n = list.length;
        $("#f-count").textContent = countText(f, n, pg.items);
        $("#f-active").innerHTML = act.map(function (a) {
          return '<button type="button" class="chip chip-removable" data-rm="' + a.k + '" aria-label="Quitar filtro: ' + esc(a.l) + '">' + esc(a.l) + ' ' + ui.icon("close", "icon-sm") + '</button>';
        }).join("");
        var badge = $("#f-badge"); badge.hidden = !act.length; badge.textContent = act.length;
        $("#f-apply").textContent = "Ver " + n + (n === 1 ? " resultado" : " resultados");
        var hash = serialize(f);
        FF.state.lastExplorar = hash;
        history.replaceState(null, "", location.pathname + location.search + hash);
        FF.rendered = location.hash;
        syncControls();
      }

      function clear() {
        var d = FF.store.defaultFilters(); d.orden = f.orden;   // solo se conserva el orden elegido
        Object.keys(d).forEach(function (k) { f[k] = d[k]; });
        $("#f-q").value = "";
        update();
      }

      $("#f-q").addEventListener("input", function (e) { f.q = e.target.value; f.pag = 1; update(); });
      $("#f-sort").addEventListener("change", function (e) { f.orden = e.target.value; f.pag = 1; update(); });
      $("#f-of").addEventListener("change", function (e) { f.of = e.target.value; f.pag = 1; update(); });
      $("#f-open").addEventListener("click", openPanel);
      $("#f-close").addEventListener("click", closePanel);
      $("#f-apply").addEventListener("click", closePanel);
      backdrop.addEventListener("click", closePanel);
      $("#f-clear").addEventListener("click", clear);
      root.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

      root.addEventListener("click", function (e) {
        var pgBtn = e.target.closest("[data-page]");
        if (pgBtn) {
          f.pag += pgBtn.getAttribute("data-page") === "next" ? 1 : -1;
          update();
          $("#f-count").scrollIntoView({ block: "start" });
          return;
        }
        var b = e.target.closest("[data-f]");
        if (b) {
          f.pag = 1;
          var k = b.getAttribute("data-f"), v = b.getAttribute("data-v");
          if (k === "foto") f.foto = !f.foto;
          else if (k === "min") f.min = parseFloat(v);
          else {
            f[k] = v;
            if (k === "cat" && f.of && v && FF.data.oficio(f.of).grupo !== v) f.of = "";   // el oficio debe pertenecer a la categoría
          }
          update(); return;
        }
        var rm = e.target.closest("[data-rm]");
        if (rm) { f.pag = 1; var key = rm.getAttribute("data-rm"); f[key] = key === "foto" ? false : key === "min" ? 0 : ""; update(); return; }
        if (e.target.closest("[data-clear]")) clear();
      });

      update();
    },

    unmount: function () { document.body.classList.remove("no-scroll"); }
  };
})();
