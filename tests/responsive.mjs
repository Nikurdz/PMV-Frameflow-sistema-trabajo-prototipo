/* Frameflow · Matriz de responsividad.
   Uso:  NODE_PATH=$(npm root -g) node tests/responsive.mjs
   Recorre cada ruta en 14 tamaños de pantalla (celular pequeño, celular, tablet, laptop, monitor grande y celular
   en horizontal) y verifica que ningún botón desaparezca, se salga de la pantalla o quede tapado, que siempre haya
   menú, que no exista scroll horizontal y que las acciones principales se puedan alcanzar. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = process.env.SHOTS_DIR || "";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const file = path.join(ROOT, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const VIEWPORTS = [
  [320, 568], [360, 640], [360, 800], [390, 844], [412, 915], [600, 960], [768, 1024],
  [899, 900], [900, 800], [1024, 768], [1280, 800], [1920, 1080], [800, 360], [640, 360]
];

/* Rutas del modo presentación. El estado del perfil se crea antes para que todas se puedan abrir. */
const ROUTES = [
  "#/", "#/explorar", "#/explorar?zona=norte&mod=domicilio&min=4", "#/explorar?q=zzzz", "#/oficios", "#/como-funciona", "#/mi-perfil",
  "#/prestador/p13", "#/prestador/yo", "#/explorar?pag=2", "#/mi-perfil/editar", "#/registro/1", "#/registro/2", "#/registro/3", "#/publicado", "#/servicios", "#/vista", "#/cierre"
];
const PMV_ROUTES = ["#/", "#/registro/1", "#/registro/2", "#/registro/3", "#/publicado", "#/servicios", "#/vista", "#/cierre"];

const settled = () => !window.FF || !FF.rendered || FF.rendered === location.hash;
const setProfile = () => {
  FF.state.reg = { oficios: ["manicurista", "maquillador", "peluquero", "masajista", "barbero"], oficioOtro: "", nombre: "Camila Andrade", zona: "norte", whatsapp: "0998765432" };
  FF.store.publish();
  // 12 fotos: la cuadrícula y la galería deben resistir el tope
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  FF.state.fotos = Array(12).fill(png);
  FF.reviews.add("yo", { autor: "Marcos Villacís Ordóñez de la Torre", estrellas: 4, trabajo: "Instalación completa de cocina con acabados", texto: "Un comentario largo para comprobar que el texto se ajusta a la pantalla sin desbordar en ningún tamaño. " .repeat(2) });
};

