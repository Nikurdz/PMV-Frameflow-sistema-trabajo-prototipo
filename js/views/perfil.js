/* Pantalla 7 · Vista del cliente, detalle de un prestador (RF-18, RF-19, RF-24), opiniones (RF-29, demostrativo),
   "Mi perfil" y edición del perfil (RF-09) */
window.FF = window.FF || {};
FF.views = FF.views || {};

(function () {
  var ui = FF.ui, esc = ui.esc, GALLERY_FIRST = 6, REVIEWS_FIRST = 5;

  /* ---------- Galería: todas las fotos, con "Ver todas" si hay más de 6 ---------- */
  function gallery(p) {
    var first = FF.data.primerNombre(p.nombre), items = [], i;
    if (p.own && p.fotoUrls && p.fotoUrls.length) {
      items = p.fotoUrls.map(function (u, k) { return '<div class="ph has-img"><img src="' + esc(u) + '" alt="Trabajo ' + (k + 1) + ' de ' + esc(first) + '" loading="lazy"></div>'; });
    } else {
      var n = p.own ? 3 : p.fotos;
      for (i = 0; i < n; i++) items.push(ui.photoTile(p, i));
    }
    if (!items.length) return '<p class="muted">Este perfil todavía no tiene fotos de trabajos.</p>';
    var many = items.length > GALLERY_FIRST;
    return '<div class="gallery" id="gallery"' + (many ? ' data-collapsed="true"' : "") + '>' + items.join("") + '</div>' +
      (many ? '<button type="button" class="btn btn-text btn-block" id="gallery-toggle" aria-expanded="false">Ver todas (' + items.length + ')</button>' : "");
  }

  /* ---------- Opiniones y calificación de 5 estrellas ---------- */
  function reviewsHtml(p) {
    var r = FF.reviews.rating(p), n = FF.reviews.count(p), list = FF.reviews.list(p);
    var summary = r == null
      ? '<p class="muted">Todavía no hay opiniones. Puedes ser la primera persona en opinar.</p>'
      : '<div class="rv-summary"><span class="rv-avg">' + r.toFixed(1) + '</span><div>' + ui.stars(r) +
        '<p class="muted">' + n + (n === 1 ? " opinión" : " opiniones") + '</p></div></div>';
    var items = list.map(function (x, i) {
      return '<li class="review"' + (i >= REVIEWS_FIRST ? " data-extra hidden" : "") + '>' +
        '<div class="rv-head"><strong>' + esc(x.autor) + '</strong>' + (x.nueva ? ' <span class="tag tag-ok">Nueva</span>' : "") + ui.stars(x.estrellas, "stars-sm") +
        '<span class="muted small">' + esc(x.fecha) + '</span></div>' +
        '<p><span class="tag tag-blue">Trabajo: ' + esc(x.trabajo) + '</span></p>' +
        '<p>' + esc(x.texto) + '</p></li>';
    }).join("");
    return '<section class="card" id="opiniones" aria-labelledby="rv-h">' +
      '<div class="rv-top"><h2 id="rv-h">Opiniones</h2>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="add-review">Dejar una opinión</button></div>' + summary +
      (items ? '<ul class="reviews">' + items + '</ul>' : "") +
      (list.length > REVIEWS_FIRST ? '<button type="button" class="btn btn-text btn-block" id="more-reviews" aria-expanded="false">Ver más opiniones (' + (list.length - REVIEWS_FIRST) + ')</button>' : "") +
    '</section>';
  }

  function openReviewSheet(p, done) {
    var opts = p.servicios.map(function (s) { return '<option value="' + esc(s) + '">'; }).join("");
    var max = FF.config.MAX_COMENTARIO, stars = 0;
    var sheet = ui.openSheet(
      '<h2>Dejar una opinión</h2><p class="muted">Sobre ' + esc(p.nombre) + '</p>' +
      '<form id="rv-form" novalidate>' +
        '<div class="field" id="rf-estrellas"><span class="label">Tu calificación</span>' + ui.starPicker() + ui.errorLine("e-estrellas") + '</div>' +
        '<div class="field" id="rf-autor"><label for="rv-autor">Tu nombre</label>' +
          '<input class="input" id="rv-autor" maxlength="40" autocomplete="name" placeholder="Ejemplo: Marcos">' + ui.errorLine("e-autor") + '</div>' +
        '<div class="field" id="rf-trabajo"><label for="rv-trabajo">¿Qué trabajo realizó?</label>' +
          '<input class="input" id="rv-trabajo" maxlength="80" list="rv-dl" autocomplete="off" placeholder="Ejemplo: ' + esc(p.servicios[0] || "Reparación en casa") + '">' +
          '<datalist id="rv-dl">' + opts + '</datalist>' + ui.errorLine("e-trabajo") + '</div>' +
        '<div class="field" id="rf-texto"><label for="rv-texto">Tu comentario</label>' +
          '<textarea class="input" id="rv-texto" rows="4" maxlength="' + max + '" placeholder="Cuenta cómo te fue con el trabajo"></textarea>' +
          '<p class="field-hint" id="rv-count">0 de ' + max + '</p>' + ui.errorLine("e-texto") + '</div>' +
        '<div class="sheet-actions"><button type="submit" class="btn btn-primary">Enviar opinión</button>' +
          '<button type="button" class="btn btn-text" data-sheet-close="btn">Cancelar</button></div>' +
      '</form>', "Dejar una opinión");

    var form = sheet.querySelector("#rv-form"), $ = function (s) { return sheet.querySelector(s); };
    sheet.querySelector(".star-picker").addEventListener("click", function (e) {
      var b = e.target.closest("[data-star]"); if (!b) return;
      stars = +b.getAttribute("data-star");
      sheet.querySelectorAll("[data-star]").forEach(function (x) {
        var v = +x.getAttribute("data-star");
        x.setAttribute("aria-checked", String(v === stars)); x.setAttribute("data-on", String(v <= stars));
      });
      ui.setFieldError($("#rf-estrellas"), null, "");
    });
    $("#rv-texto").addEventListener("input", function (e) { $("#rv-count").textContent = e.target.value.length + " de " + max; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = { estrellas: stars, autor: $("#rv-autor").value, trabajo: $("#rv-trabajo").value, texto: $("#rv-texto").value };
      var err = FF.reviews.validate(v), first = null;
      [["estrellas", "#rf-estrellas", null], ["autor", "#rf-autor", "#rv-autor"], ["trabajo", "#rf-trabajo", "#rv-trabajo"], ["texto", "#rf-texto", "#rv-texto"]].forEach(function (f) {
        ui.setFieldError($(f[1]), f[2] ? $(f[2]) : null, err[f[0]] || "");
        if (err[f[0]] && !first) first = f[2] ? $(f[2]) : $("[data-star]");
      });
      if (first) { first.focus(); return; }
      FF.reviews.add(p.id, { autor: v.autor.trim(), estrellas: v.estrellas, trabajo: v.trabajo.trim(), texto: v.texto.trim() });
      ui.closeSheet(true);
      ui.toast("¡Gracias por tu opinión!");
      done();
    });
  }

  /* Galería y opiniones: se enlazan después de pintar la vista */
  function bindDetail(root, p) {
    var gt = root.querySelector("#gallery-toggle");
    if (gt) gt.addEventListener("click", function () {
      var g = root.querySelector("#gallery"), open = g.getAttribute("data-collapsed") !== "true";
      if (open) g.setAttribute("data-collapsed", "true"); else g.removeAttribute("data-collapsed");
      gt.setAttribute("aria-expanded", String(!open));
      gt.textContent = open ? "Ver todas (" + g.children.length + ")" : "Ver menos";
    });
    bindReviews(root, p);
  }

  function bindReviews(root, p) {
    var sec = root.querySelector("#opiniones"); if (!sec) return;
    sec.querySelector("#add-review").addEventListener("click", function () {
      openReviewSheet(p, function () {
        sec.outerHTML = reviewsHtml(p);
        var rate = root.querySelector(".profile-card .result-rate");
        if (rate) rate.innerHTML = ui.ratingHtml(p);
        bindReviews(root, p);
        var h = root.querySelector("#rv-h"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: false }); }
      });
    });
    var more = sec.querySelector("#more-reviews");
    if (more) more.addEventListener("click", function () {
      var open = more.getAttribute("aria-expanded") !== "true";
      sec.querySelectorAll("[data-extra]").forEach(function (li) { li.hidden = !open; });
      more.setAttribute("aria-expanded", String(open));
      more.textContent = open ? "Ver menos opiniones" : "Ver más opiniones (" + sec.querySelectorAll("[data-extra]").length + ")";
    });
  }

  function body(p, cta) {
    var nombres = FF.data.oficiosNombres(p);
    var oficios = '<ul class="chip-row">' + nombres.map(function (n, i) {
      return '<li class="tag ' + (i === 0 ? "tag-ok" : "tag-blue") + '">' + esc(n) + (i === 0 && nombres.length > 1 ? " · Principal" : "") + '</li>';
    }).join("") + '</ul>';
    var servs = p.servicios.length
      ? '<ul class="chip-row">' + p.servicios.map(function (s) { return '<li class="tag tag-blue">' + esc(s) + '</li>'; }).join("") + '</ul>'
      : '<p class="muted">Todavía no agregó servicios.</p>';
    var pitch = p.own ? "" : '<p class="pitch">' + esc(FF.data.pitch(p.oficio)) + ' ' + p.anios + ' años de experiencia.</p>';
    return '<div class="detail-grid">' +
      '<div class="detail-main">' +
        ui.profileCard(p, '<div class="result-rate">' + ui.ratingHtml(p) + '</div>') +
        '<div class="card"><h2>Sobre el servicio</h2>' + pitch +
          '<p class="meta-line">' + ui.icon("pin", "icon-sm") + esc(FF.data.zonaLargo(p.zona)) + '</p>' +
          '<p class="meta-line">' + ui.icon("home", "icon-sm") + esc(FF.data.modalidadTexto(p.modalidad)) + '</p></div>' +
        '<div class="card"><h2>' + (nombres.length > 1 ? "Oficios" : "Oficio") + '</h2>' + oficios + '</div>' +
        '<div class="card"><h2>Servicios</h2>' + servs + '</div>' +
        '<div class="card"><h2>Trabajos de ' + esc(FF.data.primerNombre(p.nombre)) + '</h2>' + gallery(p) + '</div>' +
        (FF.mode.pmv ? "" : reviewsHtml(p)) +
      '</div>' +
      '<aside class="detail-side"><div class="card contact-card">' +
        '<h2 class="desk-only">Contacto directo</h2>' +
        '<p class="muted desk-only">Escríbele por WhatsApp para acordar el trabajo. Sin comisiones ni intermediarios.</p>' +
        cta + '<p class="contact-note muted">Contacto directo por WhatsApp. Sin pagos ni comisión.</p></div></aside>' +
    '</div>';
  }

  /* Pantalla 7 · perfil propio visto como cliente */
  FF.views.vista = {
    title: "Vista del cliente · Frameflow",
    needsProfile: true,
    render: function () {
      var p = FF.store.own();
      return '<section class="view detail">' +
        '<div class="container"><div class="stepbar"><a class="iconbtn" href="' + (FF.mode.pmv ? "#/publicado" : "#/mi-perfil") + '" aria-label="Volver">' + ui.icon("back") + '</a>' +
        '<span class="tag tag-warn client-tag">Vista del cliente</span></div>' +
        '<h1 class="sr-only" tabindex="-1">Vista del cliente: perfil de ' + esc(p.nombre) + '</h1>' +
        body(p, '<a class="btn btn-wa btn-block" id="contact" href="#/cierre">' + ui.icon("chat") + ' Contactar por WhatsApp</a>') +
        '</div></section>';
    },
    mount: function (root) { bindDetail(root, FF.store.own()); }
  };

  /* Detalle de un prestador de la lista (modo presentación) */
  FF.views.prestador = {
    title: "Perfil · Frameflow",
    resolve: function (route) {
      var id = route.parts[1];
      if (id === "yo") return FF.store.own();
      return FF.data.providers.filter(function (p) { return p.id === id; })[0] || null;
    },
    render: function (route) {
      var p = FF.views.prestador.resolve(route);
      if (!p) {
        return '<section class="view narrow"><div class="empty card"><h1 tabindex="-1">No encontramos este perfil</h1>' +
          '<p class="muted">Puede que ya no esté disponible.</p><a class="btn btn-primary" href="#/explorar">Ver prestadores</a></div></section>';
      }
      document.title = p.nombre + " · " + FF.data.oficioNombre(p) + " · Frameflow";
      FF.state.lastProvider = p;   // la pantalla de cierre usa su oficio en el mensaje
      var cta = '<button type="button" class="btn btn-wa btn-block" id="contact">' + ui.icon("chat") + ' Contactar por WhatsApp</button>' +
        '<div class="contact-tools">' +
          '<button type="button" class="btn btn-text btn-sm" id="share">' + ui.icon("share", "icon-sm") + ' Compartir</button>' +
          (p.own ? "" : '<button type="button" class="btn btn-text btn-sm" id="report">' + ui.icon("flag", "icon-sm") + ' Reportar</button>') +
        '</div>';
      return '<section class="view detail"><div class="container">' +
        '<div class="stepbar"><a class="iconbtn" href="' + esc(FF.state.lastExplorar || "#/explorar") + '" aria-label="Volver al listado">' + ui.icon("back") + '</a>' +
        '<span class="label-sm on-bg">Perfil del prestador</span></div>' +
        '<h1 class="sr-only" tabindex="-1">Perfil de ' + esc(p.nombre) + '</h1>' +
        body(p, cta) + '</div></section>';
    },
    mount: function (root, route) {
      var p = FF.views.prestador.resolve(route); if (!p) return;
      bindDetail(root, p);
      // El contacto de cualquier prestador lleva a la pantalla de compromiso (pantalla 8)
      root.querySelector("#contact").addEventListener("click", function () { location.hash = "#/cierre"; });
      root.querySelector("#share").addEventListener("click", function () {
        ui.copy(location.href, "Enlace del perfil copiado");
      });
      var rep = root.querySelector("#report");
      if (rep) rep.addEventListener("click", function () {
        var motivos = ["Las fotos no son suyas", "Contenido inapropiado", "Parece un fraude", "Otro motivo"];
        var sheet = ui.openSheet(
          '<h2>Reportar este perfil</h2><p class="muted">Cuéntanos qué pasa. Lo revisará el equipo de Frameflow.</p>' +
          '<div class="radio-list" role="radiogroup" aria-label="Motivo del reporte">' + motivos.map(function (m, i) {
            return '<button type="button" class="chip" role="radio" aria-checked="' + (i === 0) + '" data-motivo>' + esc(m) + '</button>';
          }).join("") + '</div>' +
          '<div class="sheet-actions"><button type="button" class="btn btn-primary" data-send>Enviar reporte</button>' +
          '<button type="button" class="btn btn-text" data-sheet-close="btn">Cancelar</button></div>', "Reportar perfil");
        sheet.addEventListener("click", function (e) {
          var m = e.target.closest("[data-motivo]");
          if (m) { sheet.querySelectorAll("[data-motivo]").forEach(function (x) { x.setAttribute("aria-checked", "false"); }); m.setAttribute("aria-checked", "true"); }
          if (e.target.closest("[data-send]")) { ui.closeSheet(); ui.toast("Gracias. Revisaremos este perfil (demostración)."); }
        });
      });
    }
  };

  /* Mi perfil (menú general) */
  FF.views.miperfil = {
    title: "Mi perfil · Frameflow",
    render: function () {
      var p = FF.store.own();
      if (!p) {
        return '<section class="view narrow empty-view"><div class="card empty">' +
          '<span class="empty-ic" aria-hidden="true">' + ui.icon("user", "icon-xl") + '</span>' +
          '<h1 tabindex="-1">Aún no tienes un perfil</h1>' +
          '<p class="muted">Créalo en 3 pasos y sin costo. Los clientes te escribirán directo a tu WhatsApp.</p>' +
          '<a class="btn btn-primary btn-block" href="#/registro/1">Crear mi perfil gratis</a></div></section>';
      }
      var nombres = FF.data.oficiosNombres(p);
      var hasServ = p.servicios.length || p.modalidad.length;
      var n = FF.reviews.count(p), r = FF.reviews.rating(p);
      return '<section class="view narrow">' +
        '<h1 tabindex="-1">Mi perfil</h1>' +
        ui.profileCard(p, '<p><span class="tag tag-ok">Publicado</span></p>') +
        '<div class="card"><h2>Resumen</h2>' +
          '<p class="meta-line">' + ui.icon("grid", "icon-sm") + esc(nombres.join(", ")) + '</p>' +
          '<p class="meta-line">' + ui.icon("chat", "icon-sm") + esc(p.whatsapp) + '</p>' +
          '<p class="meta-line">' + ui.icon("home", "icon-sm") + esc(FF.data.modalidadTexto(p.modalidad)) + '</p>' +
          '<p class="meta-line">' + ui.icon("check", "icon-sm") + (p.servicios.length ? p.servicios.length + " servicios" : "Sin servicios todavía") + '</p>' +
          '<p class="meta-line">' + ui.icon("image", "icon-sm") + (p.fotoUrls.length ? p.fotoUrls.length + " de " + FF.config.MAX_FOTOS + " fotos" : "Sin fotos todavía") + '</p>' +
          '<p class="meta-line">' + ui.icon("star", "icon-sm") + (r == null ? "Sin opiniones todavía" : r.toFixed(1) + " de 5 · " + n + (n === 1 ? " opinión" : " opiniones")) + '</p></div>' +
        '<div class="cta-stack">' +
          '<a class="btn btn-primary btn-block" href="#/vista">Ver cómo lo ve un cliente</a>' +
          '<a class="btn btn-secondary btn-block" href="#/mi-perfil/editar">Editar mi perfil</a>' +
          '<a class="btn btn-secondary btn-block" href="#/servicios">' + (hasServ ? "Editar servicios y fotos" : "Agregar mis servicios") + '</a>' +
          '<button type="button" class="btn btn-text btn-block" id="reset">' + ui.icon("trash", "icon-sm") + ' Borrar mi perfil de esta demostración</button>' +
        '</div></section>';
    },
    mount: function (root) {
      var r = root.querySelector("#reset");
      if (r) r.addEventListener("click", function () {
        var sheet = ui.openSheet('<h2>¿Borrar tu perfil?</h2><p class="muted">Se elimina de este navegador. Puedes crear otro cuando quieras.</p>' +
          '<div class="sheet-actions"><button type="button" class="btn btn-primary" data-ok>Sí, borrar</button>' +
          '<button type="button" class="btn btn-text" data-sheet-close="btn">Cancelar</button></div>', "Borrar perfil");
        sheet.querySelector("[data-ok]").addEventListener("click", function () {
          ui.closeSheet(true); FF.store.reset(); ui.toast("Perfil borrado."); location.hash = "#/";
        });
      });
    }
  };

  /* Editar mi perfil (RF-09): oficios (hasta 5), nombre, zona y WhatsApp */
  var draft = null;
  FF.views.editar = {
    title: "Editar mi perfil · Frameflow",
    needsProfile: true,
    render: function () {
      var p = FF.state.profile;
      draft = { oficios: p.oficios.slice(), oficioOtro: p.oficioLabel || "", nombre: p.nombre, zona: p.zona, whatsapp: p.whatsapp };
      var zonas = FF.data.zonas.map(function (z) { return ui.radioChip(z.id, z.nombre, "", draft.zona === z.id, "data-zona"); }).join("");
      return '<section class="view narrow step">' +
        '<div class="stepbar"><a class="iconbtn" href="#/mi-perfil" aria-label="Volver a Mi perfil">' + ui.icon("back") + '</a>' +
          '<div class="stepmeta"><p class="step-label">Editar perfil</p></div></div>' +
        '<h1 tabindex="-1">Editar mi perfil</h1>' +
        '<p class="lead">Cambia tus datos cuando quieras. Se actualizan al instante y siguen siendo gratis.</p>' +
        '<form id="form" novalidate>' +
          '<h2>Tus oficios</h2>' + ui.oficioPicker(draft.oficios, draft.oficioOtro) +
          '<div class="field" id="f-nombre"><label for="nombre">Nombre completo</label>' +
            '<input class="input" id="nombre" name="nombre" autocomplete="name" maxlength="60" value="' + esc(draft.nombre) + '" aria-describedby="e-nombre">' + ui.errorLine("e-nombre") + '</div>' +
          '<div class="field" id="f-zona"><span class="label" id="zona-label">Zona de Quito</span>' +
            '<div class="chips" role="radiogroup" aria-labelledby="zona-label">' + zonas + '</div>' + ui.errorLine("e-zona") + '</div>' +
          '<div class="field" id="f-wa"><label for="wa">Número de WhatsApp</label>' +
            '<input class="input" id="wa" name="wa" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" value="' + esc(draft.whatsapp) + '" aria-describedby="wa-hint e-wa">' +
            '<p class="field-hint" id="wa-hint">Ejemplo: 0998765432 o +593998765432</p>' + ui.errorLine("e-wa") + '</div>' +
          '<a class="btn btn-secondary btn-block" href="#/servicios">Editar servicios y fotos</a>' +
          '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Guardar cambios</button></div></form></section>';
    },
    mount: function (root) {
      var form = root.querySelector("#form"), picker = ui.bindOficioPicker(root, draft);
      var fN = root.querySelector("#f-nombre"), iN = root.querySelector("#nombre");
      var fW = root.querySelector("#f-wa"), iW = root.querySelector("#wa"), fZ = root.querySelector("#f-zona");
      ui.bindRadios(form, "[data-zona]", function (b) { draft.zona = b.getAttribute("data-zona"); fZ.classList.remove("has-error"); });
      iN.addEventListener("input", function () { if (fN.classList.contains("has-error")) ui.setFieldError(fN, iN, ""); });
      iW.addEventListener("input", function () { if (fW.classList.contains("has-error")) ui.setFieldError(fW, iW, ""); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var first = null, nv = FF.validate.nombre(iN.value), wv = FF.validate.whatsapp(iW.value);
        if (!draft.oficios.length) { picker.say("Elige al menos un oficio."); first = root.querySelector("[data-oficio]"); }
        ui.setFieldError(fN, iN, nv.ok ? "" : nv.error); if (!nv.ok && !first) first = iN;
        if (!draft.zona) { fZ.classList.add("has-error"); fZ.querySelector(".field-error span").textContent = "Elige la zona donde trabajas."; first = first || fZ.querySelector("[role=radio]"); }
        ui.setFieldError(fW, iW, wv.ok ? "" : wv.error); if (!wv.ok && !first) first = iW;
        if (first) { first.focus(); return; }
        draft.nombre = nv.value; draft.whatsapp = wv.value;
        FF.store.updateProfile(draft);
        ui.toast("Cambios guardados.");
        location.hash = "#/mi-perfil";
      });
    }
  };
})();
