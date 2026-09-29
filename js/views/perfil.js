/* Pantalla 7 · Vista del cliente, detalle de un prestador (RF-18, RF-19, RF-24) y "Mi perfil" */
window.FF = window.FF || {};
FF.views = FF.views || {};

(function () {
  var ui = FF.ui, esc = ui.esc;

  function gallery(p) {
    var first = FF.data.primerNombre(p.nombre);
    var tiles = "";
    if (p.own && p.fotoUrls && p.fotoUrls.length) {
      tiles = p.fotoUrls.map(function (u, i) { return '<div class="ph has-img"><img src="' + esc(u) + '" alt="Trabajo ' + (i + 1) + ' de ' + esc(first) + '"></div>'; }).join("");
    } else {
      var n = p.own ? 3 : p.fotos;
      for (var i = 0; i < n; i++) tiles += ui.photoTile(p, i);
    }
    if (!tiles) return '<p class="muted">Este perfil todavía no tiene fotos de trabajos.</p>';
    return '<div class="gallery">' + tiles + '</div>';
  }

  function body(p, cta) {
    var of = FF.data.oficioNombre(p);
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
        '<div class="card"><h2>Servicios</h2>' + servs + '</div>' +
        '<div class="card"><h2>Trabajos de ' + esc(FF.data.primerNombre(p.nombre)) + '</h2>' + gallery(p) + '</div>' +
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
    mount: function () {}
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
      var hasServ = p.servicios.length || p.modalidad.length;
      return '<section class="view narrow">' +
        '<h1 tabindex="-1">Mi perfil</h1>' +
        ui.profileCard(p, '<p><span class="tag tag-ok">Publicado</span></p>') +
        '<div class="card"><h2>Resumen</h2>' +
          '<p class="meta-line">' + ui.icon("chat", "icon-sm") + esc(p.whatsapp) + '</p>' +
          '<p class="meta-line">' + ui.icon("home", "icon-sm") + esc(FF.data.modalidadTexto(p.modalidad)) + '</p>' +
          '<p class="meta-line">' + ui.icon("check", "icon-sm") + (p.servicios.length ? p.servicios.length + " servicios" : "Sin servicios todavía") + '</p>' +
          '<p class="meta-line">' + ui.icon("image", "icon-sm") + (p.fotoUrls.length ? p.fotoUrls.length + " fotos" : "Sin fotos todavía") + '</p></div>' +
        '<div class="cta-stack">' +
          '<a class="btn btn-primary btn-block" href="#/vista">Ver cómo lo ve un cliente</a>' +
          '<a class="btn btn-secondary btn-block" href="#/servicios">' + (hasServ ? "Editar mis servicios y fotos" : "Agregar mis servicios") + '</a>' +
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
})();
