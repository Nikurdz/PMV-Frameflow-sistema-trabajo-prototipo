/* Pantalla 1 · Bienvenida (y página de inicio del modo presentación) */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.inicio = {
  title: "Frameflow · Publica tu oficio y consigue clientes en Quito",

  render: function () {
    var ui = FF.ui, esc = ui.esc, pmv = FF.mode.pmv;
    var has = !!FF.state.profile;
    var chips = ["manicurista", "plomero", "peluquero", "entrenador", "electricista"].map(function (id) {
      var o = FF.data.oficio(id);
      return '<li class="tag"><span aria-hidden="true">' + o.ic + '</span> ' + esc(o.nombre) + '</li>';
    }).join("");

    var cta = has && !pmv
      ? '<a class="btn btn-primary btn-block" href="#/mi-perfil">Ver mi perfil</a>'
      : '<a class="btn btn-primary btn-block" id="start" href="#/registro/1">Crear mi perfil gratis</a>';
    var second = pmv ? "" : '<a class="btn btn-secondary btn-block" href="#/explorar">Busco un trabajador</a>';

    var hero =
      '<section class="hero-copy">' +
        '<p class="brand-line"><span class="brand-mark" aria-hidden="true">F</span> Frameflow</p>' +
        '<ul class="chip-row" aria-label="Oficios de ejemplo">' + chips + '</ul>' +
        '<h1 tabindex="-1">Publica tu oficio y consigue clientes en Quito</h1>' +
        '<p class="lead">Crea tu perfil en 3 pasos. Los clientes te escriben directo a tu WhatsApp.</p>' +
        '<p class="free-note">' + ui.icon("check", "icon-sm") + ' <span><strong>Es gratis.</strong> No pagas por publicar ni por volver a intentar.</span></p>' +
        '<div class="hero-actions">' + cta + second + '</div>' +
      '</section>';

    if (pmv) return '<section class="view narrow hero">' + hero + '</section>';

    var sample = FF.data.providers.filter(function (p) { return p.id === "p13"; })[0];
    var populares = ["plomero", "electricista", "manicurista", "peluquero", "entrenador", "limpieza", "soldador", "fotografo"].map(function (id) {
      var o = FF.data.oficio(id);
      return '<a class="oficio-tile" href="#/explorar?of=' + id + '"><span class="tile-ic" aria-hidden="true">' + o.ic + '</span><span class="tile-name">' + esc(o.nombre) + '</span></a>';
    }).join("");
    var top = FF.data.providers.slice().sort(function (a, b) { return b.rating - a.rating || b.trabajos - a.trabajos; }).slice(0, 3)
      .map(ui.resultCard).join("");

    return '<div class="view home">' +
      '<div class="container hero-grid">' + hero.replace('class="hero-copy"', 'class="hero-copy card hero-card"') +
        '<aside class="hero-side" aria-label="Ejemplo de perfil publicado">' +
          '<p class="label-sm on-bg">Así se ve un perfil publicado</p>' +
          ui.profileCard(sample, '<div class="result-rate">' + ui.ratingHtml(sample) + '</div>') +
          '<div class="gallery mini">' + [0, 1, 2].map(function (i) { return ui.photoTile(sample, i); }).join("") + '</div>' +
          '<p class="on-bg label-sm">Datos de ejemplo. Los clientes ven tu perfil sin registrarse.</p>' +
        '</aside>' +
      '</div>' +
      '<div class="container section"><div class="section-head"><h2>Oficios populares</h2><a href="#/oficios">Ver todos</a></div>' +
        '<div class="tiles">' + populares + '</div></div>' +
      '<div class="container section"><h2>Así funciona</h2>' +
        '<ol class="steps3">' +
          '<li class="card"><span class="step-n">1</span><h3>Elige tu oficio</h3><p class="muted">De construcción, belleza, bienestar y más.</p></li>' +
          '<li class="card"><span class="step-n">2</span><h3>Dinos tu nombre y zona</h3><p class="muted">Norte, Centro, Sur o Valles de Quito.</p></li>' +
          '<li class="card"><span class="step-n">3</span><h3>Deja tu WhatsApp</h3><p class="muted">Se publica al instante y te escriben directo.</p></li>' +
        '</ol></div>' +
      '<div class="container section"><div class="section-head"><h2>Prestadores mejor calificados</h2><a href="#/explorar">Ver todos</a></div>' +
        '<div class="results-grid">' + top + '</div></div>' +
    '</div>';
  },

  mount: function () {}
};
