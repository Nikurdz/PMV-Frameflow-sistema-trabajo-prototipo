/* Frameflow · Catálogos y datos de ejemplo.
   Todos los prestadores son ficticios y genéricos: los teléfonos no existen en este archivo a propósito,
   para que el prototipo nunca escriba a una persona real. Las fotos son cuadros de reemplazo (sin imágenes de IA). */
window.FF = window.FF || {};

(function () {
  var GROUPS = [
    { id: "construccion", nombre: "Construcción y mantenimiento" },
    { id: "belleza", nombre: "Belleza y cuidado personal" },
    { id: "deporte", nombre: "Deporte y bienestar" },
    { id: "otros", nombre: "Otros servicios" }
  ];

  /* 17 oficios en 4 grupos (RF-03, pantalla 2) */
  var OFICIOS = [
    { id: "plomero", nombre: "Plomero", grupo: "construccion", ic: "🔧" },
    { id: "soldador", nombre: "Soldador", grupo: "construccion", ic: "🔥" },
    { id: "albanil", nombre: "Albañil", grupo: "construccion", ic: "🧱" },
    { id: "electricista", nombre: "Electricista", grupo: "construccion", ic: "⚡" },
    { id: "pintor", nombre: "Pintor", grupo: "construccion", ic: "🎨" },
    { id: "carpintero", nombre: "Carpintero", grupo: "construccion", ic: "🪚" },
    { id: "manicurista", nombre: "Manicurista", grupo: "belleza", ic: "💅" },
    { id: "peluquero", nombre: "Peluquero/a", grupo: "belleza", ic: "✂️" },
    { id: "barbero", nombre: "Barbero", grupo: "belleza", ic: "💈" },
    { id: "maquillador", nombre: "Maquillador/a", grupo: "belleza", ic: "💄" },
    { id: "masajista", nombre: "Masajista", grupo: "belleza", ic: "💆" },
    { id: "entrenador", nombre: "Entrenador/a personal", grupo: "deporte", ic: "🏋️" },
    { id: "yoga", nombre: "Instructor/a de yoga", grupo: "deporte", ic: "🧘" },
    { id: "fotografo", nombre: "Fotógrafo/a", grupo: "otros", ic: "📷" },
    { id: "cuidador", nombre: "Cuidador/a", grupo: "otros", ic: "🤝" },
    { id: "limpieza", nombre: "Limpieza del hogar", grupo: "otros", ic: "🧹" },
    { id: "otro", nombre: "Otro", grupo: "otros", ic: "➕" }
  ];

  var ZONAS = [
    { id: "norte", nombre: "Norte", largo: "Norte de Quito" },
    { id: "centro", nombre: "Centro", largo: "Centro de Quito" },
    { id: "sur", nombre: "Sur", largo: "Sur de Quito" },
    { id: "valles", nombre: "Valles", largo: "Valles de Quito" }
  ];

  var MODALIDADES = [
    { id: "domicilio", nombre: "A domicilio", en: "A domicilio" },
    { id: "local", nombre: "En mi local", en: "En su local" }
  ];

  /* Catálogo de servicios por oficio, agrupado por subtemas (RF-12). El de manicurista es el del documento;
     el resto es una propuesta corta que el administrador podrá editar (RF-13). "Modalidad" se agrega aparte. */
  var SERVICIOS = {
    plomero: { "Reparaciones": ["Reparación de fugas", "Destape de cañerías", "Cambio de grifería"], "Instalaciones": ["Instalación de calefón", "Instalación de sanitarios", "Tuberías nuevas"] },
    soldador: { "Trabajos": ["Puertas y portones", "Rejas y ventanas", "Estructuras metálicas"], "Reparación": ["Soldadura de reparación", "Mantenimiento de estructuras"] },
    albanil: { "Obra": ["Levantamiento de paredes", "Enlucido", "Pisos y cerámica"], "Reparación": ["Arreglos de humedad", "Remodelaciones pequeñas"] },
    electricista: { "Instalaciones": ["Instalaciones eléctricas", "Luminarias", "Cableado nuevo"], "Reparación": ["Cambio de breakers", "Revisión de cortocircuitos"] },
    pintor: { "Interiores": ["Pintura de paredes", "Empaste y sellado"], "Exteriores": ["Pintura de fachadas", "Impermeabilización"] },
    carpintero: { "A medida": ["Closets y muebles de cocina", "Puertas de madera", "Camas y escritorios"], "Reparación": ["Reparación de muebles", "Barnizado"] },
    manicurista: { "Manos": ["Manicure", "Uñas acrílicas", "Diseño de uñas", "Esmaltado semipermanente"], "Pies": ["Pedicure", "Pedicure spa"] },
    peluquero: { "Cabello": ["Corte", "Tintes y mechas", "Peinados"], "Tratamientos": ["Alisado", "Hidratación"] },
    barbero: { "Corte": ["Corte clásico", "Degradado"], "Barba": ["Perfilado de barba", "Afeitado con toalla caliente"] },
    maquillador: { "Ocasiones": ["Maquillaje social", "Novias", "Quinceañeras"], "Extras": ["Cejas y pestañas", "Clases de automaquillaje"] },
    masajista: { "Masajes": ["Relajante", "Descontracturante", "Deportivo"], "Otros": ["Drenaje linfático", "Masaje para embarazadas"] },
    entrenador: { "Entrenamiento": ["Pérdida de peso", "Ganancia muscular", "Preparación física"], "Formato": ["Sesiones individuales", "Grupos pequeños"] },
    yoga: { "Clases": ["Yoga para principiantes", "Vinyasa", "Yoga prenatal"], "Formato": ["Clases individuales", "Clases grupales"] },
    fotografo: { "Sesiones": ["Retratos", "Eventos y cumpleaños", "Fotos de producto"], "Extras": ["Edición de fotos", "Álbum digital"] },
    cuidador: { "Cuidado": ["Adultos mayores", "Niños", "Acompañamiento a citas"], "Horario": ["Por horas", "Turnos de noche"] },
    limpieza: { "Limpieza": ["Limpieza general", "Limpieza profunda", "Limpieza de oficinas"], "Extras": ["Lavado de muebles", "Limpieza de vidrios"] },
    otro: { "Mis servicios": ["Trabajos por encargo", "Asesoría y cotización"] }
  };

  var PITCH = {
    construccion: "Presupuesto claro antes de empezar y trabajo limpio.",
    belleza: "Atención cuidadosa y productos de calidad.",
    deporte: "Planes a tu medida según tu objetivo.",
    otros: "Puntual, responsable y de confianza."
  };

  /* [nombre, oficio, zona, modalidad d|l|a(ambas), servicios, años, calificación, trabajos, nº de fotos] */
  var RAW = [
    ["Luis Quishpe", "plomero", "sur", "d", ["Reparación de fugas", "Destape de cañerías", "Cambio de grifería"], 8, 4.8, 42, 5],
    ["Marco Villacís", "plomero", "norte", "d", ["Instalación de calefón", "Reparación de fugas"], 5, 4.5, 27, 4],
    ["Byron Chiliquinga", "soldador", "sur", "a", ["Puertas y portones", "Estructuras metálicas", "Soldadura de reparación"], 12, 4.9, 61, 6],
    ["Edison Toapanta", "soldador", "valles", "a", ["Rejas y ventanas", "Mantenimiento de estructuras"], 7, 4.3, 19, 3],
    ["Wilson Caiza", "albanil", "centro", "d", ["Enlucido", "Levantamiento de paredes", "Pisos y cerámica"], 15, 4.6, 38, 5],
    ["Segundo Pilatuña", "albanil", "sur", "d", ["Arreglos de humedad", "Remodelaciones pequeñas"], 10, 4.1, 22, 3],
    ["Andrés Proaño", "electricista", "norte", "d", ["Instalaciones eléctricas", "Cambio de breakers", "Luminarias"], 9, 4.7, 55, 4],
    ["Fabián Guamán", "electricista", "valles", "d", ["Cableado nuevo", "Revisión de cortocircuitos"], 6, 4.2, 18, 3],
    ["Diego Cevallos", "pintor", "centro", "d", ["Pintura de paredes", "Empaste y sellado"], 11, 4.4, 33, 6],
    ["Hernán Yánez", "pintor", "norte", "d", ["Pintura de fachadas", "Impermeabilización"], 14, 4.8, 47, 5],
    ["Patricio Almeida", "carpintero", "sur", "a", ["Closets y muebles de cocina", "Puertas de madera", "Barnizado"], 20, 4.9, 72, 6],
    ["Milton Chávez", "carpintero", "valles", "l", ["Reparación de muebles", "Camas y escritorios"], 8, 3.9, 14, 3],
    ["Camila Andrade", "manicurista", "norte", "d", ["Manicure", "Pedicure"], 4, 4.9, 64, 6],
    ["Daniela Quispe", "manicurista", "sur", "l", ["Uñas acrílicas", "Diseño de uñas", "Esmaltado semipermanente"], 6, 4.7, 88, 6],
    ["Paola Sarango", "manicurista", "centro", "a", ["Manicure", "Pedicure spa", "Esmaltado semipermanente"], 3, 4.4, 31, 4],
    ["Verónica Lasso", "peluquero", "norte", "l", ["Corte", "Tintes y mechas", "Peinados"], 10, 4.8, 96, 5],
    ["Gabriela Espín", "peluquero", "valles", "a", ["Corte", "Alisado", "Hidratación"], 7, 4.5, 40, 4],
    ["Kevin Ushiña", "barbero", "centro", "l", ["Corte clásico", "Degradado", "Perfilado de barba"], 5, 4.6, 120, 6],
    ["Israel Naranjo", "barbero", "sur", "a", ["Degradado", "Afeitado con toalla caliente"], 4, 4.2, 45, 3],
    ["Karen Bastidas", "maquillador", "norte", "a", ["Maquillaje social", "Novias", "Cejas y pestañas"], 6, 4.9, 52, 6],
    ["Jessica Moreta", "maquillador", "centro", "d", ["Quinceañeras", "Clases de automaquillaje"], 3, 4.0, 16, 3],
    ["Lorena Cando", "masajista", "valles", "d", ["Relajante", "Descontracturante"], 9, 4.7, 58, 3],
    ["Andrea Iza", "masajista", "norte", "a", ["Drenaje linfático", "Masaje para embarazadas", "Deportivo"], 12, 4.8, 73, 4],
    ["Sebastián Robalino", "entrenador", "norte", "a", ["Pérdida de peso", "Ganancia muscular", "Sesiones individuales"], 8, 4.9, 49, 5],
    ["Nicolás Paredes", "entrenador", "valles", "d", ["Preparación física", "Grupos pequeños"], 5, 4.3, 21, 3],
    ["Mónica Salazar", "yoga", "norte", "l", ["Yoga para principiantes", "Vinyasa", "Clases grupales"], 7, 4.8, 66, 4],
    ["Ricardo Endara", "fotografo", "centro", "d", ["Retratos", "Eventos y cumpleaños", "Edición de fotos"], 9, 4.6, 37, 6],
    ["Alejandra Vinueza", "fotografo", "valles", "a", ["Fotos de producto", "Álbum digital"], 4, 4.1, 12, 5],
    ["Rosa Chicaiza", "cuidador", "sur", "d", ["Adultos mayores", "Acompañamiento a citas", "Por horas"], 13, 4.9, 29, 0],
    ["Martha Alvear", "cuidador", "centro", "d", ["Niños", "Por horas", "Turnos de noche"], 6, 4.4, 17, 0],
    ["Blanca Tigasi", "limpieza", "sur", "d", ["Limpieza general", "Limpieza profunda"], 8, 4.5, 84, 3],
    ["Nancy Guerra", "limpieza", "norte", "d", ["Limpieza de oficinas", "Lavado de muebles", "Limpieza de vidrios"], 5, 4.2, 26, 3],
    ["Fanny Ojeda", "otro", "valles", "a", ["Trabajos por encargo", "Asesoría y cotización"], 6, 4.3, 15, 4, "Jardinería"]
  ];

  /* Segundo (o tercer) oficio de algunos prestadores de ejemplo */
  var EXTRA = {
    "Luis Quishpe": ["albanil"], "Byron Chiliquinga": ["carpintero"], "Wilson Caiza": ["pintor"],
    "Andrés Proaño": ["plomero"], "Daniela Quispe": ["maquillador"], "Verónica Lasso": ["maquillador", "manicurista"],
    "Sebastián Robalino": ["yoga"]
  };

  var oficioById = {}; OFICIOS.forEach(function (o) { oficioById[o.id] = o; });
  var zonaById = {}; ZONAS.forEach(function (z) { zonaById[z.id] = z; });

  var MOD = { d: ["domicilio"], l: ["local"], a: ["domicilio", "local"] };

  var PROVIDERS = RAW.map(function (r, i) {
    return {
      id: "p" + (i + 1), nombre: r[0], oficio: r[1], oficios: [r[1]].concat(EXTRA[r[0]] || []), zona: r[2], modalidad: MOD[r[3]], servicios: r[4],
      anios: r[5], rating: r[6], trabajos: r[7], fotos: r[8], oficioLabel: r[9] || ""
    };
  });

  FF.data = {
    groups: GROUPS, oficios: OFICIOS, zonas: ZONAS, modalidades: MODALIDADES, servicios: SERVICIOS, providers: PROVIDERS,
    oficio: function (id) { return oficioById[id]; },
    zona: function (id) { return zonaById[id]; },
    nombreDeOficio: function (id, p) {
      if (id === "otro") return (p && p.oficioLabel) || "Otro servicio";
      return oficioById[id] ? oficioById[id].nombre : "";
    },
    /* Oficio principal (el primero que eligió) */
    oficioNombre: function (p) { return FF.data.nombreDeOficio(p.oficio, p); },
    /* Todos sus oficios, el principal primero */
    oficiosNombres: function (p) {
      return (p.oficios && p.oficios.length ? p.oficios : [p.oficio]).map(function (id) { return FF.data.nombreDeOficio(id, p); });
    },
    /* "Plomero +1" para tarjetas */
    oficioResumen: function (p) {
      var n = p.oficios ? p.oficios.length : 1;
      return FF.data.oficioNombre(p) + (n > 1 ? " +" + (n - 1) : "");
    },
    tieneOficio: function (p, id) { return (p.oficios || [p.oficio]).indexOf(id) >= 0; },
    zonaLargo: function (id) { return zonaById[id] ? zonaById[id].largo : ""; },
    pitch: function (oficioId) { var o = oficioById[oficioId]; return o ? PITCH[o.grupo] : ""; },
    modalidadTexto: function (arr) {
      if (!arr || !arr.length) return "Modalidad por acordar";
      if (arr.length > 1) return "A domicilio y en su local";
      return arr[0] === "domicilio" ? "A domicilio" : "En su local";
    },
    primerNombre: function (nombre) { return String(nombre || "").trim().split(/\s+/)[0] || ""; }
  };
})();