/* Comprobación dentro de la página. Devuelve la lista de problemas encontrados. */
function inspect({ route, pmv }) {
  const issues = [];
  const vw = window.innerWidth, vh = window.innerHeight;
  const isFocus = /^#\/registro\//.test(route);
  const hidden = (el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return cs.display === "none" || cs.visibility === "hidden" || (r.width === 0 && r.height === 0);
  };

  // A. Sin scroll horizontal
  if (document.documentElement.scrollWidth > vw + 1) issues.push(`scroll horizontal (${document.documentElement.scrollWidth}px > ${vw}px)`);

  // B. Menú general presente y completo (salvo pasos de registro y modo prueba)
  if (!pmv && !isFocus) {
    const nav = document.querySelector(vw >= 900 ? "#desktop-nav" : "#bottom-nav");
    const items = [...nav.querySelectorAll(".nav-item")];
    if (items.length !== 5 || items.some(hidden)) issues.push("menú general incompleto u oculto");
    items.forEach((it) => {
      const r = it.getBoundingClientRect();
      if (r.left < -0.5 || r.right > vw + 0.5) issues.push(`menú «${it.textContent.trim()}» fuera de pantalla`);
      if (r.height < 47.5) issues.push(`menú «${it.textContent.trim()}» de ${Math.round(r.height)}px de alto`);
    });
    const other = document.querySelector(vw >= 900 ? "#bottom-nav" : "#desktop-nav");
    if (!hidden(other)) issues.push("se muestran los dos menús a la vez");
  } else if (isFocus || pmv) {
    if (!hidden(document.querySelector("#bottom-nav"))) issues.push("el menú inferior debería estar oculto");
  }

  // F. Ningún botón desaparece (salvo los que se ocultan a propósito)
  document.querySelectorAll(".btn").forEach((b) => {
    if (b.closest("[hidden], .sr-only, .filters:not(.open)") && vw < 900) return;
    if (b.closest("details:not([open])")) return;
    // por diseño, en escritorio la hoja de filtros pasa a ser una barra lateral y sus botones de hoja se ocultan
    const byDesign = vw >= 900 && ["f-open", "f-close", "f-apply"].includes(b.id);
    if (hidden(b) && !byDesign) issues.push(`botón desaparecido «${(b.textContent || b.id).trim().slice(0, 30)}»`);
  });

  // C + D. Elementos interactivos dentro de pantalla y sin nada encima
  const sel = "a[href], button, input, select, textarea, summary, [role=radio]";
  document.querySelectorAll(sel).forEach((el) => {
    if (el.closest(".sr-only, .skip-link, [hidden]") || el.classList.contains("skip-link") || el.type === "file") return;
    if (hidden(el)) return;
    const label = (el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).trim().slice(0, 28);
    let r = el.getBoundingClientRect();
    if (r.left < -0.5 || r.right > vw + 0.5) { issues.push(`«${label}» sale de la pantalla (${Math.round(r.left)}–${Math.round(r.right)} de ${vw})`); return; }
    if (getComputedStyle(el).position !== "fixed") el.scrollIntoView({ block: "center", inline: "nearest" });
    r = el.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), vw - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
    if (r.bottom < 0 || r.top > vh) { issues.push(`«${label}» no se puede llevar a la vista`); return; }
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el.contains(hit) || hit.contains(el) || (el.closest("label") && el.closest("label").contains(hit)))) {
      issues.push(`«${label}» tapado por ${hit ? hit.tagName.toLowerCase() + "." + String(hit.className).split(" ")[0] : "nada"}`);
    }
  });
  window.scrollTo(0, 0);

  // E. Acciones principales alcanzables sin buscar
  // a la vista Y sin nada encima (por ejemplo el menú inferior)
  const inView = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!(r.top >= -0.5 && r.bottom <= vh + 0.5 && r.width > 0)) return false;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (el.contains(hit) || hit.contains(el));
  };
  if (/^#\/registro\//.test(route) || route === "#/servicios" || route === "#/mi-perfil/editar") {
    if (!inView(document.querySelector(".cta-bar .btn-primary"))) issues.push("el botón principal (Continuar/Guardar/Publicar) no está visible sin desplazarse");
  }
  if (route === "#/prestador/p13" || route === "#/vista") {
    if (!inView(document.querySelector("#contact"))) issues.push("«Contactar por WhatsApp» no está visible sin desplazarse");
  }
  if (route.startsWith("#/explorar")) {
    if (vw < 900 && !inView(document.querySelector("#f-open"))) issues.push("el botón «Filtros» no está visible");
    // la barra lateral es alta y se desplaza sola (sticky): basta con que su inicio esté a la vista
    const fr = document.querySelector("#filters").getBoundingClientRect();
    if (vw >= 900 && !(fr.top >= 0 && fr.top < vh - 120 && fr.width > 200)) issues.push("la barra de filtros no está visible");
    if (!inView(document.querySelector("#f-q"))) issues.push("el buscador no está visible");
  }
  if (route === "#/") {
    const cta = document.querySelector(".hero-actions .btn");
    if (!inView(cta) && vh >= 560) issues.push("el botón «Crear mi perfil gratis» queda fuera de la primera pantalla");
  }
  if (route === "#/cierre") {
    if (!inView(document.querySelector("#interes")) && vh >= 640) issues.push("«Sí, quiero probarla» no está en la primera pantalla");
  }

  // I. Altura táctil
  document.querySelectorAll(".btn, .chip, .iconbtn, .input, .slot-add").forEach((el) => {
    if (hidden(el) || el.closest(".sr-only") || el.classList.contains("chip-removable")) return;
    const h = el.getBoundingClientRect().height;
    if (h < 47.5) issues.push(`«${(el.textContent || el.className).trim().slice(0, 24)}» mide ${Math.round(h)}px de alto (< 48)`);
  });
  return issues;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0, checks = 0;
const report = (vp, route, issues) => {
  checks++;
  if (issues.length) { failures++; console.log(`  FAIL ${vp} ${route}\n       - ${[...new Set(issues)].join("\n       - ")}`); }
};

async function visit(page, route, pmv) {
  await page.evaluate((h) => { location.hash = h; }, route);
  await page.waitForFunction(settled);
  await page.waitForTimeout(380);       // termina la animación de deslizamiento
  return page.evaluate(inspect, { route, pmv });
}

