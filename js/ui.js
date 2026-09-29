/* Frameflow · Utilidades de interfaz compartidas */
window.FF = window.FF || {};

(function () {
  var ICON_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  function svg(path, cls) { return '<svg class="' + (cls || "icon") + '" ' + ICON_ATTR + '>' + path + '</svg>'; }

  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.3A8.5 8.5 0 1 1 21 12z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
  };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var lastOpener = null;
  var toastTimer = null;

  FF.ui = {
    esc: esc,
    icon: function (name, cls) { return svg(ICONS[name] || "", cls); },

    initials: function (nombre) {
      var parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return "?";
      return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    },

    hue: function (seed) {
      var h = 0, s = String(seed);
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
      return h;
    },

    avatar: function (nombre, cls) {
      return '<span class="avatar ' + (cls || "") + '" style="--h:' + FF.ui.hue(nombre) + '" aria-hidden="true">' + esc(FF.ui.initials(nombre)) + '</span>';
    },

    /* Tarjeta/Perfil (sec. 12.6): nombre, oficio y zona */
    profileCard: function (p, extra) {
      var of = FF.data.oficioNombre(p);
      return '<div class="card profile-card">' + FF.ui.avatar(p.nombre, "avatar-lg") +
        '<div class="who"><h2>' + esc(p.nombre) + '</h2>' +
        '<p>' + esc(of) + ' · ' + esc(FF.data.zonaLargo(p.zona)) + '</p>' + (extra || "") + '</div></div>';
    },

    ratingHtml: function (p) {
      if (p.rating == null) return '<span class="tag tag-blue">Nuevo en Frameflow</span>';
      return '<span class="rating"><span class="star">' + FF.ui.icon("star", "icon-sm") + '</span><strong>' + p.rating.toFixed(1) + '</strong>' +
        '<span class="muted"> · ' + p.trabajos + ' trabajos</span></span>';
    },

    /* Cuadro de reemplazo para foto de trabajo (sin imágenes de IA, RN-05) */
    photoTile: function (p, i, label) {
      var o = FF.data.oficio(p.oficio) || { ic: "📷" };
      var h = FF.ui.hue(p.nombre + i);
      return '<div class="ph" style="--h:' + h + '" role="img" aria-label="' + esc(label || "Foto de trabajo de ejemplo") + '">' +
        '<span class="ph-ic" aria-hidden="true">' + o.ic + '</span><span class="ph-lb">' + esc(label ? "" : "Foto de ejemplo") + '</span></div>';
    },

    /* Tarjeta de resultado (RF-22) */
    resultCard: function (p) {
      var of = FF.data.oficioNombre(p);
      return '<a class="card result" href="#/prestador/' + esc(p.id) + '" aria-label="Ver perfil de ' + esc(p.nombre) + ', ' + esc(of) + '">' +
        FF.ui.avatar(p.nombre) +
        '<div class="result-main">' +
          '<h3>' + esc(p.nombre) + (p.own ? ' <span class="tag tag-ok">Tú</span>' : '') + '</h3>' +
          '<p class="muted">' + esc(of) + '</p>' +
          '<p class="result-meta muted">' + FF.ui.icon("pin", "icon-sm") + esc(FF.data.zonaLargo(p.zona)) + '</p>' +
          '<p class="result-meta muted">' + esc(FF.data.modalidadTexto(p.modalidad)) + '</p>' +
          '<div class="result-rate">' + FF.ui.ratingHtml(p) + '</div>' +
        '</div>' +
        '<span class="result-go" aria-hidden="true">' + FF.ui.icon("arrow") + '</span>' +
      '</a>';
    },

    toast: function (msg) {
      var el = document.getElementById("toast");
      el.textContent = msg; el.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
    },

    copy: function (text, okMsg) {
      function done() { FF.ui.toast(okMsg); }
      function fallback() {
        var t = document.createElement("textarea");
        t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
        document.body.removeChild(t); done();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    },

    /* Hoja modal accesible. Devuelve el elemento .sheet */
    openSheet: function (html, label) {
      FF.ui.closeSheet(true);
      lastOpener = document.activeElement;
      var root = document.getElementById("sheet-root");
      root.innerHTML = '<div class="sheet-backdrop" data-sheet-close="backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(label) + '" tabindex="-1">' + html + '</div></div>';
      document.body.classList.add("no-scroll");
      var sheet = root.querySelector(".sheet");
      root.querySelector(".sheet-backdrop").addEventListener("click", function (e) {
        if (e.target === e.currentTarget || e.target.closest("[data-sheet-close='btn']")) FF.ui.closeSheet();
      });
      sheet.addEventListener("click", function (e) { if (e.target.closest("[data-sheet-close='btn']")) FF.ui.closeSheet(); });
      var first = sheet.querySelector("button, a, input");
      (first || sheet).focus();
      return sheet;
    },

    closeSheet: function (silent) {
      var root = document.getElementById("sheet-root");
      if (!root.firstChild) return;
      root.innerHTML = "";
      document.body.classList.remove("no-scroll");
      if (!silent && lastOpener && document.contains(lastOpener)) lastOpener.focus();
    },

    /* Mensaje predeterminado de contacto (RF-24): incluye oficio y nombre */
    contactMessage: function (p) {
      return "Hola " + FF.data.primerNombre(p.nombre) + ", vi tu perfil de " + FF.data.oficioNombre(p).toLowerCase() +
        " en Frameflow y quisiera contratar tus servicios.";
    }
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") FF.ui.closeSheet();
  });
})();
