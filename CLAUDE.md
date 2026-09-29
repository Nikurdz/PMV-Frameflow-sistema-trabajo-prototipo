# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Prototipo web estático (HTML/CSS/JS puro, sin build ni dependencias de runtime) del PMV de Frameflow. La fuente de verdad de los requerimientos es `Levantamiento_de_Requerimientos_Frameflow.md` (no está en el repo); sus IDs (RF-xx, RN-xx, RNF-xx) se citan en comentarios y tests. El README explica el uso, el protocolo de prueba y qué es PMV frente a demostrativo. Idioma del producto, comentarios y commits: español. El autor a nombrar es David Tapia.

## Comandos

- Ver: abrir `index.html` (funciona con `file://`) o `npx serve .`
- `npm test` corre las dos suites; `npm run test:e2e` y `npm run test:responsive` por separado.
- Playwright suele estar instalado de forma global: `NODE_PATH=$(npm root -g) node tests/e2e.mjs`. `SHOTS_DIR=<dir>` guarda capturas; `CHROMIUM_PATH` apunta a otro binario.
- No hay linter, formateador ni build.
- No hay runner que filtre pruebas: cada suite es un script secuencial con bloques `section(...)`. Para aislar un caso, comenta las otras secciones o recórrelo a mano con `?pmv=1#/ruta`.

## Arquitectura

- **Sin módulos ES.** `index.html` carga scripts clásicos en orden fijo (config → data → validators → state → reviews → ui → observer → views/* → router) y todo cuelga de `window.FF`. Un archivo JS nuevo hay que agregarlo a mano en ese orden.
- **Router (`js/router.js`).** Router por hash. `resolve()` mapea ruta → vista. Cada vista es `{title, render(route) → string HTML, mount(root, route), unmount?, needsProfile?}`. El router asigna `innerHTML`, llama `mount`, aplica guardas (`needsProfile`, `stepGuard` del registro, `DEMO_ONLY` en modo PMV) y al final fija `FF.rendered = location.hash`. **Las pruebas esperan esa marca:** cualquier código que cambie el hash con `history.replaceState` debe actualizarla (Explorar ya lo hace).
- **Dos modos por URL** (`js/config.js`): `?pmv=1` deja solo las 8 pantallas del PMV (sin menú ni Explorar, sin persistencia, marco de teléfono desde 600 px) y `?observer=1` agrega el cronómetro del observador. Menú, Explorar, Oficios, Mi perfil y Cómo funciona son demostrativos: no deben filtrarse al modo PMV, porque la regla R-02 limita la prueba a 3 características.
- **Estado (`js/state.js`).** `FF.state` guarda el borrador de registro, servicios, fotos (data URLs comprimidas), `profile`, filtros, `lastProvider` y `lastExplorar`. `FF.store.publish()`/`updateProfile()` crean o editan el perfil y `FF.store.own()` lo adapta a la misma forma que un prestador de `data.js`, para tratarlo igual en Explorar y en el detalle. Persiste en localStorage (`frameflow.perfil.v1`: perfil, servicios y fotos; `frameflow.opiniones.v1`: opiniones) solo fuera de modo PMV. `store.persist()` puede fallar por cuota al guardar fotos: se avisa y no se rompe.
- **Varios oficios.** Todo perfil y prestador tiene `oficios: []` con `oficio` = `oficios[0]` (el principal). Cualquier lógica por oficio (filtros, búsqueda, conteos, mensaje de cierre) debe recorrer `oficios`, no solo `oficio`; usa `FF.data.oficiosNombres/oficioResumen/tieneOficio`. Perfiles guardados antes de este cambio se migran en `store.load()`.
- **Opiniones (`js/reviews.js`).** `FF.reviews` da `rating(p)`, `count(p)`, `list(p)` y `add`. La calificación es la de muestra ponderada por `trabajos` más las opiniones nuevas; úsala (no `p.rating`) para mostrar, ordenar y filtrar. Solo se muestran fuera de modo PMV.
- **Límites** en `js/config.js`: `MAX_OFICIOS` (5), `MAX_FOTOS` (12), `PAGE_SIZE` (20 por página en Explorar, con `pag` en el hash) y `MAX_COMENTARIO` (300).
- **Datos (`js/data.js`).** 17 oficios en 4 grupos, servicios por oficio y 33 prestadores ficticios **sin teléfono, a propósito**: el prototipo no debe escribir a terceros. "Contactar" de cualquier prestador lleva a `#/cierre`; ahí están los únicos enlaces `wa.me` reales (`WHATSAPP_EQUIPO` y "Recomendar"). El cierre usa el oficio del perfil propio o, si no hay, el de `lastProvider`.
- **Explorar (`js/views/explorar.js`).** Los filtros se sincronizan con el hash (`parse`/`serialize`). `update()` repinta solo resultados, chips y contador. Un único `<aside id="filters">` es hoja inferior en móvil y barra lateral desde 900 px.
- **Seguridad.** Los campos aceptan escritura real: todo texto de usuario que entra a HTML pasa por `FF.ui.esc`.

## Convenciones no obvias

- Botones, chips y campos de al menos 48 px de alto y cuerpo de 16 px (RNF-02). Un texto por debajo de 14 px hace fallar las pruebas.
- Se ajustaron dos tokens del documento por contraste WCAG AA: el botón de WhatsApp usa `--wa-btn` (no `--wa`) y el texto secundario sobre fondo gris usa `--text-2-bg` (no `--text-2`).
- `html { overflow-x: hidden }` evita el scroll horizontal durante la animación de deslizamiento.
- `#app` en modo PMV usa `overflow: clip`; con `hidden` se rompe el `position: sticky` del botón principal.
- El `sticky` del botón de contacto va en `.detail-side` dentro de un contenedor flex. Dentro de un grid o de un padre del alto del propio botón no se pega al fondo.
- Los contenedores en grid usan `minmax(0, 1fr)` para que el contenido largo no ensanche la columna.
- `.cta-bar` (botón principal fijo) usa `bottom: var(--nav-h)` para no quedar tapada por el menú inferior; `--nav-h` vale 0 en modo PMV, pasos de registro y escritorio.
- Los formularios comparten helpers en `FF.ui` (`oficioPicker`/`bindOficioPicker`, `radioChip`/`bindRadios`, `errorLine`/`setFieldError`): reutilízalos en vez de duplicarlos.

## Pruebas

- `tests/e2e.mjs` levanta un servidor estático propio y parchea `Locator.click` para esperar `FF.rendered`. Cubre el flujo PMV, Explorar, filtros, y auditorías de tamaño táctil y contraste.
- `tests/responsive.mjs` es una matriz de 14 tamaños (320×568 a 1920×1080 y celular horizontal) por rutas por 2 modos. Exige: sin scroll horizontal, menú siempre presente, ningún botón oculto, fuera de pantalla o tapado, y acciones principales alcanzables (a la vista y sin nada encima). También abre la hoja de opinión en cada tamaño. Al agregar una ruta, súmala a `ROUTES`/`PMV_ROUTES`.
- Los botones que desaparecen a propósito en escritorio (`f-open`, `f-close`, `f-apply`) están en una lista de excepciones dentro de la prueba responsiva.

## Git

Se desarrolla en `claude/inspiring-meitner-06h7ft`. El remoto puede recibir commits desde la web de GitHub (por ejemplo un `CNAME` de Pages): haz `git fetch` y merge antes de `push`, sin forzar.
