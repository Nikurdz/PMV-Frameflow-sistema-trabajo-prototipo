/* Frameflow · Pruebas de extremo a extremo con Playwright.
   Uso:  NODE_PATH=$(npm root -g) node tests/e2e.mjs
   Levanta un servidor estático local, recorre el flujo PMV y la vista de presentación,
   y audita tamaños táctiles, contraste y desbordes. Termina con código 1 si algo falla. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = process.env.SHOTS_DIR || "";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const file = path.join(ROOT, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

let failures = 0, passes = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { passes++; console.log("  ok   " + name); }
  else { failures++; console.log("  FAIL " + name + (detail ? "  → " + detail : "")); }
};
const section = (t) => console.log("\n" + t);

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

/* El render ocurre en el evento hashchange (después del clic): cada clic espera a que la vista nueva esté dibujada */
const settled = () => !window.FF || !FF.rendered || FF.rendered === location.hash;
async function newPage(viewport, url) {
  const ctx = await browser.newContext({ viewport, locale: "es-EC", acceptDownloads: false });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());   // sin red externa en la prueba
  page.on("request", (r) => { if (!r.url().startsWith(BASE) && !/fonts\.(googleapis|gstatic)/.test(r.url()) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
  const proto = Object.getPrototypeOf(page.locator("body"));
  if (!proto.__settle) {
    const click = proto.click;
    proto.click = async function (...a) { const r = await click.apply(this, a); await this.page().waitForFunction(settled).catch(() => {}); return r; };
    proto.__settle = true;
  }
  await go(page, url);
  return { page, ctx, errors, external };
}
const go = async (page, url) => { await page.goto(BASE + url); await page.waitForFunction(settled); };
const shot = async (page, name) => { if (SHOTS) await page.waitForTimeout(400); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); };
const hash = (page) => page.evaluate(() => location.hash);
const visible = (page, sel) => page.locator(sel).first().isVisible();

/* Auditoría: alto táctil ≥ 48 px, texto de cuerpo ≥ 16 px, contraste AA, sin desborde horizontal */
async function audit(page, label) {
  await page.waitForTimeout(400);   // deja terminar la animación de deslizamiento antes de medir
  const res = await page.evaluate(() => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.95) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const isVis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const out = { small: [], contrast: [], overflow: document.documentElement.scrollWidth > window.innerWidth + 1, smallText: [] };
    document.querySelectorAll(".btn, .chip, .nav-item, .iconbtn, .oficio-tile, .input, .slot-add").forEach((el) => {
      if (!isVis(el) || el.closest(".sr-only")) return;
      const h = el.getBoundingClientRect().height;
      if (h < 47.5 && !el.classList.contains("chip-removable") && !el.closest(".observer")) out.small.push((el.className || el.tagName) + " " + Math.round(h) + "px «" + (el.textContent || "").trim().slice(0, 24) + "»");
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const t = walker.currentNode; if (!t.nodeValue.trim()) continue;
      const el = t.parentElement; if (!el || seen.has(el) || !isVis(el) || el.closest(".sr-only, [hidden], script, style")) continue;
      seen.add(el);
      if (el.closest("button[disabled]")) continue;
      const cs = getComputedStyle(el), fg = parse(cs.color); if (!fg) continue;
      const bg = bgOf(el);
      const a = fg.a, mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
      const l1 = L(mix), l2 = L(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      if (ratio < need) out.contrast.push(ratio.toFixed(2) + " (<" + need + ") «" + t.nodeValue.trim().slice(0, 30) + "» " + cs.color + " sobre rgb(" + [bg.r, bg.g, bg.b] + ")");
      if (size < 14 && !el.closest(".nav-item, .badge, .ph-lb")) out.smallText.push(size + "px «" + t.nodeValue.trim().slice(0, 24) + "»");
    }
    return out;
  });
  ok(`${label}: botones y opciones ≥ 48 px de alto`, res.small.length === 0, res.small.join(" | "));
  ok(`${label}: contraste de texto ≥ AA`, res.contrast.length === 0, res.contrast.join(" | "));
  ok(`${label}: sin scroll horizontal`, !res.overflow);
  ok(`${label}: sin texto menor a 14 px`, res.smallText.length === 0, res.smallText.join(" | "));
}

/* ============ 1. Flujo PMV (?pmv=1) en móvil 360×800 ============ */
section("1. Flujo PMV en 360×800 (?pmv=1)");
{
  const { page, ctx, errors, external } = await newPage({ width: 360, height: 800 }, "?pmv=1");
  ok("Pantalla 1: titular y mensaje de gratuidad", (await page.locator("h1").innerText()).includes("Publica tu oficio y consigue clientes en Quito") && (await page.locator("body").innerText()).includes("Es gratis"));
  ok("Pantalla 1: 5 chips de oficios de ejemplo", (await page.locator(".chip-row li").count()) === 5);
  ok("Modo prueba: sin menú general ni 'Busco un trabajador'", !(await visible(page, "#bottom-nav .nav-item")) && (await page.getByText("Busco un trabajador").count()) === 0);
  await audit(page, "P1");
  await shot(page, "p1-bienvenida");

  await page.getByRole("link", { name: "Crear mi perfil gratis" }).click();
  ok("Paso 1: ruta y barra de progreso 1 de 3", (await hash(page)) === "#/registro/1" && (await page.locator(".step-label").innerText()) === "Paso 1 de 3");
  ok("Paso 1: 17 oficios en 4 grupos", (await page.locator("[data-oficio]").count()) === 17 && (await page.locator("[role=radiogroup]").count()) === 4);
  await page.getByRole("button", { name: "Continuar" }).click();
  ok("Paso 1: sin oficio no avanza y explica el error", (await hash(page)) === "#/registro/1" && (await page.locator("#form-error").innerText()).includes("Elige tu oficio"));
  await page.getByRole("radio", { name: /Otro/ }).click();
  ok("Paso 1: 'Otro' muestra el campo opcional", await visible(page, "#oficio-otro"));
  await page.getByRole("radio", { name: /Manicurista/ }).click();
  ok("Paso 1: selección única", (await page.locator("[data-oficio][aria-checked=true]").count()) === 1 && !(await visible(page, "#oficio-otro")));
  await audit(page, "P2");
  await shot(page, "p2-oficio");
  await page.getByRole("button", { name: "Continuar" }).click();

  ok("Paso 2: ruta 2 de 3", (await hash(page)) === "#/registro/2" && (await page.locator(".step-label").innerText()) === "Paso 2 de 3");
  ok("Paso 2: 4 zonas", (await page.locator("[data-zona]").count()) === 4);
  await page.getByRole("button", { name: "Continuar" }).click();
  ok("Paso 2: vacío muestra errores de nombre y zona", (await page.locator("#f-nombre .field-error").innerText()).length > 3 && (await page.locator("#f-zona.has-error").count()) === 1);
  await page.fill("#nombre", "Camila");
  await page.getByRole("button", { name: "Continuar" }).click();
  ok("Paso 2: pide nombre y apellido", (await page.locator("#f-nombre .field-error").innerText()).includes("apellido"));
  await page.fill("#nombre", "Camila Andrade");
  await page.getByRole("radio", { name: "Norte" }).click();
  await audit(page, "P3");
  await shot(page, "p3-datos");
  await page.getByRole("button", { name: "Continuar" }).click();

  ok("Paso 3: ruta 3 de 3 y aviso de gratuidad", (await hash(page)) === "#/registro/3" && (await page.locator("body").innerText()).includes("No pagas por publicar ni por volver a intentar"));
  for (const bad of ["", "123", "0898765432", "099876543", "+59399876543", "abc"]) {
    await page.fill("#wa", bad);
    await page.getByRole("button", { name: "Publicar mi perfil" }).click();
    ok(`Paso 3: rechaza «${bad || "vacío"}»`, (await hash(page)) === "#/registro/3" && (await page.locator("#f-wa.has-error").count()) === 1);
  }
  ok("Paso 3: error en español sencillo con ejemplo", (await page.locator("#f-wa .field-error").innerText()).includes("0998765432"));
  await shot(page, "p4-whatsapp-error");
  await page.fill("#wa", "+593 99 876 5432");
  await page.getByRole("button", { name: "Publicar mi perfil" }).click();
  ok("Publica de inmediato con +593", (await hash(page)) === "#/publicado");

  ok("Pantalla 5: confirmación con datos ingresados", await page.locator(".success").innerText().then((t) => t.includes("ya está publicado") && t.includes("Camila Andrade") && t.includes("Manicurista") && t.includes("Norte de Quito")));
  ok("Pantalla 5: no hay cobros", !(await page.locator("body").innerText()).match(/\$\s?\d|pagar ahora|checkout/i));
  await audit(page, "P5");
  await shot(page, "p5-publicado");
  await page.getByRole("link", { name: "Agregar mis servicios" }).click();

  ok("Pantalla 6: subtemas Manos, Pies y Modalidad", await page.locator(".group-title").allInnerTexts().then((t) => ["Manos", "Pies", "Modalidad"].every((x) => t.includes(x))));
  ok("Pantalla 6: 4 servicios en Manos y 2 en Pies", (await page.locator("[data-serv]").count()) === 4 + 2 + 2);
  await page.getByRole("button", { name: "Manicure", exact: true }).click();
  await page.getByRole("button", { name: "A domicilio" }).click();
  ok("Pantalla 6: chips multi-selección", (await page.locator("[data-serv][aria-pressed=true]").count()) === 2);
  await page.setInputFiles("#file", { name: "trabajo.png", mimeType: "image/png", buffer: PNG });
  await page.waitForSelector(".slot img");
  ok("Pantalla 6: vista previa local de la foto", (await page.locator(".slot img").count()) === 1);
  await audit(page, "P6");
  await shot(page, "p6-servicios");
  await page.getByRole("button", { name: "Guardar servicios" }).click();

  ok("Pantalla 7: etiqueta 'Vista del cliente' y galería 'Trabajos de Camila'", (await page.locator(".client-tag").innerText()) === "Vista del cliente" && (await page.locator("body").innerText()).includes("Trabajos de Camila"));
  ok("Pantalla 7: servicios elegidos y modalidad visibles", await page.locator(".detail-main").innerText().then((t) => t.includes("Manicure") && t.includes("A domicilio")));
  ok("Pantalla 7: foto subida en la galería", (await page.locator(".gallery .has-img img").count()) === 1);
  ok("Pantalla 7: perfil visible sin pedir registro", (await page.getByText(/regístrate|crear cuenta|inicia sesión/i).count()) === 0);
  await audit(page, "P7");
  await shot(page, "p7-vista-cliente");
  await page.getByRole("link", { name: /Contactar por WhatsApp/ }).click();

  ok("Pantalla 8: pregunta de compromiso", (await hash(page)) === "#/cierre" && (await page.locator("h1").innerText()) === "¿Quieres probar la app real?");
  const interes = await page.locator("#interes").getAttribute("href");
  const recomendar = await page.locator("#recomendar").getAttribute("href");
  ok("Pantalla 8: 'Sí, quiero probarla' abre wa.me con el mensaje predeterminado", interes.startsWith("https://wa.me/") && decodeURIComponent(interes.split("?text=")[1]) === "Hola, quiero probar Frameflow cuando esté lista. Mi oficio es: Manicurista", interes);
  ok("Pantalla 8: 'Recomendar' abre wa.me sin número y con el enlace del prototipo", recomendar.startsWith("https://wa.me/?text=") && decodeURIComponent(recomendar.split("?text=")[1]).startsWith("Mira esta app gratis para publicar tu oficio y conseguir clientes en Quito: ") && decodeURIComponent(recomendar).includes("?pmv=1"), recomendar);
  ok("Pantalla 8: los enlaces se abren en pestaña nueva", (await page.locator("#interes").getAttribute("target")) === "_blank" && (await page.locator("#recomendar").getAttribute("rel")).includes("noopener"));
  await audit(page, "P8");
  await shot(page, "p8-cierre");

  await page.getByRole("button", { name: "Volver a empezar" }).click();
  ok("Volver a empezar reinicia el flujo", (await hash(page)) === "#/" && (await page.evaluate(() => FF.state.profile)) === null);

  // Guardas en modo prueba
  await go(page, "?pmv=1#/registro/3");
  ok("Guarda: no se puede saltar al paso 3", (await hash(page)) === "#/registro/1");
  await go(page, "?pmv=1#/explorar");
  ok("Modo prueba: Explorar no existe (redirige a inicio)", (await hash(page)) === "#/");
  await go(page, "?pmv=1#/vista");
  ok("Guarda: la vista del cliente exige perfil publicado", (await hash(page)) === "#/");
  ok("Sin errores de consola en el flujo PMV", errors.length === 0, errors.join(" | "));
  ok("Sin peticiones externas de datos", external.length === 0, external.join(" | "));
  await ctx.close();
}

/* ============ 2. Camino corto: publicar y omitir servicios ============ */
section("2. Omitir servicios (?pmv=1)");
{
  const { page, ctx } = await newPage({ width: 360, height: 800 }, "?pmv=1#/registro/1");
  await page.getByRole("radio", { name: /Plomero/ }).click(); await page.getByRole("button", { name: "Continuar" }).click();
  await page.fill("#nombre", "Juan Pérez"); await page.getByRole("radio", { name: "Sur" }).click(); await page.getByRole("button", { name: "Continuar" }).click();
  await page.fill("#wa", "0991234567"); await page.getByRole("button", { name: "Publicar mi perfil" }).click();
  await page.getByRole("link", { name: "Omitir por ahora" }).click();
  ok("Omitir salta a la vista del cliente con perfil publicado", (await hash(page)) === "#/vista" && (await page.locator("body").innerText()).includes("Juan Pérez"));
  ok("Sin servicios: mensaje claro y galería de reemplazo", (await page.locator("body").innerText()).includes("Todavía no agregó servicios") && (await page.locator(".gallery .ph").count()) === 3);
  await page.getByRole("link", { name: /Contactar por WhatsApp/ }).click();
  ok("Mensaje de interés usa el oficio del perfil", decodeURIComponent((await page.locator("#interes").getAttribute("href")).split("?text=")[1]).endsWith("Mi oficio es: Plomero"));
  await ctx.close();
}

/* ============ 3. Presentación en escritorio 1280×800 ============ */
section("3. Presentación en escritorio 1280×800");
{
  const { page, ctx, errors, external } = await newPage({ width: 1280, height: 800 }, "");
  ok("Menú superior con 5 secciones", (await page.locator("#desktop-nav .nav-item").count()) === 5 && (await visible(page, "#desktop-nav")));
  ok("Menú inferior oculto en escritorio", !(await visible(page, "#bottom-nav")));
  ok("Inicio ofrece las dos rutas (trabajador y cliente)", (await page.getByRole("link", { name: "Crear mi perfil gratis" }).count()) >= 1 && (await page.getByRole("link", { name: "Busco un trabajador" }).count()) === 1);
  ok("Pie con crédito a David Tapia", (await page.locator("#site-footer").innerText()).includes("David Tapia"));
  await shot(page, "d-inicio");

  await page.locator("#desktop-nav").getByRole("link", { name: "Explorar" }).click();
  await page.waitForSelector(".result");
  const total = await page.evaluate(() => FF.data.providers.length);
  ok("Explorar: lista todos los prestadores de ejemplo (≥ 30)", total >= 30 && (await page.locator(".result").count()) === total, `total=${total}`);
  ok("Explorar: cubre los 17 oficios menos 'Otro' con al menos 1 prestador y las 4 zonas", await page.evaluate(() => {
    const of = new Set(FF.data.providers.map((p) => p.oficio)), z = new Set(FF.data.providers.map((p) => p.zona));
    return FF.data.oficios.every((o) => of.has(o.id)) && z.size === 4;
  }));
  ok("Explorar: filtros visibles como barra lateral", await visible(page, "#filters") && !(await visible(page, "#f-open")));
  ok("Explorar: tarjeta 'Publicidad' marcada y separada", (await page.locator(".ad .tag").innerText()) === "Publicidad" && (await page.locator(".result .ad").count()) === 0);
  ok("Explorar: contador", (await page.locator("#f-count").innerText()) === `${total} prestadores en Quito`);
  await shot(page, "d-explorar");

  // Búsqueda de texto
  await page.fill("#f-q", "plomero");
  ok("Búsqueda «plomero» → 2 resultados", (await page.locator(".result").count()) === 2);
  await page.fill("#f-q", "PELUQUERA");
  ok("Búsqueda sin tildes/mayúsculas/género «PELUQUERA» → 2", (await page.locator(".result").count()) === 2);
  await page.fill("#f-q", "uñas acrilicas");
  ok("Búsqueda por servicio «uñas acrilicas» encuentra manicuristas", (await page.locator(".result").count()) >= 1 && (await page.locator(".result").first().innerText()).includes("Manicurista"));
  await page.fill("#f-q", "camila");
  ok("Búsqueda por nombre «camila»", (await page.locator(".result").count()) === 1);
  await page.fill("#f-q", "zzzz");
  ok("Sin coincidencias: estado vacío con salida", (await page.locator(".empty h2").innerText()).includes("No encontramos") && (await page.locator("#f-count").innerText()).startsWith("0 prestadores"));
  await shot(page, "d-vacio");
  await page.locator("#results").getByRole("button", { name: "Limpiar filtros" }).click();
  ok("Limpiar filtros desde el estado vacío restaura la lista", (await page.locator(".result").count()) === total && (await page.inputValue("#f-q")) === "");

  // Filtros combinados comparados con el cálculo independiente sobre los datos
  await page.getByRole("radio", { name: "Norte" }).click();
  await page.locator("#filters").getByRole("radio", { name: "A domicilio" }).click();
  await page.locator("#filters").getByRole("radio", { name: "4 ★ o más" }).click();
  const exp = await page.evaluate(() => FF.data.providers.filter((p) => p.zona === "norte" && p.modalidad.includes("domicilio") && p.rating >= 4).length);
  ok("Zona + modalidad + calificación coincide con lo esperado", exp > 0 && (await page.locator(".result").count()) === exp, `esperado=${exp}`);
  ok("Filtros se reflejan en la URL (enlace compartible)", (await hash(page)).includes("zona=norte") && (await hash(page)).includes("mod=domicilio") && (await hash(page)).includes("min=4"));
  ok("Chips de filtros activos y contador por zona", (await page.locator("[data-rm]").count()) === 3 && (await page.locator("#f-count").innerText()).includes("Norte de Quito"));
  await page.locator("[data-rm=min]").click();
  ok("Quitar un filtro activo lo desactiva", (await page.locator("[data-rm]").count()) === 2);

  await page.locator("#filters").getByRole("radio", { name: "Belleza y cuidado personal" }).click();
  const opts = await page.locator("#f-of option").allInnerTexts();
  ok("Oficio se acota a la categoría elegida", opts.includes("Manicurista") && !opts.includes("Plomero"));
  await page.selectOption("#f-of", "manicurista");
  ok("Filtro por oficio", (await page.locator(".result").count()) === (await page.evaluate(() => FF.data.providers.filter((p) => p.oficio === "manicurista" && p.zona === "norte" && p.modalidad.includes("domicilio")).length)));

  // Orden
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  await page.selectOption("#f-sort", "nombre");
  const names = await page.locator(".result h3").allInnerTexts();
  ok("Orden A–Z", JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b, "es"))));
  await page.selectOption("#f-sort", "rating");
  const top = await page.locator(".result").first().innerText();
  ok("Orden por calificación pone primero la mejor", top.includes("4.9"));
  await page.locator("#filters").getByRole("button", { name: "Solo con fotos de trabajos" }).click();
  ok("'Solo con fotos' excluye cuidadores sin fotos", (await page.locator(".result").count()) === (await page.evaluate(() => FF.data.providers.filter((p) => p.fotos > 0).length)));
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();

  // Detalle y contacto simulado
  await page.fill("#f-q", "Camila");
  await page.locator(".result").first().click();
  ok("Detalle: ruta del prestador y galería con fotos de reemplazo", (await hash(page)) === "#/prestador/p13" && (await page.locator(".gallery .ph").count()) === 6);
  ok("Detalle: nombre, oficio, zona, calificación y servicios", await page.locator(".detail-main").innerText().then((t) => t.includes("Camila Andrade") && t.includes("Manicurista") && t.includes("Norte de Quito") && t.includes("4.9") && t.includes("Manicure")));
  await page.locator("#contact").click();
  const msg = await page.locator(".sheet .quote").innerText();
  ok("Contacto: hoja con mensaje predeterminado con nombre y oficio", msg === "Hola Camila, vi tu perfil de manicurista en Frameflow y quisiera contratar tus servicios.", msg);
  ok("Contacto de ejemplo no abre wa.me (no se escribe a desconocidos)", (await page.locator(".sheet a[href*='wa.me']").count()) === 0);
  await shot(page, "d-contacto");
  await page.keyboard.press("Escape");
  ok("Esc cierra la hoja", (await page.locator(".sheet").count()) === 0);
  await page.locator("#report").click();
  await page.getByRole("button", { name: "Enviar reporte" }).click();
  ok("Reportar perfil confirma con aviso", (await page.locator("#toast").innerText()).includes("Gracias"));
  await page.locator(".stepbar a").click();
  ok("Volver conserva los filtros de la búsqueda", (await hash(page)).includes("q=Camila") && (await page.locator(".result").count()) === 1);

  // Oficios
  await page.locator("#desktop-nav").getByRole("link", { name: "Oficios" }).click();
  ok("Oficios: 17 oficios con conteo", (await page.locator(".oficio-tile").count()) === 17);
  await page.locator(".oficio-tile", { hasText: "Soldador" }).click();
  ok("Oficios → Explorar ya filtrado", (await hash(page)) === "#/explorar?of=soldador" && (await page.locator(".result").count()) === 2);

  // Mi perfil vacío y cómo funciona
  await page.locator("#desktop-nav").getByRole("link", { name: "Mi perfil" }).click();
  ok("Mi perfil sin registro invita a crearlo", (await page.locator("h1").innerText()).includes("Aún no tienes un perfil"));
  await page.locator("#desktop-nav").getByRole("link", { name: "Cómo funciona" }).click();
  ok("Cómo funciona: pasos, comparación y preguntas", (await page.locator(".steps3 li").count()) === 3 && (await page.locator(".pair").count()) === 6 && (await page.locator("details.faq").count()) === 4);
  await shot(page, "d-comofunciona");

  // Crear perfil desde el menú: aparece primero en Explorar
  await go(page, "#/registro/1");
  await page.getByRole("radio", { name: /Electricista/ }).click(); await page.getByRole("button", { name: "Continuar" }).click();
  ok("Registro oculta el menú general", !(await visible(page, "#desktop-nav")) && !(await visible(page, "#topbar")));
  await page.getByRole("button", { name: "Rellenar con datos de ejemplo" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Rellenar con un número de ejemplo" }).click();
  await page.getByRole("button", { name: "Publicar mi perfil" }).click();
  await page.getByRole("link", { name: "Omitir por ahora" }).click();
  await go(page, "#/explorar");
  ok("Tu perfil aparece primero en Explorar con la etiqueta 'Tú'", (await page.locator(".result").first().innerText()).includes("Camila Andrade") && (await page.locator(".result").first().innerText()).includes("Tú"));
  await page.selectOption("#f-sort", "nombre");
  ok("Tu perfil sigue primero con otro orden", (await page.locator(".result").first().innerText()).includes("Tú"));
  await page.reload();
  ok("El perfil se conserva al recargar (localStorage)", await page.evaluate(() => !!FF.state.profile && FF.state.profile.nombre === "Camila Andrade"));
  await page.locator("#desktop-nav").getByRole("link", { name: "Mi perfil" }).click();
  ok("Mi perfil muestra el resumen", (await page.locator("body").innerText()).includes("Camila Andrade") && (await page.locator("body").innerText()).includes("Publicado"));
  await shot(page, "d-miperfil");
  await page.getByRole("button", { name: /Borrar mi perfil/ }).click();
  await page.getByRole("button", { name: "Sí, borrar" }).click();
  ok("Borrar perfil lo elimina", await page.evaluate(() => FF.state.profile === null && !localStorage.getItem("frameflow.perfil.v1")));

  ok("Sin errores de consola en presentación", errors.length === 0, errors.join(" | "));
  ok("Sin peticiones externas de datos", external.length === 0, external.join(" | "));
  await ctx.close();
}

/* ============ 4. Presentación en móvil 360×800 ============ */
section("4. Presentación en móvil 360×800");
{
  const { page, ctx, errors } = await newPage({ width: 360, height: 800 }, "");
  ok("Menú inferior visible con 5 secciones", (await visible(page, "#bottom-nav")) && (await page.locator("#bottom-nav .nav-item").count()) === 5);
  ok("Menú superior de escritorio oculto", !(await visible(page, "#desktop-nav")));
  await audit(page, "Inicio");
  await shot(page, "m-inicio");

  await page.locator("#bottom-nav").getByRole("link", { name: "Explorar" }).click();
  await page.waitForSelector(".result");
  ok("Filtros ocultos hasta pulsar 'Filtros'", !(await visible(page, "#filters")) && (await visible(page, "#f-open")));
  await audit(page, "Explorar");
  await shot(page, "m-explorar");
  await page.locator("#f-open").click();
  await page.waitForTimeout(350);
  ok("Hoja de filtros se abre", await visible(page, "#filters"));
  await audit(page, "Filtros abiertos");
  await shot(page, "m-filtros");
  await page.locator("#filters").getByRole("radio", { name: "Sur" }).click();
  ok("Botón aplicar muestra el número de resultados", /^Ver \d+ resultados?$/.test(await page.locator("#f-apply").innerText()));
  await page.locator("#f-apply").click();
  await page.waitForTimeout(350);
  ok("Hoja de filtros se cierra y el badge cuenta 1 filtro", !(await visible(page, "#filters")) && (await page.locator("#f-badge").innerText()) === "1");
  await page.locator("#f-open").click(); await page.waitForTimeout(350);
  await page.keyboard.press("Escape"); await page.waitForTimeout(350);
  ok("Esc cierra la hoja de filtros", !(await visible(page, "#filters")));

  await page.locator(".result").first().click();
  await audit(page, "Detalle de prestador");
  await shot(page, "m-detalle");
  const btn = await page.locator("#contact").boundingBox();
  ok("Botón de contacto siempre visible sobre el menú inferior", btn.y + btn.height <= 800 - 60 && btn.y > 0);

  for (const h of ["#/oficios", "#/como-funciona", "#/mi-perfil"]) {
    await go(page, h);
    await audit(page, h);
    await shot(page, "m-" + h.slice(2));
  }
  ok("Sin errores de consola en móvil", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* ============ 5. Modo observador ============ */
section("5. Modo observador (?pmv=1&observer=1)");
{
  const { page, ctx } = await newPage({ width: 360, height: 800 }, "?pmv=1&observer=1");
  ok("Cronómetro visible", await visible(page, ".observer-pill"));
  await page.getByRole("link", { name: "Crear mi perfil gratis" }).click();
  await page.getByRole("radio", { name: /Barbero/ }).click(); await page.getByRole("button", { name: "Continuar" }).click();
  await page.fill("#nombre", "Luis Toapanta"); await page.getByRole("radio", { name: "Centro" }).click(); await page.getByRole("button", { name: "Continuar" }).click();
  await page.fill("#wa", "0987654321"); await page.getByRole("button", { name: "Publicar mi perfil" }).click();
  await page.locator(".observer-pill").click();
  const panel = await page.locator(".observer-panel").innerText();
  ok("Registra inicio y fin al llegar a 'Perfil publicado'", !panel.includes("Inicio: —") && !panel.includes("Perfil publicado: —"), panel);
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${passes} correctas, ${failures} con fallo`);
process.exit(failures ? 1 : 0);
