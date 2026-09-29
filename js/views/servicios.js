/* Pantalla 6 · Mis servicios: servicios por subtema, modalidad y fotos de trabajos (RF-12, RF-14, RF-15) */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.servicios = {
  title: "Mis servicios · Frameflow",
  needsProfile: true,

  render: function () {
    var esc = FF.ui.esc, st = FF.state, p = st.profile;
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

    var slots = [0, 1, 2].map(function (i) {
      var url = st.fotos[i];
      return '<div class="slot" data-slot="' + i + '">' +
        (url
          ? '<img src="' + esc(url) + '" alt="Foto de trabajo ' + (i + 1) + '"><button type="button" class="slot-x" data-remove="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">' + FF.ui.icon("close", "icon-sm") + '</button>'
          : '<button type="button" class="slot-add" data-add="' + i + '" aria-label="Agregar foto ' + (i + 1) + '">' + FF.ui.icon("plus") + '<span>Foto</span></button>') +
        '</div>';
    }).join("");

    return '<section class="view narrow step">' +
      '<div class="stepbar"><a class="iconbtn" href="#/publicado" aria-label="Volver">' + FF.ui.icon("back") + '</a>' +
        '<div class="stepmeta"><p class="step-label">Mis servicios</p></div></div>' +
      '<h1 tabindex="-1">¿Qué servicios ofreces?</h1>' +
      '<p class="lead">Es opcional. Toca los que hagas. Puedes cambiarlo cuando quieras.</p>' +
      '<form id="form" novalidate>' + groups +
        '<div class="group"><h2 class="group-title">Fotos de tus trabajos</h2>' +
          '<p class="muted small">Opcional. Sube fotos de trabajos tuyos (hasta 3 en este prototipo).</p>' +
          '<div class="slots">' + slots + '</div>' +
          '<input type="file" accept="image/*" id="file" class="sr-only" tabindex="-1" aria-hidden="true"></div>' +
        '<p class="free-note">' + FF.ui.icon("check", "icon-sm") + ' <span><strong>Es gratis.</strong> Mostrar tus servicios no tiene costo.</span></p>' +
        '<div class="cta-bar"><button class="btn btn-primary btn-block" type="submit">Guardar servicios</button></div></form>' +
    '</section>';
  },

  mount: function (root) {
    var st = FF.state, form = root.querySelector("#form"), file = root.querySelector("#file"), target = 0;

    form.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-serv]");
      if (chip) {
        var name = chip.getAttribute("data-serv"), i = st.servicios.indexOf(name);
        if (i >= 0) st.servicios.splice(i, 1); else st.servicios.push(name);
        chip.setAttribute("aria-pressed", String(i < 0));
        return;
      }
      var add = e.target.closest("[data-add]");
      if (add) { target = +add.getAttribute("data-add"); file.click(); return; }
      var rm = e.target.closest("[data-remove]");
      if (rm) {
        var k = +rm.getAttribute("data-remove");
        if (st.fotos[k]) URL.revokeObjectURL(st.fotos[k]);
        st.fotos[k] = null;
        FF.views.servicios.paintSlot(root, k);
      }
    });

    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (f && /^image\//.test(f.type)) {
        if (st.fotos[target]) URL.revokeObjectURL(st.fotos[target]);
        st.fotos[target] = URL.createObjectURL(f);   // vista previa local: no se sube a ningún servidor
        FF.views.servicios.paintSlot(root, target);
      }
      file.value = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      FF.store.saveServicios();
      location.hash = "#/vista";
    });
  },

  paintSlot: function (root, i) {
    var url = FF.state.fotos[i], slot = root.querySelector('[data-slot="' + i + '"]');
    slot.innerHTML = url
      ? '<img src="' + FF.ui.esc(url) + '" alt="Foto de trabajo ' + (i + 1) + '"><button type="button" class="slot-x" data-remove="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">' + FF.ui.icon("close", "icon-sm") + '</button>'
      : '<button type="button" class="slot-add" data-add="' + i + '" aria-label="Agregar foto ' + (i + 1) + '">' + FF.ui.icon("plus") + '<span>Foto</span></button>';
  }
};
