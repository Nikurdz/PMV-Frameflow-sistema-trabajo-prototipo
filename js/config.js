/* Frameflow · Configuración del prototipo */
window.FF = window.FF || {};

FF.config = {
  /* Número de WhatsApp del equipo, en formato internacional y sin "+" (ej. "593998765432").
     Si se deja vacío, WhatsApp abre el selector de chats con el mensaje ya escrito. */
  WHATSAPP_EQUIPO: "",

  /* Enlace público del prototipo que se envía en "Recomendar a otra persona".
     Si se deja vacío se calcula desde la URL actual, en modo prueba (?pmv=1). */
  PROTOTYPE_URL: "",

  /* Mensajes predeterminados (sec. 12.5) */
  MSG_INTERES: "Hola, quiero probar Frameflow cuando esté lista. Mi oficio es: ",
  MSG_RECOMENDAR: "Mira esta app gratis para publicar tu oficio y conseguir clientes en Quito:"
};

/* Enlace wa.me (sec. 11.3): con número abre ese chat, sin número deja elegir el destinatario. */
FF.waLink = function (numero, texto) {
  var base = numero ? "https://wa.me/" + String(numero).replace(/\D/g, "") : "https://wa.me/";
  return base + "?text=" + encodeURIComponent(texto);
};

FF.prototypeUrl = function () {
  if (FF.config.PROTOTYPE_URL) return FF.config.PROTOTYPE_URL;
  return location.origin + location.pathname + "?pmv=1";
};

/* Modos: ?pmv=1 = prueba con el segmento (solo las 8 pantallas). ?observer=1 = cronómetro del observador. */
FF.mode = (function () {
  var q = new URLSearchParams(location.search);
  return { pmv: q.get("pmv") === "1", observer: q.get("observer") === "1" };
})();
