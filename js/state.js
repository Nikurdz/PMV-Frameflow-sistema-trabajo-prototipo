/* Frameflow · Estado de la aplicación.
   El perfil creado (con sus servicios y fotos) se guarda en el navegador (localStorage) solo en el modo de presentación.
   En modo prueba (?pmv=1) cada carga empieza limpia: varias personas pueden usar el mismo celular. */
window.FF = window.FF || {};

(function () {
  var KEY = "frameflow.perfil.v1";

  function emptyReg() { return { oficios: [], oficioOtro: "", nombre: "", zona: "", whatsapp: "" }; }
  function defaultFilters() { return { q: "", cat: "", of: "", zona: "", mod: "", min: 0, foto: false, orden: "rating", pag: 1 }; }

  var state = {
    reg: emptyReg(),
    servicios: [],          // nombres de servicios elegidos (incluye "A domicilio" / "En mi local")
    fotos: [],              // fotos de trabajos comprimidas (data URL), hasta FF.config.MAX_FOTOS
    profile: null,          // perfil publicado
    filters: defaultFilters(),
    lastProvider: null,     // último prestador visto (para el mensaje de la pantalla de cierre)
    lastExplorar: ""
  };

  function safeGet() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeDel() { try { window.localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ } }

  /* Devuelve false si el navegador no pudo guardar (por ejemplo, cuota llena por las fotos) */
  function persist() {
    if (FF.mode.pmv || !state.profile) return true;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ profile: state.profile, servicios: state.servicios, fotos: state.fotos }));
      return true;
    } catch (e) { return false; }
  }

  /* Reduce la foto antes de guardarla (RF-16, RNF-07): lado mayor 900 px, JPEG */
  function compress(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 900 / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function profileFrom(r, publicadoEn) {
    var oficios = r.oficios.slice(0, FF.config.MAX_OFICIOS);
    return {
      oficios: oficios, oficio: oficios[0], oficioLabel: oficios.indexOf("otro") >= 0 ? String(r.oficioOtro || "").trim() : "",
      nombre: r.nombre, zona: r.zona, whatsapp: r.whatsapp, publicadoEn: publicadoEn || Date.now()
    };
  }

  FF.state = state;
  FF.store = {
    emptyReg: emptyReg,
    defaultFilters: defaultFilters,

    load: function () {
      if (FF.mode.pmv) return;
      var raw = safeGet();
      if (!raw) return;
      try {
        var d = JSON.parse(raw);
        if (d && d.profile && d.profile.nombre) {
          var p = d.profile;
          if (!p.oficios || !p.oficios.length) p.oficios = [p.oficio];     // perfiles guardados antes de admitir varios oficios
          state.profile = p;
          state.servicios = Array.isArray(d.servicios) ? d.servicios : [];
          state.fotos = Array.isArray(d.fotos) ? d.fotos.filter(function (u) { return typeof u === "string"; }) : [];
          state.reg = { oficios: p.oficios.slice(), oficioOtro: p.oficioLabel || "", nombre: p.nombre, zona: p.zona, whatsapp: p.whatsapp };
        }
      } catch (e) { safeDel(); }
    },

    publish: function () {
      state.profile = profileFrom(state.reg);
      persist();
    },

    /* Editar perfil (RF-09): mismos campos que el registro */
    updateProfile: function (d) {
      if (!state.profile) return;
      state.profile = profileFrom(d, state.profile.publicadoEn);
      state.reg = { oficios: state.profile.oficios.slice(), oficioOtro: state.profile.oficioLabel, nombre: d.nombre, zona: d.zona, whatsapp: d.whatsapp };
      persist();
    },

    saveServicios: function () { return persist(); },

    /* Comprime y agrega fotos hasta el tope. Devuelve { added, skipped, saved } */
    addFotos: function (files) {
      var room = FF.config.MAX_FOTOS - state.fotos.length, list = Array.prototype.slice.call(files || []).filter(function (f) { return /^image\//.test(f.type); });
      var take = list.slice(0, Math.max(0, room));
      return Promise.all(take.map(compress)).then(function (urls) {
        var ok = urls.filter(Boolean);
        state.fotos = state.fotos.concat(ok);
        return { added: ok.length, skipped: list.length - take.length, saved: persist() };
      });
    },
    removeFoto: function (i) { state.fotos.splice(i, 1); return persist(); },

    reset: function () {
      state.reg = emptyReg(); state.servicios = []; state.fotos = []; state.profile = null;
      state.filters = defaultFilters(); state.lastProvider = null;
      FF.reviews.clear("yo");
      safeDel();
    },

    /* Perfil propio con la misma forma que un prestador de ejemplo */
    own: function () {
      var p = state.profile;
      if (!p) return null;
      var mod = [];
      if (state.servicios.indexOf("A domicilio") >= 0) mod.push("domicilio");
      if (state.servicios.indexOf("En mi local") >= 0) mod.push("local");
      return {
        id: "yo", own: true, nombre: p.nombre, oficio: p.oficio, oficios: p.oficios.slice(), oficioLabel: p.oficioLabel, zona: p.zona,
        modalidad: mod,
        servicios: state.servicios.filter(function (s) { return s !== "A domicilio" && s !== "En mi local"; }),
        anios: null, rating: null, trabajos: 0, fotos: state.fotos.length, fotoUrls: state.fotos.slice(), whatsapp: p.whatsapp
      };
    }
  };
})();
