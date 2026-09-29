/* Frameflow · Router por hash. Rutas del PMV (8 pantallas) y rutas demostrativas (solo modo presentación). */
window.FF = window.FF || {};

(function () {
  var V = FF.views;

  var NAV = [
    { id: "inicio", href: "#/", label: "Inicio", short: "Inicio", icon: "home" },
    { id: "explorar", href: "#/explorar", label: "Explorar", short: "Explorar", icon: "search" },
    { id: "oficios", href: "#/oficios", label: "Oficios", short: "Oficios", icon: "grid" },
    { id: "miperfil", href: "#/mi-perfil", label: "Mi perfil", short: "Mi perfil", icon: "user" },
    { id: "comofunciona", href: "#/como-funciona", label: "Cómo funciona", short: "Ayuda", icon: "info" }
  ];

  /* Rutas que pertenecen a la visión MVP (demostrativas): no existen en modo prueba PMV */
  var DEMO_ONLY = { explorar: 1, oficios: 1, "mi-perfil": 1, "como-funciona": 1, prestador: 1 };

  function parse() {
    var raw = location.hash.replace(/^#/, "") || "/";
    var i = raw.indexOf("?");
    var path = i < 0 ? raw : raw.slice(0, i);
    var qs = i < 0 ? "" : raw.slice(i + 1);
    var q = {}; new URLSearchParams(qs).forEach(function (v, k) { q[k] = v; });
    return { path: path, parts: path.split("/").filter(Boolean), query: q };
  }

  function resolve(route) {
    var name = route.parts[0] || "";
    switch (name) {
      case "": return { id: "inicio", view: V.inicio };
      case "registro": return { id: "registro", view: V.registro.pick(route), focus: true };
      case "publicado": return { id: "publicado", view: V.publicado };
      case "servicios": return { id: "servicios", view: V.servicios };
      case "vista": return { id: "vista", view: V.vista };
      case "cierre": return { id: "cierre", view: V.cierre };
      case "explorar": return { id: "explorar", view: V.explorar };
      case "oficios": return { id: "oficios", view: V.oficios };
      case "mi-perfil": return { id: "miperfil", view: V.miperfil };
      case "como-funciona": return { id: "comofunciona", view: V.comofunciona };
      case "prestador": return { id: "explorar", view: V.prestador };
      default: return null;
    }
  }

  function redirect(hash) { location.replace(location.pathname + location.search + hash); }

  /* Evita saltar pasos: cada paso exige lo del anterior */
  function stepGuard(route) {
    if (route.parts[0] !== "registro") return null;
    var r = FF.state.reg, n = route.parts[1];
    if ((n === "2" || n === "3") && !r.oficio) return "#/registro/1";
    if (n === "3" && !(FF.validate.nombre(r.nombre).ok && r.zona)) return "#/registro/2";
    return null;
  }

  function renderNav(activeId) {
    if (FF.mode.pmv) return;
    var mk = function (n) {
      return '<a class="nav-item" href="' + n.href + '"' + (n.id === activeId ? ' aria-current="page"' : "") + '>' + FF.ui.icon(n.icon) +
        '<span class="long">' + n.label + '</span><span class="short">' + n.short + '</span></a>';
    };
    var html = NAV.map(mk).join("");
    document.getElementById("desktop-nav").innerHTML = html;
    document.getElementById("bottom-nav").innerHTML = html;
  }

  var current = null, first = true;

  function render() {
    var route = parse();
    var name = route.parts[0] || "";

    if (FF.mode.pmv && DEMO_ONLY[name]) return redirect("#/");
    var hit = resolve(route);
    if (!hit) return redirect("#/");
    if (hit.view.needsProfile && !FF.state.profile) return redirect("#/");
    var back = stepGuard(route);
    if (back) return redirect(back);

    if (current && current.unmount) current.unmount();
    current = hit.view;
    FF.ui.closeSheet(true);
    document.body.classList.remove("no-scroll");

    document.body.classList.toggle("pmv", FF.mode.pmv);
    document.body.classList.toggle("focus", !!hit.focus);
    document.getElementById("site-footer").hidden = FF.mode.pmv || !!hit.focus;

    var app = document.getElementById("app");
    app.innerHTML = hit.view.render(route);
    app.classList.remove("slide"); void app.offsetWidth; app.classList.add("slide");   // desliza a la izquierda (12.5)
    document.title = hit.view.title;
    if (hit.view === V.prestador) { var h = app.querySelector("h1"); if (h) document.title = h.textContent.replace(/^Perfil de /, "") + " · Frameflow"; }

    renderNav(hit.id);
    if (hit.view.mount) hit.view.mount(app, route);

    if (name === "registro" && route.parts[1] !== "2" && route.parts[1] !== "3") FF.observer.event("start");

    window.scrollTo(0, 0);
    var h1 = app.querySelector("h1");
    if (h1 && !first) h1.focus({ preventScroll: true });
    first = false;
    FF.rendered = location.hash;   // marca que la vista de este hash ya se dibujó (la usan las pruebas)
  }

  FF.store.load();
  FF.observer.init();
  window.addEventListener("hashchange", render);
  render();
})();
