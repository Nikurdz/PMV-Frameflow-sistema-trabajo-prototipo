# Frameflow · Prototipo clicable (PMV)

**Sistema de empleabilidad y contratación de trabajadores independientes en Quito.**
Emprendimiento Tecnológico · NRC 2667 · PUCE · Elaborado por **David Tapia**.

Prototipo web, **responsivo** y sin dependencias (HTML + CSS + JavaScript). Traslada a la web el prototipo de Figma *PMV Frameflow v1* descrito en el *Levantamiento de Requerimientos* (sec. 12) y lo amplía con una visión del producto completo para presentarlo.

## Cómo verlo

- **Local:** abre `index.html` con doble clic, o levanta un servidor: `npx serve .`
- **Publicarlo:** en GitHub, *Settings → Pages → Deploy from a branch* y elige la rama. El enlace resultante se puede poner en `PROTOTYPE_URL` (ver "Configuración").

## Dos modos del mismo sitio

La regla del curso (R-02) exige **tres características, ni una más**, para la prueba con el segmento. Para poder presentar un producto más completo sin invalidar la métrica, el sitio tiene dos modos:

| Modo | Enlace | Qué muestra | Para qué |
|---|---|---|---|
| **Presentación** | `index.html` | Todo: menú general, Explorar con filtros, Oficios, Mi perfil, Cómo funciona y el flujo de registro. | Mostrar la visión del producto. |
| **Prueba PMV** | `index.html?pmv=1` | Solo el flujo de las 8 pantallas, sin menú ni Explorar. | **Es el enlace que se usa con las 6 personas del segmento.** |
| Observador (opcional) | añadir `&observer=1` | Cronómetro y hoja de registro flotante. | Anotar tiempo, ayuda y compromiso durante la prueba. |

### Qué es PMV y qué es demostrativo

| Parte | Estado | Requerimientos |
|---|---|---|
| Registro gratis en 3 pasos (pantallas 1–4) | **PMV** | RF-01 a RF-08, RF-38 |
| Perfil publicado con servicios y fotos (pantallas 5–7) | **PMV** | RF-12, RF-14, RF-15, RF-18, RF-19 |
| Contacto directo y compromiso por WhatsApp (pantallas 7–8) | **PMV** | RF-24, RF-31, RF-32, RF-33 |
| Hasta 5 oficios por trabajador (el primero es el principal) | **PMV** (paso 1 del registro) | RF-03 (ampliado; RN-03 se relaja) |
| Explorar: búsqueda, filtros, orden y páginas de 20 | Visión MVP, *demostrativo* | RF-20, RF-21, RF-22, RF-23 |
| Editar perfil (oficios, nombre, zona, WhatsApp) | Visión MVP, *demostrativo* | RF-09 |
| Fotos: hasta 12, con compresión | Visión MVP, *demostrativo* (en PMV siguen siendo opcionales) | RF-15, RF-16 |
| Opiniones con 5 estrellas, trabajo realizado y comentario | Visión MVP, *demostrativo* | RF-29 (adelantado) |
| Reportar perfil, compartir, publicidad marcada | Visión MVP, *demostrativo* | RF-30, RN-07 |

## Mapa del sitio

```
Inicio ─┬─ Crear mi perfil ─ Paso 1 oficio ─ Paso 2 datos ─ Paso 3 WhatsApp ─ Perfil publicado
        │                                                        ├─ Agregar servicios ─┐
        │                                                        └─ Omitir ────────────┴─ Vista del cliente ─ Cierre (WhatsApp)
        └─ Busco un trabajador ─ Explorar ─ Detalle del prestador ─ Contactar ─ Cierre (WhatsApp)
Mi perfil ─ Editar mi perfil · Editar servicios y fotos · Ver como cliente
Menú general: Inicio · Explorar · Oficios · Mi perfil · Cómo funciona
```

Los campos **aceptan escritura real** y validan (nombre y apellido; WhatsApp `09XXXXXXXX` o `+5939XXXXXXXX`). El perfil publicado usa los datos escritos. En modo presentación el perfil, sus fotos y las opiniones se guardan en el navegador; en modo prueba cada carga empieza limpia.

### Límites del producto (`js/config.js`)

| Constante | Valor | Qué controla |
|---|---|---|
| `MAX_OFICIOS` | 5 | Oficios que puede elegir un trabajador. El primero es el principal; el sexto se bloquea con un aviso. |
| `MAX_FOTOS` | 12 | Fotos de trabajos por perfil. Se comprimen al subir (lado mayor 900 px, JPEG). |
| `PAGE_SIZE` | 20 | Prestadores por página en Explorar (Anterior/Siguiente, `pag` en la URL): nunca se dibujan más a la vez. |
| `MAX_COMENTARIO` | 300 | Letras de una opinión. |

### Opiniones (demostrativo)
Cualquier visitante puede dejar una opinión en un perfil: calificación de 1 a 5 estrellas, nombre, **qué trabajo realizó** y comentario. Se guardan en el navegador. La calificación mostrada combina la de muestra del prestador (ponderada por su cantidad de opiniones) con las nuevas. Solo se ven en modo presentación. En la app real RN-08 exigiría haber contactado al trabajador.

