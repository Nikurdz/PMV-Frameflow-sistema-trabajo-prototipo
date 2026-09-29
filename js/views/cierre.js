/* Pantalla 8 · Cierre: compromiso concreto con enlaces reales a WhatsApp (RF-31, RF-32, RF-33) */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.cierre = {
  title: "¿Quieres probar la app real? · Frameflow",

  render: function () {
    var ui = FF.ui, cfg = FF.config, p = FF.store.own() || FF.state.lastProvider;
    var oficio = p ? FF.data.oficiosNombres(p).join(", ") : "";
    var interes = FF.waLink(cfg.WHATSAPP_EQUIPO, cfg.MSG_INTERES + oficio);
    var recomendar = FF.waLink("", cfg.MSG_RECOMENDAR + " " + FF.prototypeUrl());
    var extra = FF.mode.pmv
      ? ""
      : '<a class="btn btn-text btn-block" href="' + ui.esc(FF.state.lastExplorar || "#/explorar") + '">Ir a explorar prestadores</a>';
    return '<section class="view narrow closing">' +
      '<div class="closing-ic" aria-hidden="true">' + ui.icon("chat", "icon-xl") + '</div>' +
      '<h1 tabindex="-1">¿Quieres probar la app real?</h1>' +
      '<p class="lead">Esto es un prototipo para conocer tu opinión. La app de verdad estará lista pronto y publicar seguirá siendo gratis.</p>' +
      '<div class="card card-blue"><p><strong>Si te interesa,</strong> escríbenos por WhatsApp y te avisamos apenas esté lista. También puedes recomendarla a un colega.</p></div>' +
      '<div class="cta-stack">' +
        '<a class="btn btn-primary btn-block" id="interes" href="' + ui.esc(interes) + '" target="_blank" rel="noopener">Sí, quiero probarla</a>' +
        '<a class="btn btn-secondary btn-block" id="recomendar" href="' + ui.esc(recomendar) + '" target="_blank" rel="noopener">Recomendar a otra persona</a>' +
        extra +
        '<button type="button" class="btn btn-text btn-block" id="restart">Volver a empezar</button>' +
      '</div></section>';
  },

  mount: function (root) {
    ["#interes", "#recomendar"].forEach(function (sel) {
      root.querySelector(sel).addEventListener("click", function () { FF.observer.event("commit"); });
    });
    root.querySelector("#restart").addEventListener("click", function () {
      FF.store.reset(); location.hash = "#/";
    });
  }
};
