/* Pantalla 5 · Perfil publicado (RF-07, RF-08) */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.publicado = {
  title: "¡Perfil publicado! · Frameflow",
  needsProfile: true,

  render: function () {
    var ui = FF.ui, p = FF.store.own();
    return '<section class="view narrow success">' +
      '<div class="success-icon" aria-hidden="true">' + ui.icon("check", "icon-xl") + '</div>' +
      '<h1 tabindex="-1">¡Tu perfil ya está publicado!</h1>' +
      '<p class="lead">Los clientes ya pueden verte. Sin esperas y sin costo.</p>' +
      ui.profileCard(p, '<p><span class="tag tag-ok">Publicado</span></p>') +
      '<div class="card card-blue"><h2>Suma tus servicios y fotos</h2>' +
        '<p>Un perfil con servicios y fotos de tus trabajos genera más confianza. Es opcional y también es gratis.</p></div>' +
      '<div class="cta-stack">' +
        '<a class="btn btn-primary btn-block" href="#/servicios">Agregar mis servicios</a>' +
        '<a class="btn btn-secondary btn-block" href="#/vista">Omitir por ahora</a>' +
      '</div></section>';
  },
  mount: function () {}
};