## Datos de ejemplo

Los **33 prestadores** de Explorar son ficticios y genéricos (17 oficios, 4 zonas). Sus calificaciones, cantidad de opiniones y las 2 opiniones de cada perfil son de muestra; algunos tienen 2 o 3 oficios. Las fotos son cuadros de reemplazo: **no hay imágenes de IA ni de terceros** (RN-05). Los prestadores de ejemplo **no tienen teléfono**: "Contactar por WhatsApp" lleva a la pantalla "¿Quieres probar la app real?", para que el prototipo nunca escriba a una persona real. Solo esa pantalla abre enlaces `wa.me` reales.

## Configuración (`js/config.js`)

| Constante | Qué hacer |
|---|---|
| `WHATSAPP_EQUIPO` | Número del equipo en formato internacional sin `+` (hoy `593995961669`). Vacío = WhatsApp deja elegir el chat. Queda visible en el código público (limitación L-07). |
| `PROTOTYPE_URL` | Enlace público del prototipo para "Recomendar a otra persona". Vacío = se calcula desde la URL actual, sin parámetros (enlace principal de la página). |

## Diseño y accesibilidad

Sistema de diseño del documento (sec. 12.6): Inter 24/18/16/16/14, `#1D5FD1`, `#0F3E96` (presionado), `#E8F0FE`, `#111827`, `#D1D5DB`, `#F3F4F6`, `#DCFCE7`. Botones y opciones de **≥ 48 px** de alto y texto de cuerpo de **16 px** (RNF-02).

Dos ajustes para cumplir el contraste WCAG 2.1 AA de 4,5:1 (RNF-04), que el documento también exige:

| Token del documento | Problema | Ajuste |
|---|---|---|
| WhatsApp `#16A34A` con texto blanco | 3,3:1 | Fondo del botón `#15803D` (5,0:1). `#16A34A` se conserva como color de marca. |
| Texto secundario `#6B7280` sobre `#F3F4F6` | 4,4:1 | `#4B5563` cuando va sobre el fondo gris. `#6B7280` se usa en marcadores de campos. |

### Responsivo
- Móvil primero (desde 320 px). Menú inferior en celular y tablet; menú superior desde 900 px.
- Los filtros son una hoja inferior en celular y una barra lateral en escritorio.
- En celular el botón principal (Continuar, Guardar, Contactar) queda **fijo y a la vista**; en pantallas bajas o en horizontal el encabezado se compacta.
- En modo prueba y pantalla ancha, el flujo se muestra en un marco de teléfono centrado.

## Pruebas automáticas

Requieren Node 18+ y Playwright con Chromium (`npm i -D playwright && npx playwright install chromium`, o el Playwright global con `NODE_PATH=$(npm root -g)`).

```bash
npm test                 # las dos suites
npm run test:e2e         # 192 comprobaciones: flujo PMV, oficios múltiples, Explorar y páginas, opiniones, edición, fotos, contraste y tamaños táctiles
npm run test:responsive  # 14 tamaños de pantalla × 15 rutas × 2 modos
```

La suite responsiva verifica en cada tamaño (320×568 hasta 1920×1080, y celular en horizontal): sin scroll horizontal, menú siempre presente, **ningún botón desaparece, se sale de pantalla o queda tapado**, acciones principales alcanzables y hojas de filtros y de contacto utilizables.

## Protocolo de prueba con el segmento (sec. 12.10 y 13)

- 6 trabajadores independientes de Quito (mínimo 5), **no** compañeros ni familiares, ~10 min c/u, en su propio celular, con el enlace `?pmv=1`.
- Consigna: *"Imagina que quieres conseguir clientes nuevos. Usa esta app como lo harías tú"*. El observador mira, cronometra y **no ayuda**; al final pide el compromiso.
- **Métrica (no se mueve):** 4 de 6 completan el registro y publican, sin ayuda, en menos de 3 minutos. **Abandono:** 2 o menos de 6 completan el flujo, o solo 1 o ninguno deja su WhatsApp o refiere a otra persona.
- Compromiso concreto: quien toca "Sí, quiero probarla" y **envía** el mensaje, o quien recomienda la app.

> **Cuidado al comparar con el Figma (RI-02):** aquí los campos aceptan escritura real, así que el tiempo incluye escribir. La limitación L-01 del Figma ya no aplica y conviene decirlo al reportar el resultado medido.

## Estructura

```
index.html          shell: cabecera, menú, contenedor de vistas
css/                tokens.css · components.css · views.css
js/config.js        WhatsApp del equipo, enlace del prototipo, mensajes, modos
js/data.js          17 oficios, zonas, servicios por oficio, 33 prestadores de ejemplo
js/state.js         estado y guardado del perfil propio
js/validators.js    nombre y WhatsApp ecuatoriano
js/ui.js            componentes compartidos (tarjetas, hoja modal, aviso)
js/router.js        rutas por hash, guardas y modos
js/views/*.js       una vista por pantalla
js/observer.js      modo observador
tests/              e2e.mjs · responsive.mjs
```

## Declaración de uso de IA

Este prototipo se desarrolló con asistencia de Claude Code (Anthropic). Debe declararse en la última lámina del dossier, según el Anexo B del levantamiento.
