/* Oficios · catálogo agrupado (RF-03). Al tocar un oficio abre Explorar ya filtrado. */
window.FF = window.FF || {};
FF.views = FF.views || {};

FF.views.oficios = {
  title: "Oficios · Frameflow",

  render: function () {
    var esc = FF.ui.esc;
    var own = FF.store.own();
    var count = {};
    FF.data.providers.concat(own ? [own] : []).forEach(function (p) { p.oficios.forEach(function (id) { count[id] = (count[id] || 0) + 1; }); });

    var groups = FF.data.groups.map(function (g) {
      var tiles = FF.data.oficios.filter(function (o) { return o.grupo === g.id; }).map(function (o) {
        var n = count[o.id] || 0;
        return '<a class="oficio-tile" href="#/explorar?of=' + o.id + '"><span class="tile-ic" aria-hidden="true">' + o.ic + '</span>' +
          '<span class="tile-name">' + esc(o.nombre) + '</span><span class="tile-count">' + n + (n === 1 ? " prestador" : " prestadores") + '</span></a>';
      }).join("");
      return '<section class="section" aria-labelledby="og-' + g.id + '"><div class="section-head"><h2 id="og-' + g.id + '">' + esc(g.nombre) + '</h2>' +
        '<a href="#/explorar?cat=' + g.id + '">Ver todo el grupo</a></div><div class="tiles">' + tiles + '</div></section>';
    }).join("");

    return '<section class="view"><div class="container">' +
      '<h1 tabindex="-1">Oficios</h1>' +
      '<p class="lead">Encuentra a la persona indicada por oficio. Toca uno para ver quiénes lo ofrecen en Quito.</p>' + groups +
    '</div></section>';
  },
  mount: function () {}
};
