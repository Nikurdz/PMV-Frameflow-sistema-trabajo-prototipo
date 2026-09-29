/* Frameflow · Validaciones (RF-06). Mensajes en español sencillo (RNF-03). */
window.FF = window.FF || {};

FF.validate = {
  nombre: function (raw) {
    var v = String(raw || "").replace(/\s+/g, " ").trim();
    if (!v) return { ok: false, error: "Escribe tu nombre completo." };
    if (v.length < 5 || v.split(" ").length < 2 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(v)) {
      return { ok: false, error: "Escribe tu nombre y tu apellido. Ejemplo: Camila Andrade." };
    }
    if (v.length > 60) return { ok: false, error: "El nombre es muy largo. Usa máximo 60 letras." };
    return { ok: true, value: v };
  },

  /* Número ecuatoriano: 09XXXXXXXX o +593XXXXXXXXX (9 dígitos, móvil empieza en 9). */
  whatsapp: function (raw) {
    var v = String(raw || "").replace(/[\s\-().]/g, "");
    if (!v) return { ok: false, error: "Escribe tu número de WhatsApp." };
    if (/^09\d{8}$/.test(v)) return { ok: true, value: v };
    if (/^\+5939\d{8}$/.test(v)) return { ok: true, value: v };
    return { ok: false, error: "Este número no es válido. Escríbelo así: 0998765432 o +593998765432." };
  },

  /* Devuelve el número en formato internacional sin "+" para wa.me */
  waNumber: function (valor) {
    var v = String(valor || "");
    if (v.charAt(0) === "+") return v.slice(1);
    if (v.indexOf("09") === 0) return "593" + v.slice(1);
    return v;
  }
};
