/* Frameflow · Opiniones y calificación de 5 estrellas (visión MVP, demostrativo).
   Cada prestador de ejemplo trae 2 opiniones de muestra; las que escribe la persona se guardan en el navegador.
   La calificación mostrada combina la de muestra (con el peso de sus trabajos) y las opiniones nuevas. */
window.FF = window.FF || {};

(function () {
  var KEY = "frameflow.opiniones.v1";
  var mine = {};   // { idPrestador: [{ autor, estrellas, trabajo, texto, ts }] }

  var SEED = {
    construccion: [["Lucía R.", 5, "Llegó puntual, explicó bien el trabajo y dejó todo limpio. Lo recomiendo.", "hace 2 semanas"],
                   ["Carlos T.", 4, "Buen trabajo y precio justo. Se demoró un poco más de lo acordado.", "hace 1 mes"]],
    belleza: [["Daniela M.", 5, "Quedé feliz con el resultado. Muy amable y cuidadosa en todo momento.", "hace 1 semana"],
              ["Andrea P.", 5, "Excelente atención, volveré a agendar con ella.", "hace 3 semanas"]],
    deporte: [["Mateo S.", 5, "Rutinas a mi medida y buen seguimiento. Noté cambios en pocas semanas.", "hace 2 semanas"],
              ["Valeria C.", 4, "Muy motivador y puntual. Las sesiones se pasan rápido.", "hace 1 mes"]],
    otros: [["Patricia L.", 5, "Muy responsable y de confianza. Cumplió con todo lo acordado.", "hace 1 semana"],
            ["Jorge V.", 4, "Buen servicio y buena comunicación por WhatsApp.", "hace 2 meses"]]
  };

  function load() {
    if (FF.mode.pmv) return;
    try { var r = localStorage.getItem(KEY); if (r) mine = JSON.parse(r) || {}; } catch (e) { mine = {}; }
  }
  function save() {
    if (FF.mode.pmv) return;
    try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) { /* sin almacenamiento */ }
  }
  load();

  function seedFor(p) {
    if (p.own) return [];
    var o = FF.data.oficio(p.oficio), g = o ? o.grupo : "otros";
    return SEED[g].map(function (r, i) {
      return { autor: r[0], estrellas: r[1], trabajo: p.servicios[i % p.servicios.length] || FF.data.oficioNombre(p), texto: r[2], fecha: r[3] };
    });
  }

  function fmt(ts) { try { return new Date(ts).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }

  FF.reviews = {
    /* Opiniones nuevas primero, luego las de muestra */
    list: function (p) {
      var own = (mine[p.id] || []).slice().reverse().map(function (r) {
        return { autor: r.autor, estrellas: r.estrellas, trabajo: r.trabajo, texto: r.texto, fecha: fmt(r.ts), nueva: true };
      });
      return own.concat(seedFor(p));
    },
    newCount: function (p) { return (mine[p.id] || []).length; },
    /* Promedio: calificación de muestra ponderada por sus trabajos + opiniones nuevas. null si no hay ninguna. */
    rating: function (p) {
      var extra = mine[p.id] || [], base = p.rating == null ? 0 : p.rating, w = p.rating == null ? 0 : (p.trabajos || 0);
      var n = w + extra.length; if (!n) return null;
      var sum = base * w; extra.forEach(function (r) { sum += r.estrellas; });
      return sum / n;
    },
    count: function (p) { return (p.rating == null ? 0 : (p.trabajos || 0)) + (mine[p.id] || []).length; },
    add: function (id, r) {
      (mine[id] = mine[id] || []).push({ autor: r.autor, estrellas: r.estrellas, trabajo: r.trabajo, texto: r.texto, ts: Date.now() });
      save();
    },
    clear: function (id) { delete mine[id]; save(); },

    validate: function (v) {
      var e = {};
      if (!(v.estrellas >= 1 && v.estrellas <= 5)) e.estrellas = "Elige de 1 a 5 estrellas.";
      if (String(v.autor || "").trim().length < 2) e.autor = "Escribe tu nombre.";
      if (String(v.trabajo || "").trim().length < 3) e.trabajo = "Cuéntanos qué trabajo realizó.";
      var t = String(v.texto || "").trim();
      if (t.length < 10) e.texto = "Escribe un comentario de al menos 10 letras.";
      else if (t.length > FF.config.MAX_COMENTARIO) e.texto = "El comentario es muy largo. Usa máximo " + FF.config.MAX_COMENTARIO + " letras.";
      return e;
    }
  };
})();
