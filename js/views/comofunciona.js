/* Cómo funciona · propuesta de valor (sec. 2.4 del levantamiento) */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.comofunciona = {
  title: "Cómo funciona · Frameflow",

  render: function () {
    var ui = FF.ui;
    var pares = [
      ["Registro largo", "Registro en 3 pasos o menos."],
      ["Pagar para publicarse o reintentar", "Publicar es gratis, sin cobros por reintentar."],
      ["Espera de revisión", "Tu perfil se publica al instante."],
      ["Sin filtro por ciudad", "Perfiles por oficio y zona de Quito."],
      ["Contacto con intermediarios", "Contacto directo por WhatsApp, sin comisión."],
      ["Sin forma de mostrar el trabajo", "Servicios y fotos de tus trabajos en tu perfil."]
    ].map(function (p) {
      return '<li class="card pair"><p class="pair-old"><span class="label-sm on-bg">Antes</span><br>' + ui.esc(p[0]) + '</p>' +
        '<p class="pair-new"><span class="label-sm">Con Frameflow</span><br><strong>' + ui.esc(p[1]) + '</strong></p></li>';
    }).join("");

    var faq = [
      ["¿Cuesta algo publicar mi perfil?", "No. Registrarte, publicar y reintentar es siempre gratis para ti."],
      ["¿Cómo me contactan los clientes?", "Directo a tu WhatsApp, con un mensaje que ya incluye tu oficio y tu nombre. No cobramos comisión."],
      ["¿Necesito una cuenta para ver perfiles?", "No. Cualquier cliente puede ver los perfiles sin registrarse."],
      ["¿Quién puede registrarse?", "Trabajadores independientes mayores de 18 años que ofrezcan sus servicios en Quito."]
    ].map(function (q) {
      return '<details class="card faq"><summary>' + ui.esc(q[0]) + '</summary><p class="muted">' + ui.esc(q[1]) + '</p></details>';
    }).join("");

    return '<section class="view"><div class="container">' +
      '<h1 tabindex="-1">Cómo funciona Frameflow</h1>' +
      '<p class="lead">Una forma simple y gratuita de conseguir clientes nuevos en Quito con tu oficio.</p>' +
      '<ol class="steps3">' +
        '<li class="card"><span class="step-n">1</span><h2>Crea tu perfil</h2><p class="muted">Oficio, nombre y zona, y tu WhatsApp. Tres pasos y listo.</p></li>' +
        '<li class="card"><span class="step-n">2</span><h2>Muestra tu trabajo</h2><p class="muted">Suma servicios y fotos para que los clientes confíen en ti.</p></li>' +
        '<li class="card"><span class="step-n">3</span><h2>Recibe clientes</h2><p class="muted">Te escriben directo por WhatsApp. Tú decides el precio y la fecha.</p></li>' +
      '</ol>' +
      '<section class="section"><h2>Pensado para tu realidad</h2><ul class="pairs">' + pares + '</ul></section>' +
      '<section class="section"><h2>Preguntas frecuentes</h2><div class="faqs">' + faq + '</div></section>' +
      '<div class="cta-inline"><a class="btn btn-primary" href="#/registro/1">Crear mi perfil gratis</a>' +
      '<a class="btn btn-secondary" href="#/explorar">Busco un trabajador</a></div>' +
    '</div></section>';
  },
  mount: function () {}
};