for (const [w, h] of VIEWPORTS) {
  const vp = `${w}x${h}`;
  console.log(`\n${vp}`);

  for (const pmv of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "es-EC", hasTouch: w < 900 });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE + (pmv ? "?pmv=1" : ""));
    await page.waitForFunction(settled);
    await page.evaluate(setProfile);

    for (const route of pmv ? PMV_ROUTES : ROUTES) {
      report(vp + (pmv ? " pmv" : ""), route, await visit(page, route, pmv));
    }

    if (!pmv) {
      // G. Hoja de filtros abierta (celular): todos sus botones alcanzables
      if (w < 900) {
        await visit(page, "#/explorar", false);
        await page.locator("#f-open").click();
        await page.waitForTimeout(400);
        const issues = await page.evaluate(() => {
          const out = [], vw = innerWidth, vh = innerHeight, panel = document.querySelector("#filters");
          const pr = panel.getBoundingClientRect();
          if (pr.top < -0.5 || pr.bottom > vh + 0.5) out.push(`la hoja de filtros no cabe en pantalla (${Math.round(pr.top)}–${Math.round(pr.bottom)} de ${vh})`);
          for (const id of ["f-close", "f-clear", "f-apply"]) {
            const el = document.getElementById(id); el.scrollIntoView({ block: "center" });
            const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, Math.min(Math.max(r.top + r.height / 2, 1), vh - 1));
            if (r.width === 0 || r.left < 0 || r.right > vw || r.bottom > vh + 0.5 || r.top < -0.5 || !(el.contains(hit) || hit.contains(el))) out.push(`«${id}» no es alcanzable con la hoja abierta`);
          }
          const last = [...panel.querySelectorAll(".chip")].pop(); last.scrollIntoView({ block: "center" });
          const lr = last.getBoundingClientRect(), lh = document.elementFromPoint(lr.left + lr.width / 2, Math.min(Math.max(lr.top + lr.height / 2, 1), vh - 1));
          if (!(last.contains(lh) || lh.contains(last))) out.push("el último filtro queda tapado al desplazarse dentro de la hoja");
          return out;
        });
        report(vp, "filtros abiertos", issues);
        if (SHOTS && (w === 360 || w === 800)) await page.screenshot({ path: path.join(SHOTS, `r-filtros-${vp}.png`) });
        await page.keyboard.press("Escape");
      }

      // H. Hoja para dejar una opinión: estrellas, campos y botones alcanzables
      await visit(page, "#/prestador/p13", false);
      await page.locator("#add-review").click();
      await page.waitForTimeout(300);
      const rvIssues = await page.evaluate(() => {
        const out = [], vw = innerWidth, vh = innerHeight, sh = document.querySelector(".sheet");
        if (!sh) return ["la hoja de opinión no se abrió"];
        for (const b of sh.querySelectorAll("button, input, textarea")) {
          b.scrollIntoView({ block: "center" });
          const r = b.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, Math.min(Math.max(r.top + r.height / 2, 1), vh - 1));
          const name = (b.getAttribute("aria-label") || b.textContent || b.id).trim().slice(0, 24);
          if (r.left < 0 || r.right > vw || r.top < 0 || r.bottom > vh + 0.5 || !(b.contains(hit) || hit.contains(b))) out.push(`«${name}» de la hoja de opinión no es alcanzable`);
          if (b.tagName === "BUTTON" && r.height < 47.5) out.push(`«${name}» mide ${Math.round(r.height)}px de alto`);
        }
        if (sh.scrollWidth > sh.clientWidth + 1) out.push("la hoja de opinión se desborda horizontalmente");
        return out;
      });
      report(vp, "hoja de opinión", rvIssues);
      if (SHOTS && (w === 360 || w === 1280)) await page.screenshot({ path: path.join(SHOTS, `r-opinion-${vp}.png`) });
      await page.keyboard.press("Escape");

      if (SHOTS) for (const [r, n] of [["#/", "inicio"], ["#/explorar", "explorar"], ["#/prestador/p13", "detalle"], ["#/mi-perfil/editar", "editar"], ["#/servicios", "fotos"]]) {
        await visit(page, r, false); await page.screenshot({ path: path.join(SHOTS, `r-${n}-${vp}.png`) });
      }
    }
    if (errors.length) report(vp, "consola", errors);
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(`\n${checks - failures} de ${checks} combinaciones sin problemas, ${failures} con problemas`);
process.exit(failures ? 1 : 0);
