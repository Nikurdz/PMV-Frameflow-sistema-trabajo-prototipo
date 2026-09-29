/* Frameflow · Modo observador (?observer=1).
   Herramienta de la prueba con el segmento (sec. 12.10): cronometra el registro y anota los hechos de la hoja de registro.
   No forma parte del producto: no aparece si no se activa. */
window.FF = window.FF || {};

(function () {
  var KEY = "frameflow.observer.v1";
  var data = { startedAt: null, publishedAt: null, commit: false, help: false };
  var open = false, timer = null;

  function load() { try { var r = sessionStorage.getItem(KEY); if (r) data = JSON.parse(r); } catch (e) { /* sin almacenamiento */ } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ } }
  function fmt(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function clock(t) { return t ? new Date(t).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }
  function elapsed() {
    if (!data.startedAt) return "00:00";
    return fmt((data.publishedAt || Date.now()) - data.startedAt);
  }

  function summary() {
    var dur = data.startedAt && data.publishedAt ? fmt(data.publishedAt - data.startedAt) : "no llegó";
    var under3 = data.startedAt && data.publishedAt ? (data.publishedAt - data.startedAt) < 180000 : false;
    return ["Inicio: " + clock(data.startedAt), "Fin (Perfil publicado): " + clock(data.publishedAt), "Duración: " + dur,
      "Menos de 3 min: " + (under3 ? "Sí" : "No"), "¿Pidió ayuda?: " + (data.help ? "Sí" : "No"),
      "¿Llegó a Perfil publicado?: " + (data.publishedAt ? "Sí" : "No"),
      "¿Tocó Sí quiero probarla o Recomendar?: " + (data.commit ? "Sí" : "No")].join("\n");
  }

  function paint() {
    var root = document.getElementById("observer-root");
    if (!FF.mode.observer) { root.innerHTML = ""; return; }
    root.innerHTML = '<div class="observer' + (open ? " open" : "") + '">' +
      '<button type="button" class="observer-pill" data-ob="toggle" aria-expanded="' + open + '">⏱ <span id="ob-time">' + elapsed() + '</span></button>' +
      (open ? '<div class="observer-panel"><p><strong>Modo observador</strong></p>' +
        '<p>Inicio: ' + clock(data.startedAt) + '</p><p>Perfil publicado: ' + clock(data.publishedAt) + '</p>' +
        '<p>Compromiso (WhatsApp): <strong>' + (data.commit ? "Sí" : "No") + '</strong></p>' +
        '<label class="ob-check"><input type="checkbox" data-ob="help"' + (data.help ? " checked" : "") + '> Pidió ayuda</label>' +
        '<div class="ob-actions"><button type="button" class="btn btn-secondary btn-sm" data-ob="copy">Copiar registro</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-ob="reset">Reiniciar prueba</button></div></div>' : "") +
      '</div>';
  }

  FF.observer = {
    event: function (name) {
      if (!FF.mode.observer) return;
      if (name === "start" && !data.startedAt) data.startedAt = Date.now();
      if (name === "published" && data.startedAt && !data.publishedAt) data.publishedAt = Date.now();
      if (name === "commit") data.commit = true;
      save(); paint();
    },
    init: function () {
      if (!FF.mode.observer) return;
      load(); paint();
      clearInterval(timer);
      timer = setInterval(function () {
        var t = document.getElementById("ob-time"); if (t) t.textContent = elapsed();
      }, 1000);
      document.getElementById("observer-root").addEventListener("click", function (e) {
        var b = e.target.closest("[data-ob]"); if (!b) return;
        var a = b.getAttribute("data-ob");
        if (a === "toggle") { open = !open; paint(); }
        if (a === "help") { data.help = b.checked; save(); }
        if (a === "copy") FF.ui.copy(summary(), "Registro copiado");
        if (a === "reset") {
          data = { startedAt: null, publishedAt: null, commit: false, help: false }; save();
          FF.store.reset(); location.hash = "#/"; paint();
        }
      });
    }
  };
})();
