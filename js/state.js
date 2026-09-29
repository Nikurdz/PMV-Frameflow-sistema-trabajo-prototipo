/* Frameflow · Estado de la aplicación.
   El perfil creado se guarda en el navegador (localStorage) solo en el modo de presentación.
   En modo prueba (?pmv=1) cada carga empieza limpia: varias personas pueden usar el mismo celular. */
window.FF = window.FF || {};

(function () {
  var KEY = "frameflow.perfil.v1";

  function emptyReg() { return { oficio: "", oficioOtro: "", nombre: "", zona: "", whatsapp: "" }; }
  function defaultFilters() { return { q: "", cat: "", of: "", zona: "", mod: "", min: 0, foto: false, orden: "rating" }; }

  var state = {
    reg: emptyReg(),
    servicios: [],          // nombres de servicios elegidos (incluye "A domicilio" / "En mi local")
    fotos: [null, null, null], // URLs locales de las fotos elegidas (solo en memoria)
    profile: null,          // perfil publicado
    filters: defaultFilters(),
    lastProvider: null,     // último prestador visto (para el mensaje de la pantalla de cierre)
    lastExplorar: ""
  };

  function safeGet() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeSet(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* sin almacenamiento */ } }
  function safeDel() { try { window.localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ } }

  function persist() {
    if (FF.mode.pmv || !state.profile) return;
    safeSet(JSON.stringify({ profile: state.profile, servicios: state.servicios }));
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
          state.profile = d.profile;
          state.servicios = Array.isArray(d.servicios) ? d.servicios : [];
          state.reg = { oficio: d.profile.oficio, oficioOtro: d.profile.oficioLabel || "", nombre: d.profile.nombre, zona: d.profile.zona, whatsapp: d.profile.whatsapp };
        }
      } catch (e) { safeDel(); }
    },

    publish: function () {
      var r = state.reg;
      state.profile = {
        oficio: r.oficio, oficioLabel: r.oficio === "otro" ? r.oficioOtro.trim() : "",
        nombre: r.nombre, zona: r.zona, whatsapp: r.whatsapp, publicadoEn: Date.now()
      };
      persist();
    },

    saveServicios: function () { persist(); },

    reset: function () {
      state.reg = emptyReg(); state.servicios = []; state.fotos = [null, null, null]; state.profile = null;
      state.filters = defaultFilters(); state.lastProvider = null;
      safeDel();
    },

    /* Perfil propio con la misma forma que un prestador de ejemplo */
    own: function () {
      var p = state.profile;
      if (!p) return null;
      var mod = [];
      if (state.servicios.indexOf("A domicilio") >= 0) mod.push("domicilio");
      if (state.servicios.indexOf("En mi local") >= 0) mod.push("local");
      var fotos = state.fotos.filter(Boolean);
      return {
        id: "yo", own: true, nombre: p.nombre, oficio: p.oficio, oficioLabel: p.oficioLabel, zona: p.zona,
        modalidad: mod,
        servicios: state.servicios.filter(function (s) { return s !== "A domicilio" && s !== "En mi local"; }),
        anios: null, rating: null, trabajos: 0, fotos: fotos.length, fotoUrls: fotos, whatsapp: p.whatsapp
      };
    }
  };
})();
