/* Pantalla 6 · Mis servicios: servicios por subtema, modalidad y fotos de trabajos (RF-12, RF-14, RF-15, RF-16) */
window.FF = window.FF || {};
FF.views = FF.views || {};

(function () {
  var ui = FF.ui, esc = ui.esc;

  function photosHtml() {
    var st = FF.state, max = FF.config.MAX_FOTOS;
    var tiles = st.fotos.map(function (url, i) {
      return '<div class="slot"><img src="' + esc(url) + '" alt="Foto de trabajo ' + (i + 1) + '">' +
        '<button type="button" class="slot-x" data-remove="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">' + ui.icon("close", "icon-sm") + '</button></div>';
    }).join("");
    var add = st.fotos.length < max
      ? '<div class="slot"><button type="button" class="slot-add" data-add aria-label="Agregar fotos">' + ui.icon("plus") + '<span>Foto</span></button></div>'
      : "";
    return '<p class="photo-count" role="status" aria-live="polite"><strong>' + st.fotos.length + ' de ' + max + '</strong> fotos</p>' +
      '<div class="slots">' + tiles + add + '</div>';
  }

  FF.views.servicios = {
    title: "Servicios y fotos · Frameflow",
    needsProfile: true,

    render: function () {
      var st = FF.state, p = st.profile;
      var catalog = FF.data.servicios[p.oficio] || FF.data.servicios.otro;

      function group(title, names) {
        var chips = names.map(function (n) {
          var on = st.servicios.indexOf(n) >= 0;
          return '<button type="button" class="chip" aria-pressed="' + on + '" data-serv="' + esc(n) + '">' + esc(n) + '</button>';
        }).join("");
        return '<div class="group"><h2 class="group-title">' + esc(title) + '</h2><div class="chips">' + chips + '</div></div>';
      }

      var groups = Object.keys(catalog).map(function (k) { return group(k, catalog[k]); }).join("") +
        group("Modalidad", FF.data.modalidades.map(function (m) { return m.nombre; }));

      return '<section class="view narrow step">' +
        '<div class="stepbar"><a class="iconbtn" href="#/publicado" aria-label="Volver">' + ui.icon("back") + '</a>' +
          '<div class="stepmeta"><p class="step-label">Servicios y fotos</p></div></div>' +
        '<h1 tabindex="-1">¿Qué servicios ofreces?</h1>' +
        '<p class="lead">Es opcional. Toca los que hagas. Puedes cambiarlo cuando quieras.</p>' +
        '<form id="form" novalidate>' + groups +
          '<div class="group"><h2 class="group-title">Fotos de tus trabajos</h2>' +
            '<p class="muted small">Opcional. Sube hasta ' + FF.config.MAX_FOTOS + ' fotos de trabajos tuyos. Puedes elegir varias a la vez.</p>' +
            '<div id="photos">' + photosHtml() + '</div>' +
            '<p class="form-error" id="photo-msg" role="alert">' + ui.icon("alert", "icon-sm") + '<span></span></p>' +
            '<input type="file" accept="image/*" multiple id="file" class="sr-only" tabindex="-1" aria-hidden="true"></div>' +
          '<p class="free-note">' + ui.icon("check", "icon-sm") + ' <span><strong>Es gratis.</strong> Mostrar tus servicios no tiene costo.</span></p>' +
          '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Guardar servicios</button></div></form>' +
      '</section>';
    },

    mount: function (root) {
      var st = FF.state, form = root.querySelector("#form"), file = root.querySelector("#file");
      var msg = root.querySelector("#photo-msg");
      function say(t) { msg.querySelector("span").textContent = t; msg.classList.toggle("show", !!t); }
      function repaint() { root.querySelector("#photos").innerHTML = photosHtml(); }

      form.addEventListener("click", function (e) {
        var chip = e.target.closest("[data-serv]");
        if (chip) {
          var name = chip.getAttribute("data-serv"), i = st.servicios.indexOf(name);
          if (i >= 0) st.servicios.splice(i, 1); else st.servicios.push(name);
          chip.setAttribute("aria-pressed", String(i < 0));
          return;
        }
        if (e.target.closest("[data-add]")) { say(""); file.click(); return; }
        var rm = e.target.closest("[data-remove]");
        if (rm) { FF.store.removeFoto(+rm.getAttribute("data-remove")); say(""); repaint(); }
      });

      file.addEventListener("change", function () {
        var files = file.files;
        FF.store.addFotos(files).then(function (r) {
          var notes = [];
          if (r.skipped > 0) notes.push("Solo caben " + FF.config.MAX_FOTOS + " fotos. Se omitieron " + r.skipped + ".");
          if (!r.saved) notes.push("Las fotos se ven ahora, pero este navegador no pudo guardarlas para la próxima vez.");
          say(notes.join(" "));
          repaint();
        });
        file.value = "";
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        FF.store.saveServicios();
        location.hash = "#/vista";
      });
    }
  };
})();
