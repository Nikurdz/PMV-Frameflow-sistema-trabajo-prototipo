/* Pantallas 2, 3 y 4 · Registro en 3 pasos: oficio, nombre y zona, WhatsApp (RF-02 a RF-08) */
window.FF = window.FF || {};
FF.views = FF.views || {};

(function () {
  var TOTAL = 3;

  function stepBar(n, backHref) {
    var pct = Math.round((n / TOTAL) * 1000) / 10;
    return '<div class="stepbar">' +
      '<a class="iconbtn" href="' + backHref + '" aria-label="Volver al paso anterior">' + FF.ui.icon("back") + '</a>' +
      '<div class="stepmeta"><p class="step-label">Paso ' + n + ' de ' + TOTAL + '</p>' +
      '<div class="progress" role="progressbar" aria-label="Avance del registro" aria-valuemin="0" aria-valuemax="' + TOTAL + '" aria-valuenow="' + n + '"><span style="width:' + pct + '%"></span></div></div>' +
    '</div>';
  }

  var errorLine = FF.ui.errorLine, setFieldError = FF.ui.setFieldError, radioChip = FF.ui.radioChip, bindRadios = FF.ui.bindRadios;

  var views = {
    paso1: {
      title: "Paso 1 de 3 · Elige tus oficios · Frameflow",
      render: function () {
        var r = FF.state.reg;
        return '<section class="view narrow step" data-step="1">' + stepBar(1, "#/") +
          '<h1 tabindex="-1">¿A qué te dedicas?</h1>' +
          '<p class="lead">Elige hasta ' + FF.config.MAX_OFICIOS + ' oficios. Los clientes te encontrarán por cualquiera de ellos.</p>' +
          '<form id="form" novalidate>' + FF.ui.oficioPicker(r.oficios, r.oficioOtro) +
          '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Continuar</button></div></form></section>';
      },
      mount: function (root) {
        var r = FF.state.reg, form = root.querySelector("#form");
        var picker = FF.ui.bindOficioPicker(root, r);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (!r.oficios.length) { picker.say("Elige al menos un oficio para continuar."); return; }
          location.hash = "#/registro/2";
        });
      }
    },

    paso2: {
      title: "Paso 2 de 3 · Tus datos · Frameflow",
      render: function () {
        var r = FF.state.reg, esc = FF.ui.esc;
        var zonas = FF.data.zonas.map(function (z) { return radioChip(z.id, z.nombre, "", r.zona === z.id, "data-zona"); }).join("");
        var demo = FF.mode.pmv ? "" : '<button type="button" class="btn btn-text btn-sm" id="demo">Rellenar con datos de ejemplo</button>';
        return '<section class="view narrow step" data-step="2">' + stepBar(2, "#/registro/1") +
          '<h1 tabindex="-1">¿Cómo te llamas y dónde trabajas?</h1>' +
          '<p class="lead">Tu nombre y tu zona aparecen en tu perfil.</p>' +
          '<form id="form" novalidate>' +
            '<div class="field" id="f-nombre"><label for="nombre">Nombre completo</label>' +
              '<input class="input" id="nombre" name="nombre" autocomplete="name" maxlength="60" placeholder="Ejemplo: Camila Andrade" value="' + esc(r.nombre) + '" aria-describedby="e-nombre">' +
              errorLine("e-nombre") + '</div>' +
            '<div class="field" id="f-zona"><span class="label" id="zona-label">Zona de Quito</span>' +
              '<div class="chips" role="radiogroup" aria-labelledby="zona-label">' + zonas + '</div>' + errorLine("e-zona") + '</div>' +
            demo +
            '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Continuar</button></div></form></section>';
      },
      mount: function (root) {
        var r = FF.state.reg, form = root.querySelector("#form");
        var fN = root.querySelector("#f-nombre"), iN = root.querySelector("#nombre");
        var fZ = root.querySelector("#f-zona");
        bindRadios(form, "[data-zona]", function (b) {
          r.zona = b.getAttribute("data-zona"); fZ.classList.remove("has-error");
        });
        iN.addEventListener("input", function () { r.nombre = iN.value; if (fN.classList.contains("has-error")) setFieldError(fN, iN, ""); });
        var demo = root.querySelector("#demo");
        if (demo) demo.addEventListener("click", function () {
          r.nombre = "Camila Andrade"; r.zona = "norte"; iN.value = r.nombre;
          root.querySelectorAll("[data-zona]").forEach(function (x) { x.setAttribute("aria-checked", String(x.getAttribute("data-zona") === "norte")); });
          setFieldError(fN, iN, ""); fZ.classList.remove("has-error");
        });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var v = FF.validate.nombre(iN.value), ok = true, first = null;
          if (!v.ok) { setFieldError(fN, iN, v.error); ok = false; first = iN; } else { r.nombre = v.value; setFieldError(fN, iN, ""); }
          if (!r.zona) {
            fZ.classList.add("has-error"); fZ.querySelector(".field-error span").textContent = "Elige la zona donde trabajas."; ok = false;
            first = first || fZ.querySelector("[role=radio]");
          }
          if (!ok) { first.focus(); return; }
          location.hash = "#/registro/3";
        });
      }
    },

    paso3: {
      title: "Paso 3 de 3 · Tu WhatsApp · Frameflow",
      render: function () {
        var r = FF.state.reg, esc = FF.ui.esc;
        var demo = FF.mode.pmv ? "" : '<button type="button" class="btn btn-text btn-sm" id="demo">Rellenar con un número de ejemplo</button>';
        return '<section class="view narrow step" data-step="3">' + stepBar(3, "#/registro/2") +
          '<h1 tabindex="-1">¿A qué WhatsApp te escriben?</h1>' +
          '<p class="lead">Los clientes te contactan directo. Sin intermediarios y sin comisión.</p>' +
          '<form id="form" novalidate>' +
            '<div class="field" id="f-wa"><label for="wa">Número de WhatsApp</label>' +
              '<input class="input" id="wa" name="wa" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="09 9876 5432" value="' + esc(r.whatsapp) + '" aria-describedby="wa-hint e-wa">' +
              '<p class="field-hint" id="wa-hint">Ejemplo: 0998765432 o +593998765432</p>' + errorLine("e-wa") + '</div>' +
            '<p class="free-note big">' + FF.ui.icon("check", "icon-sm") + ' <span><strong>Es gratis.</strong> No pagas por publicar ni por volver a intentar.</span></p>' +
            '<p class="legal">Al publicar confirmas que eres mayor de 18 años y aceptas que los clientes vean tu número para escribirte.</p>' +
            demo +
            '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Publicar mi perfil</button></div></form></section>';
      },
      mount: function (root) {
        var r = FF.state.reg, form = root.querySelector("#form");
        var f = root.querySelector("#f-wa"), i = root.querySelector("#wa");
        i.addEventListener("input", function () { r.whatsapp = i.value; if (f.classList.contains("has-error")) setFieldError(f, i, ""); });
        var demo = root.querySelector("#demo");
        if (demo) demo.addEventListener("click", function () { i.value = "0998765432"; r.whatsapp = i.value; setFieldError(f, i, ""); i.focus(); });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var v = FF.validate.whatsapp(i.value);
          if (!v.ok) { setFieldError(f, i, v.error); i.focus(); return; }
          r.whatsapp = v.value;
          FF.store.publish();       // RF-07: se publica de inmediato, sin revisión previa
          FF.observer.event("published");
          location.hash = "#/publicado";
        });
      }
    }
  };

  FF.views.registro = {
    pick: function (route) {
      var n = route.parts[1];
      return n === "2" ? views.paso2 : n === "3" ? views.paso3 : views.paso1;
    }
  };
})();
