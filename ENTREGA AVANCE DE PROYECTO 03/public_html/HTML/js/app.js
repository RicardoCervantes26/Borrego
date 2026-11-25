/* ============================================================================
   ACERO & ALTURA — JAVASCRIPT ÚNICO (js/app.js)
   Taller de Programación Web — Avance 03.

   Todo el código está en este archivo externo (no hay scripts dentro del HTML)
   y no usa librerías, frameworks ni rutas externas.

   ÍNDICE:
     BLOQUE 01 — DATOS Y CONSTANTES (tipos de datos, arreglos 1D y 2D)
     BLOQUE 02 — UTILIDADES (formato, almacenamiento, números a letras)
     BLOQUE 03 — CARRITO Y CÁLCULOS (operadores, if / else if, for, forEach)
     BLOQUE 04 — ENTRADA Y SALIDA (ahora con ventanas y avisos dentro de la página)
     BLOQUE 05 — DOM: CREACIÓN DE ELEMENTOS Y AVISOS
     BLOQUE 06 — VENTANAS FLOTANTES (modal) Y CARRITO FLOTANTE
     BLOQUE 07 — MENÚ RESPONSIVO Y NAVEGACIÓN
     BLOQUE 08 — PÁGINA DE COTIZACIÓN
     BLOQUE 09 — PÁGINA DEL COMPROBANTE (BOLETA / FACTURA)
     BLOQUE 10 — PÁGINA DE TÉRMINOS (propiedades de navegación del DOM)
     BLOQUE 11 — PÁGINA DE PRODUCTOS
     BLOQUE 12 — INICIALIZACIÓN
   ============================================================================ */

"use strict";


/* ============================================================================
   BLOQUE 01 — DATOS Y CONSTANTES
   ============================================================================ */

// Constantes numéricas (tipo number)
const IGV = 0.18;
const ENVIO_GRATIS_DESDE = 500;
const CANTIDAD_MAXIMA = 999;
const UNIDADES_DESCUENTO_BAJO = 20;
const UNIDADES_DESCUENTO_ALTO = 50;
const PORCENTAJE_DESCUENTO_BAJO = 0.05;
const PORCENTAJE_DESCUENTO_ALTO = 0.10;

// Constantes de texto (tipo string)
const CLAVE_ALMACEN = "aceroAltura.avance03";
const PREFIJO_VENTANA = "aceroAltura:";

// Arreglos UNIDIMENSIONALES paralelos: la posición i describe un mismo producto
const CODIGOS = ["AC-101", "AC-102", "AC-103", "AD-201", "AD-202", "SE-301", "SE-302", "CI-401"];
const NOMBRES = [
  "Pasta para muro interior",
  "Pintura látex lavable",
  "Mortero de nivelación autonivelante",
  "Pegamento para porcelanato",
  "Epox Adhesivo 32",
  "Silicona neutra Unipega",
  "Sellador universal",
  "Cinta de aluminio"
];
const PRESENTACIONES = [
  "Balde de 20 kg",
  "Galón (3.78 L)",
  "Bolsa de 25 kg",
  "Bolsa de 25 kg",
  "Kit A + B de 5 kg",
  "Cartucho de 280 ml",
  "Cartucho de 300 ml",
  "Rollo de 50 mm × 50 m"
];
const PRECIOS = [38.00, 145.00, 52.00, 42.50, 68.00, 17.90, 34.00, 24.00];   // S/ con IGV incluido

// Arreglo BIDIMENSIONAL: cada fila es [distrito, costo de envío en soles]
const DISTRITOS = [
  ["Recojo en almacén (sin costo)", 0],
  ["Cercado", 10],
  ["Yanahuara", 15],
  ["Cayma", 15],
  ["Cerro Colorado", 20],
  ["Paucarpata", 20],
  ["Socabaya", 25],
  ["Otro distrito de Arequipa", 40]
];

// Arreglo BIDIMENSIONAL: cada fila es [valor, texto visible]
const MEDIOS_PAGO = [
  ["yape", "Yape"],
  ["transferencia", "Transferencia bancaria"],
  ["efectivo", "Efectivo (contra entrega o en almacén)"]
];

// Objeto con los datos de la empresa que aparecen en el comprobante
const EMPRESA = {
  nombre: "Acero & Altura",
  ruc: "20123456789",
  direccion: "Av. Principal 540, Cercado — Arequipa, Perú",
  telefono: "(054) 123-456",
  correo: "ventas@aceroyaltura.pe"
};

// Carrito: arreglo BIDIMENSIONAL. Cada fila: [código, nombre, precio unitario, cantidad]
let carrito = [];
let ventanaActiva = null;
let elementoPrevio = null;


/* ============================================================================
   BLOQUE 02 — UTILIDADES
   ============================================================================ */

const formatoSoles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

function soles(valor) {
  return formatoSoles.format(valor);
}

function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// Almacenamiento: localStorage y, como respaldo, window.name (sobrevive al cambiar de página)
function leerAlmacen() {
  let datos = {};
  try {
    datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) || "{}");
  } catch (error) {
    datos = {};
  }
  if (Object.keys(datos).length === 0 && window.name.indexOf(PREFIJO_VENTANA) === 0) {
    try {
      datos = JSON.parse(window.name.slice(PREFIJO_VENTANA.length));
    } catch (error) {
      datos = {};
    }
  }
  return datos;
}

function guardarAlmacen(datos) {
  const texto = JSON.stringify(datos);
  try {
    localStorage.setItem(CLAVE_ALMACEN, texto);
  } catch (error) {
    // Sin localStorage se usa solo window.name
  }
  window.name = PREFIJO_VENTANA + texto;
}

// Conversión de un monto a letras con arreglos: "CIENTO VEINTITRÉS CON 50/100 SOLES"
const UNIDADES_LETRAS = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS",
  "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
const DECENAS_LETRAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS_LETRAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function menorQueMil(numero) {
  if (numero === 100) {
    return "CIEN";
  }
  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  let texto = CENTENAS_LETRAS[centena];
  if (resto > 0 && resto < 30) {
    texto += " " + UNIDADES_LETRAS[resto];
  } else if (resto >= 30) {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;
    texto += " " + DECENAS_LETRAS[decena];
    if (unidad > 0) {
      texto += " Y " + UNIDADES_LETRAS[unidad];
    }
  }
  return texto.trim();
}

function enteroALetras(numero) {
  if (numero === 0) {
    return "CERO";
  }
  const miles = Math.floor(numero / 1000);
  const resto = numero % 1000;
  let texto = "";
  if (miles === 1) {
    texto = "MIL";
  } else if (miles > 1) {
    texto = menorQueMil(miles).replace(/VEINTIUNO$/, "VEINTIÚN").replace(/UNO$/, "UN") + " MIL";
  }
  if (resto > 0) {
    texto += (texto ? " " : "") + menorQueMil(resto);
  }
  return texto;
}

function montoALetras(monto) {
  const centimosTotales = Math.round(monto * 100);
  const enteros = Math.floor(centimosTotales / 100);
  const centimos = String(centimosTotales % 100).padStart(2, "0");
  return enteroALetras(enteros) + " CON " + centimos + "/100 SOLES";
}


/* ============================================================================
   BLOQUE 03 — CARRITO Y CÁLCULOS
   ============================================================================ */

// Reconstruye cada fila desde los arreglos de productos (evita datos alterados)
function cargarCarrito() {
  const datos = leerAlmacen();
  const filas = Array.isArray(datos.carrito) ? datos.carrito : [];
  carrito = [];
  filas.forEach(function (fila) {
    const indice = CODIGOS.indexOf(fila[0]);
    const cantidad = Number(fila[3]);
    if (indice !== -1 && Number.isInteger(cantidad) && cantidad > 0) {
      carrito.push([CODIGOS[indice], NOMBRES[indice], PRECIOS[indice], Math.min(cantidad, CANTIDAD_MAXIMA)]);
    }
  });
}

function guardarCarrito() {
  const datos = leerAlmacen();
  datos.carrito = carrito;
  guardarAlmacen(datos);
  actualizarContadorFlotante();
}

function agregarAlCarrito(codigo, cantidad) {
  const indice = CODIGOS.indexOf(codigo);
  if (indice === -1 || !Number.isInteger(cantidad) || cantidad < 1) {
    return false;
  }
  let encontrado = false;
  for (let i = 0; i < carrito.length; i++) {
    if (carrito[i][0] === codigo) {
      carrito[i][3] = Math.min(carrito[i][3] + cantidad, CANTIDAD_MAXIMA);
      encontrado = true;
      break;
    }
  }
  if (!encontrado) {
    carrito.push([codigo, NOMBRES[indice], PRECIOS[indice], Math.min(cantidad, CANTIDAD_MAXIMA)]);
  }
  guardarCarrito();
  return true;
}

function cambiarCantidad(codigo, cantidad) {
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return;
  }
  carrito.forEach(function (fila) {
    if (fila[0] === codigo) {
      fila[3] = Math.min(cantidad, CANTIDAD_MAXIMA);
    }
  });
  guardarCarrito();
}

function quitarDelCarrito(codigo) {
  let i = 0;
  while (i < carrito.length) {
    if (carrito[i][0] === codigo) {
      carrito.splice(i, 1);
    } else {
      i++;
    }
  }
  guardarCarrito();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
}

function contarUnidades() {
  let unidades = 0;
  for (let i = 0; i < carrito.length; i++) {
    unidades += carrito[i][3];
  }
  return unidades;
}

// Regla de descuento por volumen (estructura de decisión múltiple)
function porcentajeDescuento(unidades) {
  if (unidades >= UNIDADES_DESCUENTO_ALTO) {
    return PORCENTAJE_DESCUENTO_ALTO;
  } else if (unidades >= UNIDADES_DESCUENTO_BAJO) {
    return PORCENTAJE_DESCUENTO_BAJO;
  } else {
    return 0;
  }
}

// Cálculo de totales. Los precios ya incluyen IGV: se separa la base imponible del impuesto.
function calcularTotales(indiceDistrito) {
  const unidades = contarUnidades();
  let subtotal = 0;
  carrito.forEach(function (fila) {
    subtotal += fila[2] * fila[3];
  });
  subtotal = redondear(subtotal);

  const porcentaje = porcentajeDescuento(unidades);
  const descuento = redondear(subtotal * porcentaje);
  const despuesDescuento = redondear(subtotal - descuento);

  let envio = 0;
  if (carrito.length > 0 && despuesDescuento < ENVIO_GRATIS_DESDE) {
    envio = DISTRITOS[indiceDistrito] ? DISTRITOS[indiceDistrito][1] : 0;
  }

  const total = redondear(despuesDescuento + envio);
  const gravada = redondear(total / (1 + IGV));
  const igv = redondear(total - gravada);

  return {
    unidades: unidades,
    subtotal: subtotal,
    porcentaje: porcentaje,
    descuento: descuento,
    envio: envio,
    total: total,
    gravada: gravada,
    igv: igv
  };
}

// Instrucciones de pago según el medio elegido (estructura switch-case)
function instruccionesPago(medio) {
  let lineas = [];
  switch (medio) {
    case "yape":
      lineas = [
        "Pague con Yape al número 999 999 999 (dato de demostración).",
        "Envíe la captura del pago a ventas@aceroyaltura.pe indicando el número del comprobante."
      ];
      break;
    case "transferencia":
      lineas = [
        "Transfiera a la cuenta corriente 000-0000000-0-00 (dato de demostración).",
        "CCI 000-000-000000000000-00. Envíe el voucher a ventas@aceroyaltura.pe."
      ];
      break;
    case "efectivo":
      lineas = [
        "Pague en efectivo al recibir el pedido o en nuestro almacén de Av. Principal 540, Cercado.",
        "Atención de lunes a sábado, de 8:00 a. m. a 6:00 p. m."
      ];
      break;
    default:
      lineas = ["Comuníquese con el área comercial al (054) 123-456."];
  }
  return lineas;
}


/* ============================================================================
   BLOQUE 04 — ENTRADA Y SALIDA (ahora con ventanas y avisos dentro de la página)
   ============================================================================ */

// (Las preguntas de código y cantidad ahora se resuelven dentro de la página:
//  ver abrirVentanaCantidad en el bloque 06 y crearPanelCodigo en el bloque 08.)


/* ============================================================================
   BLOQUE 05 — DOM: CREACIÓN DE ELEMENTOS Y AVISOS
   ============================================================================ */

// Crea un elemento: el texto siempre se inserta con textContent (nunca como HTML)
function el(etiqueta, propiedades) {
  const nodo = document.createElement(etiqueta);
  const props = propiedades || {};
  Object.keys(props).forEach(function (clave) {
    if (clave === "texto") {
      nodo.textContent = props[clave];
    } else if (clave === "clase") {
      nodo.className = props[clave];
    } else {
      nodo.setAttribute(clave, props[clave]);
    }
  });
  for (let i = 2; i < arguments.length; i++) {
    nodo.append(arguments[i]);
  }
  return nodo;
}

function mostrarAviso(texto) {
  const anterior = document.querySelector(".aviso-flotante");
  if (anterior) {
    anterior.remove();
  }
  const aviso = el("div", { clase: "aviso-flotante", role: "status", texto: texto });
  document.body.append(aviso);
  setTimeout(function () {
    aviso.remove();
  }, 3200);
}

function valorRadio(nombre) {
  const marcado = document.querySelector('input[name="' + nombre + '"]:checked');
  return marcado ? marcado.value : "";
}


/* ============================================================================
   BLOQUE 06 — VENTANAS FLOTANTES (MODAL) Y CARRITO FLOTANTE
   ============================================================================ */

// Abre una ventana flotante accesible. botones: [{ texto, clase, accion }]
function abrirVentana(titulo, cuerpo, botones) {
  cerrarVentana();
  elementoPrevio = document.activeElement;

  const botonCerrar = el("button", { type: "button", clase: "ventana-cerrar", "aria-label": "Cerrar ventana", texto: "×" });
  const cabecera = el("div", { clase: "ventana-cabecera" }, el("h2", { id: "ventana-titulo", texto: titulo }), botonCerrar);
  const contenido = el("div", { clase: "ventana-cuerpo" }, cuerpo);
  const pie = el("div", { clase: "ventana-pie" });

  (botones || [{ texto: "Cerrar" }]).forEach(function (definicion) {
    const boton = el("button", { type: "button", clase: "boton " + (definicion.clase || ""), texto: definicion.texto });
    boton.addEventListener("click", function () {
      if (definicion.validar && !definicion.validar()) {
        return;                                   // la ventana sigue abierta
      }
      cerrarVentana();
      if (definicion.accion) {
        definicion.accion();
      }
    });
    pie.append(boton);
  });

  const ventana = el("div", { clase: "ventana", role: "dialog", "aria-modal": "true", "aria-labelledby": "ventana-titulo" },
    cabecera, contenido, pie);
  const fondo = el("div", { clase: "ventana-fondo" }, ventana);

  fondo.addEventListener("click", function (evento) {
    if (evento.target === fondo) {
      cerrarVentana();
    }
  });
  botonCerrar.addEventListener("click", cerrarVentana);

  document.body.append(fondo);
  document.body.classList.add("ventana-abierta");
  ventanaActiva = fondo;
  botonCerrar.focus();
}

function cerrarVentana() {
  if (!ventanaActiva) {
    return;
  }
  ventanaActiva.remove();
  ventanaActiva = null;
  document.body.classList.remove("ventana-abierta");
  if (elementoPrevio && typeof elementoPrevio.focus === "function") {
    elementoPrevio.focus();
  }
}

// Ventana dentro de la página para elegir la cantidad (reemplaza al cuadro nativo del navegador)
function abrirVentanaCantidad(codigo, alAgregar) {
  const i = CODIGOS.indexOf(codigo);
  if (i === -1) {
    return;
  }
  const precio = PRECIOS[i];

  const entrada = el("input", { type: "number", min: "1", max: String(CANTIDAD_MAXIMA), value: "1",
    id: "ventana-cantidad", inputmode: "numeric", "aria-label": "Cantidad de " + NOMBRES[i] });
  const menos = el("button", { type: "button", clase: "paso-cantidad", "aria-label": "Una unidad menos", texto: "−" });
  const mas = el("button", { type: "button", clase: "paso-cantidad", "aria-label": "Una unidad más", texto: "+" });
  const selector = el("div", { clase: "selector-cantidad" }, menos, entrada, mas);

  const error = el("p", { clase: "error-cantidad", role: "alert" });
  const subtotal = el("strong", { clase: "cantidad-subtotal" });
  const descuento = el("span", { clase: "cantidad-descuento" });
  const resumen = el("p", { clase: "cantidad-resumen" }, document.createTextNode("Subtotal: "), subtotal, descuento);

  // Valor actual limitado a un entero válido (o 0 si no lo es)
  function valorValido() {
    const n = Number(entrada.value);
    return Number.isInteger(n) && n >= 1 && n <= CANTIDAD_MAXIMA ? n : 0;
  }

  function actualizar() {
    const n = valorValido();
    error.textContent = n === 0 ? "Escriba un número entero entre 1 y " + CANTIDAD_MAXIMA + "." : "";
    entrada.classList.toggle("invalido", n === 0);
    subtotal.textContent = n === 0 ? "—" : soles(precio * n);
    if (n >= UNIDADES_DESCUENTO_ALTO) {
      descuento.textContent = " · " + Math.round(PORCENTAJE_DESCUENTO_ALTO * 100) + " % de descuento por volumen";
    } else if (n >= UNIDADES_DESCUENTO_BAJO) {
      descuento.textContent = " · " + Math.round(PORCENTAJE_DESCUENTO_BAJO * 100) + " % de descuento por volumen";
    } else {
      descuento.textContent = " · desde " + UNIDADES_DESCUENTO_BAJO + " unidades hay descuento";
    }
  }

  function fijar(n) {
    entrada.value = String(Math.min(Math.max(n, 1), CANTIDAD_MAXIMA));
    actualizar();
    entrada.focus();
  }

  menos.addEventListener("click", function () { fijar((valorValido() || 1) - 1); });
  mas.addEventListener("click", function () { fijar((valorValido() || 0) + 1); });
  entrada.addEventListener("input", actualizar);

  // Cantidades frecuentes con un solo clic
  const atajos = el("div", { clase: "atajos-cantidad", role: "group", "aria-label": "Cantidades frecuentes" });
  [1, 5, 10, UNIDADES_DESCUENTO_BAJO, UNIDADES_DESCUENTO_ALTO].forEach(function (n) {
    const atajo = el("button", { type: "button", clase: "atajo", texto: String(n) });
    atajo.addEventListener("click", function () { fijar(n); });
    atajos.append(atajo);
  });

  const cuerpo = el("div", { clase: "ventana-cantidad" },
    el("p", { clase: "cantidad-producto", texto: CODIGOS[i] + " · " + NOMBRES[i] }),
    el("p", { clase: "cantidad-detalle", texto: PRESENTACIONES[i] + " — " + soles(precio) + " c/u (IGV incluido)" }),
    el("label", { for: "ventana-cantidad", clase: "cantidad-etiqueta", texto: "¿Cuántas unidades desea?" }),
    selector, atajos, error, resumen);

  abrirVentana("Agregar a la cotización", cuerpo, [
    { texto: "Cancelar" },
    { texto: "Agregar", clase: "boton-acento",
      validar: function () { actualizar(); return valorValido() > 0; },
      accion: function () { alAgregar(valorValido()); } }
  ]);

  // Enter confirma, igual que pulsar «Agregar»
  entrada.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      ventanaActiva.querySelector(".ventana-pie .boton-acento").click();
    }
  });

  actualizar();
  entrada.focus();
  entrada.select();
}

// Pregunta de «sí / no» dentro de la página (reemplaza al cuadro nativo confirm)
function confirmarEnVentana(titulo, contenido, textoSi, alAceptar, textoNo) {
  const cuerpo = typeof contenido === "string" ? el("p", { texto: contenido }) : contenido;
  abrirVentana(titulo, cuerpo, [
    { texto: textoNo || "Cancelar" },
    { texto: textoSi || "Aceptar", clase: "boton-acento", accion: alAceptar }
  ]);
}

// Lista de productos y totales para mostrar dentro de una ventana
function construirResumen(totales) {
  const lista = el("ul", { clase: "lista-resumen" });
  carrito.forEach(function (fila) {
    lista.append(el("li", {
      texto: fila[3] + " × " + fila[1] + " — " + soles(fila[2] * fila[3])
    }));
  });
  const datos = el("dl", { clase: "resumen-lista" });
  const filas = [
    ["Subtotal", soles(totales.subtotal)],
    ["Descuento (" + Math.round(totales.porcentaje * 100) + " %)", "− " + soles(totales.descuento)],
    ["Envío", soles(totales.envio)],
    ["Total a pagar", soles(totales.total)]
  ];
  filas.forEach(function (par) {
    datos.append(el("div", {}, el("dt", { texto: par[0] }), el("dd", { texto: par[1] })));
  });
  return el("div", {}, lista, datos);
}

function crearCarritoFlotante() {
  const boton = el("button", { type: "button", clase: "carrito-flotante", id: "carrito-flotante", title: "Ver mi cotización" },
    el("span", { texto: "Mi cotización" }),
    el("span", { clase: "carrito-contador", id: "carrito-contador", texto: "0" }));
  boton.addEventListener("click", abrirVentanaCarrito);
  document.body.append(boton);
  actualizarContadorFlotante();
}

function actualizarContadorFlotante() {
  const contador = document.getElementById("carrito-contador");
  if (contador) {
    contador.textContent = String(contarUnidades());
  }
}

function abrirVentanaCarrito() {
  if (carrito.length === 0) {
    abrirVentana("Mi cotización", el("p", { texto: "Todavía no agregó productos. Explore el catálogo y use el botón «Agregar a la cotización»." }), [
      { texto: "Ir al catálogo", clase: "boton-acento", accion: function () { window.location.href = "productos.html"; } },
      { texto: "Cerrar" }
    ]);
    return;
  }
  abrirVentana("Mi cotización", construirResumen(calcularTotales(0)), [
    { texto: "Vaciar", accion: confirmarVaciado },
    { texto: "Ir a cotizar", clase: "boton-acento", accion: function () { window.location.href = "cotizacion.html"; } }
  ]);
}

function confirmarVaciado() {
  confirmarEnVentana("Vaciar cotización", "¿Desea quitar todos los productos de la cotización?", "Sí, vaciar", function () {
    vaciarCarrito();
    if (document.body.dataset.pagina === "cotizacion") {
      renderCotizacion();
    }
    actualizarContadorFlotante();
    mostrarAviso("La cotización quedó vacía.");
  });
}


/* ============================================================================
   BLOQUE 07 — MENÚ RESPONSIVO Y NAVEGACIÓN
   ============================================================================ */

function iniciarMenuResponsivo() {
  const control = document.getElementById("control-menu");
  const boton = document.querySelector(".boton-menu");
  const menu = document.querySelector(".nav-principal");
  if (!control || !boton || !menu) {
    return;
  }

  menu.id = menu.id || "menu-principal";
  boton.setAttribute("role", "button");
  boton.setAttribute("tabindex", "0");
  boton.setAttribute("aria-controls", menu.id);

  function sincronizar() {
    boton.setAttribute("aria-expanded", String(control.checked));
    menu.classList.toggle("abierto", control.checked);
  }

  function cerrarMenu() {
    if (control.checked) {
      control.checked = false;
      sincronizar();
    }
  }

  control.addEventListener("change", sincronizar);

  boton.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      control.checked = !control.checked;
      sincronizar();
    }
  });

  // Se cierra al elegir una opción, con Escape o al ensanchar la ventana
  menu.addEventListener("click", function (evento) {
    if (evento.target.closest("a")) {
      cerrarMenu();
    }
  });
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && control.checked) {
      cerrarMenu();
      boton.focus();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) {
      cerrarMenu();
    }
  });

  sincronizar();
}

// Botón flotante para volver al inicio de la página
function iniciarBotonSubir() {
  const boton = el("button", { type: "button", clase: "boton-subir", "aria-label": "Volver arriba", title: "Volver arriba", texto: "↑" });
  boton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.append(boton);
  window.addEventListener("scroll", function () {
    boton.classList.toggle("visible", window.scrollY > 400);
  });
}

// Escape cierra la ventana; Tab queda atrapado dentro de ella
function iniciarEscuchasGlobales() {
  document.addEventListener("keydown", function (evento) {
    if (!ventanaActiva) {
      return;
    }
    if (evento.key === "Escape") {
      cerrarVentana();
    } else if (evento.key === "Tab") {
      const enfocables = ventanaActiva.querySelectorAll("button, a[href], input, select, textarea");
      if (enfocables.length === 0) {
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });
}


/* ============================================================================
   BLOQUE 08 — PÁGINA DE COTIZACIÓN
   ============================================================================ */

function llenarCatalogo() {
  const cuerpo = document.getElementById("cuerpo-catalogo");
  cuerpo.replaceChildren();
  CODIGOS.forEach(function (codigo, i) {
    const entrada = el("input", { type: "number", min: "1", max: String(CANTIDAD_MAXIMA), value: "1",
      id: "cantidad-" + codigo, "aria-label": "Cantidad de " + NOMBRES[i] });
    const boton = el("button", { type: "button", clase: "boton boton-acento", texto: "Agregar" });
    boton.addEventListener("click", function () {
      const cantidad = Number(entrada.value);
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
        mostrarAviso("Ingrese una cantidad entera entre 1 y " + CANTIDAD_MAXIMA + ".");
        entrada.value = "1";
        entrada.focus();
        return;
      }
      agregarAlCarrito(codigo, cantidad);
      entrada.value = "1";
      renderCotizacion();
      mostrarAviso("Agregado: " + cantidad + " × " + NOMBRES[i]);
    });
    cuerpo.append(el("tr", {},
      el("th", { scope: "row", texto: codigo }),
      el("td", { texto: NOMBRES[i] }),
      el("td", { texto: PRESENTACIONES[i] }),
      el("td", { clase: "celda-precio", texto: soles(PRECIOS[i]) }),
      el("td", {}, entrada),
      el("td", {}, boton)));
  });
}

function llenarSelectores() {
  const distrito = document.getElementById("distrito");
  DISTRITOS.forEach(function (fila, i) {
    const texto = fila[1] === 0 ? fila[0] : fila[0] + " — " + soles(fila[1]);
    distrito.add(new Option(texto, String(i)));
  });
  const pago = document.getElementById("medio-pago");
  MEDIOS_PAGO.forEach(function (fila) {
    pago.add(new Option(fila[1], fila[0]));
  });
}

// El tipo de comprobante cambia las etiquetas y la longitud del documento
function configurarTipoComprobante() {
  const tipo = valorRadio("tipoComprobante");
  const textoDocumento = document.getElementById("texto-documento");
  const textoNombre = document.getElementById("texto-nombre");
  const campo = document.getElementById("documento-cliente");
  switch (tipo) {
    case "factura":
      textoDocumento.textContent = "RUC";
      textoNombre.textContent = "Razón social";
      campo.maxLength = 11;
      campo.placeholder = "11 dígitos (inicia en 10 o 20)";
      break;
    default:
      textoDocumento.textContent = "DNI";
      textoNombre.textContent = "Nombres y apellidos";
      campo.maxLength = 8;
      campo.placeholder = "8 dígitos";
  }
}

function indiceDistritoElegido() {
  return Number(document.getElementById("distrito").value) || 0;
}

function renderCarrito() {
  const cuerpo = document.getElementById("cuerpo-carrito");
  const vacio = document.getElementById("mensaje-vacio");
  const tabla = document.getElementById("tabla-carrito");
  cuerpo.replaceChildren();

  vacio.hidden = carrito.length > 0;
  tabla.hidden = carrito.length === 0;

  carrito.forEach(function (fila) {
    const codigo = fila[0];
    const entrada = el("input", { type: "number", min: "1", max: String(CANTIDAD_MAXIMA), value: String(fila[3]),
      "aria-label": "Cantidad de " + fila[1] });
    entrada.addEventListener("change", function () {
      const nueva = Number(entrada.value);
      if (!Number.isInteger(nueva) || nueva < 1 || nueva > CANTIDAD_MAXIMA) {
        mostrarAviso("Cantidad no válida (1 a " + CANTIDAD_MAXIMA + "). Se mantiene el valor anterior.");
      } else {
        cambiarCantidad(codigo, nueva);
      }
      renderCotizacion();
    });
    const quitar = el("button", { type: "button", clase: "boton", texto: "Quitar" });
    quitar.addEventListener("click", function () {
      confirmarEnVentana("Quitar producto", "¿Quitar «" + fila[1] + "» de la cotización?", "Sí, quitar", function () {
        quitarDelCarrito(codigo);
        renderCotizacion();
        mostrarAviso("Producto quitado.");
      });
    });
    cuerpo.append(el("tr", {},
      el("th", { scope: "row", texto: codigo }),
      el("td", { texto: fila[1] }),
      el("td", { clase: "celda-precio", texto: soles(fila[2]) }),
      el("td", {}, entrada),
      el("td", { clase: "celda-precio", texto: soles(fila[2] * fila[3]) }),
      el("td", {}, quitar)));
  });
}

function renderResumen() {
  const totales = calcularTotales(indiceDistritoElegido());
  document.getElementById("res-unidades").textContent = String(totales.unidades);
  document.getElementById("res-subtotal").textContent = soles(totales.subtotal);
  document.getElementById("res-etiqueta-descuento").textContent =
    "Descuento por volumen (" + Math.round(totales.porcentaje * 100) + " %)";
  document.getElementById("res-descuento").textContent = "− " + soles(totales.descuento);
  document.getElementById("res-envio").textContent = totales.envio === 0 && carrito.length > 0 ? "Sin costo" : soles(totales.envio);
  document.getElementById("res-total").textContent = soles(totales.total);
  document.getElementById("res-gravada").textContent = soles(totales.gravada);
  document.getElementById("res-igv").textContent = soles(totales.igv);
  document.getElementById("pie-subtotal").textContent = soles(totales.subtotal);
}

function renderCotizacion() {
  renderCarrito();
  renderResumen();
}

// Validación del formulario con if / else if; devuelve la lista de observaciones
function validarFormulario() {
  const errores = [];
  const tipo = valorRadio("tipoComprobante");
  const nombre = document.getElementById("nombre-cliente").value.trim();
  const documento = document.getElementById("documento-cliente").value.trim();
  const correo = document.getElementById("correo-cliente").value.trim();
  const telefono = document.getElementById("telefono-cliente").value.trim();

  if (carrito.length === 0) {
    errores.push("Agregue al menos un producto a la cotización.");
  }
  if (nombre.length < 3) {
    errores.push(tipo === "factura" ? "Escriba la razón social (mínimo 3 caracteres)." : "Escriba sus nombres y apellidos (mínimo 3 caracteres).");
  }
  if (tipo === "factura") {
    if (!/^(10|20)\d{9}$/.test(documento)) {
      errores.push("El RUC debe tener 11 dígitos y comenzar con 10 o 20.");
    }
  } else if (!/^\d{8}$/.test(documento)) {
    errores.push("El DNI debe tener exactamente 8 dígitos.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    errores.push("Escriba un correo electrónico válido.");
  }
  if (!/^9\d{8}$/.test(telefono)) {
    errores.push("El teléfono celular debe tener 9 dígitos y comenzar con 9.");
  }
  if (!document.getElementById("acepta-terminos").checked) {
    errores.push("Debe aceptar los términos y condiciones.");
  }
  return errores;
}

function mostrarErrores(errores) {
  const zona = document.getElementById("errores-formulario");
  zona.replaceChildren();
  zona.hidden = errores.length === 0;
  if (errores.length > 0) {
    zona.append(el("strong", { texto: "Revise lo siguiente:" }));
    const lista = el("ul");
    errores.forEach(function (mensaje) {
      lista.append(el("li", { texto: mensaje }));
    });
    zona.append(lista);
  }
}

function generarComprobante() {
  const errores = validarFormulario();
  mostrarErrores(errores);
  if (errores.length > 0) {
    mostrarAviso("Hay " + errores.length + " observación(es). Revise los campos marcados.");
    document.getElementById("errores-formulario").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const tipo = valorRadio("tipoComprobante");
  const totales = calcularTotales(indiceDistritoElegido());
  const nombreTipo = tipo === "factura" ? "factura" : "boleta";
  confirmarEnVentana("Generar " + nombreTipo, construirResumen(totales), "Generar " + nombreTipo, function () {
    emitirComprobante(tipo, nombreTipo, totales);
  }, "Revisar");
}

function emitirComprobante(tipo, nombreTipo, totales) {
  const datos = leerAlmacen();
  const correlativos = datos.correlativos || { boleta: 0, factura: 0 };
  correlativos[nombreTipo] = (correlativos[nombreTipo] || 0) + 1;
  const serie = tipo === "factura" ? "F001" : "B001";
  const numero = String(correlativos[nombreTipo]).padStart(6, "0");

  datos.correlativos = correlativos;
  datos.comprobante = {
    tipo: nombreTipo,
    serie: serie,
    numero: numero,
    fecha: new Date().toISOString(),
    cliente: {
      nombre: document.getElementById("nombre-cliente").value.trim(),
      documento: document.getElementById("documento-cliente").value.trim(),
      correo: document.getElementById("correo-cliente").value.trim(),
      telefono: document.getElementById("telefono-cliente").value.trim()
    },
    distrito: DISTRITOS[indiceDistritoElegido()][0],
    pago: document.getElementById("medio-pago").value,
    items: carrito.map(function (fila) { return fila.slice(); }),
    totales: totales
  };
  carrito = [];
  datos.carrito = carrito;
  guardarAlmacen(datos);

  window.location.href = "boleta.html";
}

// Panel desplegable «Agregar por código» (se abre debajo del botón, sin cuadros del navegador)
function crearPanelCodigo(boton) {
  const lista = el("datalist", { id: "lista-codigos" });
  CODIGOS.forEach(function (codigo, i) {
    lista.append(el("option", { value: codigo, label: NOMBRES[i] }));
  });

  const codigoEntrada = el("input", { type: "text", id: "codigo-rapido", list: "lista-codigos", maxlength: "6",
    placeholder: "Ej.: AC-101", autocomplete: "off" });
  const cantidadEntrada = el("input", { type: "number", id: "cantidad-rapida", min: "1", max: String(CANTIDAD_MAXIMA), value: "1" });
  const vista = el("p", { clase: "vista-codigo", role: "status", texto: "Escriba o elija un código del catálogo." });
  const error = el("p", { clase: "error-cantidad", role: "alert" });
  const agregar = el("button", { type: "button", clase: "boton boton-acento", texto: "Agregar" });
  const cerrar = el("button", { type: "button", clase: "boton", texto: "Cerrar" });

  const panel = el("div", { clase: "panel-codigo", id: "panel-codigo", hidden: "" },
    el("div", { clase: "campo-doble" },
      el("div", { clase: "campo" }, el("label", { for: "codigo-rapido", texto: "Código del producto" }), codigoEntrada, lista),
      el("div", { clase: "campo" }, el("label", { for: "cantidad-rapida", texto: "Cantidad" }), cantidadEntrada)),
    vista, error,
    el("div", { clase: "acciones-formulario" }, agregar, cerrar));

  boton.setAttribute("aria-controls", "panel-codigo");
  boton.setAttribute("aria-expanded", "false");
  boton.parentNode.after(panel);

  function indiceCodigo() {
    return CODIGOS.indexOf(codigoEntrada.value.trim().toUpperCase());
  }

  function refrescarVista() {
    const i = indiceCodigo();
    error.textContent = "";
    if (codigoEntrada.value.trim() === "") {
      vista.textContent = "Escriba o elija un código del catálogo.";
    } else if (i === -1) {
      vista.textContent = "Ese código todavía no coincide con ningún producto.";
    } else {
      vista.textContent = NOMBRES[i] + " · " + PRESENTACIONES[i] + " · " + soles(PRECIOS[i]) + " c/u";
    }
  }

  function alternar(abrir) {
    panel.hidden = !abrir;
    boton.setAttribute("aria-expanded", String(abrir));
    if (abrir) {
      codigoEntrada.focus();
    } else {
      boton.focus();
    }
  }

  function agregarDesdePanel() {
    const i = indiceCodigo();
    const cantidad = Number(cantidadEntrada.value);
    if (i === -1) {
      error.textContent = "El código «" + codigoEntrada.value.trim().toUpperCase() + "» no existe. Códigos: " + CODIGOS.join(", ") + ".";
      codigoEntrada.focus();
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      error.textContent = "Escriba una cantidad entera entre 1 y " + CANTIDAD_MAXIMA + ".";
      cantidadEntrada.focus();
      return;
    }
    agregarAlCarrito(CODIGOS[i], cantidad);
    renderCotizacion();
    mostrarAviso("Agregado: " + cantidad + " × " + NOMBRES[i]);
    codigoEntrada.value = "";
    cantidadEntrada.value = "1";
    refrescarVista();
    codigoEntrada.focus();
  }

  boton.addEventListener("click", function () { alternar(panel.hidden); });
  cerrar.addEventListener("click", function () { alternar(false); });
  agregar.addEventListener("click", agregarDesdePanel);
  codigoEntrada.addEventListener("input", refrescarVista);
  [codigoEntrada, cantidadEntrada].forEach(function (campo) {
    campo.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter") {
        evento.preventDefault();
        agregarDesdePanel();
      } else if (evento.key === "Escape") {
        alternar(false);
      }
    });
  });
}

function iniciarCotizacion() {
  llenarCatalogo();
  llenarSelectores();
  configurarTipoComprobante();
  renderCotizacion();

  document.querySelectorAll('input[name="tipoComprobante"]').forEach(function (radio) {
    radio.addEventListener("change", configurarTipoComprobante);
  });
  document.getElementById("distrito").addEventListener("change", renderResumen);

  crearPanelCodigo(document.getElementById("boton-agregar-codigo"));

  document.getElementById("boton-ver-resumen").addEventListener("click", function () {
    if (carrito.length === 0) {
      mostrarAviso("Primero agregue productos a la cotización.");
      return;
    }
    abrirVentana("Resumen del pedido", construirResumen(calcularTotales(indiceDistritoElegido())), [
      { texto: "Seguir editando" },
      { texto: "Generar comprobante", clase: "boton-acento", accion: function () {
        document.getElementById("formulario-comprobante").requestSubmit();
      } }
    ]);
  });

  document.getElementById("boton-vaciar").addEventListener("click", function () {
    if (carrito.length === 0) {
      mostrarAviso("La cotización ya está vacía.");
      return;
    }
    confirmarVaciado();
  });

  document.getElementById("formulario-comprobante").addEventListener("submit", function (evento) {
    evento.preventDefault();
    generarComprobante();
  });
}


/* ============================================================================
   BLOQUE 09 — PÁGINA DEL COMPROBANTE (BOLETA / FACTURA)
   ============================================================================ */

function filaDato(titulo, valor) {
  return el("div", {}, el("dt", { texto: titulo }), el("dd", { texto: valor }));
}

function renderComprobante(comprobante) {
  const esFactura = comprobante.tipo === "factura";
  const fecha = new Date(comprobante.fecha);
  const nombrePago = MEDIOS_PAGO.filter(function (fila) { return fila[0] === comprobante.pago; })[0];

  const cabecera = el("header", { clase: "comprobante-cabecera" },
    el("div", { clase: "comprobante-empresa" },
      el("img", { src: "imagenes/logo.png", alt: "Logotipo de Acero & Altura", width: "64", height: "64" }),
      el("div", {},
        el("strong", { texto: EMPRESA.nombre }),
        el("p", { texto: EMPRESA.direccion }),
        el("p", { texto: "Tel. " + EMPRESA.telefono + " · " + EMPRESA.correo }))),
    el("div", { clase: "comprobante-caja" },
      el("span", { texto: "RUC " + EMPRESA.ruc }),
      el("strong", { texto: esFactura ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA" }),
      el("span", { texto: comprobante.serie + "-" + comprobante.numero })));

  const datos = el("dl", { clase: "comprobante-datos" },
    filaDato("Fecha de emisión", fecha.toLocaleDateString("es-PE") + " " + fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })),
    filaDato(esFactura ? "Razón social" : "Cliente", comprobante.cliente.nombre),
    filaDato(esFactura ? "RUC" : "DNI", comprobante.cliente.documento),
    filaDato("Correo", comprobante.cliente.correo),
    filaDato("Teléfono", comprobante.cliente.telefono),
    filaDato("Entrega", comprobante.distrito),
    filaDato("Medio de pago", nombrePago ? nombrePago[1] : comprobante.pago),
    filaDato("Moneda", "Soles (PEN)"));

  const cuerpoTabla = el("tbody");
  comprobante.items.forEach(function (fila) {
    const indice = CODIGOS.indexOf(fila[0]);
    const presentacion = indice !== -1 ? " · " + PRESENTACIONES[indice] : "";
    cuerpoTabla.append(el("tr", {},
      el("td", { clase: "num", texto: String(fila[3]) }),
      el("th", { scope: "row", texto: fila[0] }),
      el("td", { texto: fila[1] + presentacion }),
      el("td", { clase: "num", texto: soles(fila[2]) }),
      el("td", { clase: "num", texto: soles(fila[2] * fila[3]) })));
  });
  const tabla = el("table", { clase: "tabla-datos" },
    el("caption", { texto: "Detalle del comprobante" }),
    el("thead", {}, el("tr", {},
      el("th", { scope: "col", clase: "num", texto: "Cant." }),
      el("th", { scope: "col", texto: "Código" }),
      el("th", { scope: "col", texto: "Descripción" }),
      el("th", { scope: "col", clase: "num", texto: "P. unit." }),
      el("th", { scope: "col", clase: "num", texto: "Importe" }))),
    cuerpoTabla);

  const t = comprobante.totales;
  const totales = el("dl", { clase: "comprobante-totales" },
    filaDato("Subtotal", soles(t.subtotal)),
    filaDato("Descuento por volumen (" + Math.round(t.porcentaje * 100) + " %)", "− " + soles(t.descuento)),
    filaDato("Envío", soles(t.envio)),
    filaDato("Op. gravada", soles(t.gravada)),
    filaDato("IGV (18 %)", soles(t.igv)));
  totales.append(el("div", { clase: "total-final" }, el("dt", { texto: "TOTAL" }), el("dd", { texto: soles(t.total) })));

  const son = el("p", { clase: "comprobante-son", texto: "SON: " + montoALetras(t.total) });
  const pie = el("footer", { clase: "comprobante-pie" },
    el("p", { texto: "Documento de demostración elaborado con fines académicos para el curso Taller de Programación Web. No tiene validez tributaria." }),
    el("p", { texto: "Los precios incluyen IGV. Consulte los términos y condiciones en terminos.html." }));

  const zona = document.getElementById("zona-comprobante");
  zona.replaceChildren(el("article", { clase: "comprobante" }, cabecera, datos, tabla, totales, son, pie));
}

function iniciarBoleta() {
  const datos = leerAlmacen();
  const comprobante = datos.comprobante;
  const acciones = document.getElementById("acciones-comprobante");

  if (!comprobante || !Array.isArray(comprobante.items)) {
    document.getElementById("zona-comprobante").replaceChildren(
      el("p", { clase: "mensaje-vacio", texto: "Todavía no se generó ningún comprobante. Arme su cotización y complete los datos para emitirlo." }));
    acciones.hidden = true;
    return;
  }

  renderComprobante(comprobante);

  document.getElementById("boton-imprimir").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("boton-instrucciones").addEventListener("click", function () {
    const lineas = instruccionesPago(comprobante.pago);
    const lista = el("ul", { clase: "lista-resumen" });
    lineas.forEach(function (linea) {
      lista.append(el("li", { texto: linea }));
    });
    abrirVentana("Cómo pagar su pedido", el("div", {},
      el("p", { texto: "Total a pagar: " + soles(comprobante.totales.total) }), lista), [{ texto: "Entendido", clase: "boton-acento" }]);
  });

  document.getElementById("boton-nueva").addEventListener("click", function (evento) {
    evento.preventDefault();
    confirmarEnVentana("Nueva cotización", "El comprobante actual dejará de mostrarse. ¿Desea iniciar una nueva cotización?", "Sí, empezar", function () {
      delete datos.comprobante;
      guardarAlmacen(datos);
      window.location.href = "cotizacion.html";
    });
  });
}


/* ============================================================================
   BLOQUE 10 — PÁGINA DE TÉRMINOS (propiedades de navegación del DOM)
   ============================================================================ */

function iniciarTerminos() {
  const contenedor = document.getElementById("contenido-terminos");
  const indice = document.getElementById("indice-terminos");
  const secciones = contenedor.querySelectorAll(".termino");

  secciones.forEach(function (seccion, i) {
    const titulo = seccion.firstElementChild;                  // primer hijo: el encabezado
    const resumen = titulo.nextElementSibling;                 // hermano siguiente: el primer párrafo
    seccion.id = "termino-" + (i + 1);

    const enlace = el("a", { href: "#" + seccion.id, texto: titulo.textContent });
    if (resumen) {
      enlace.title = resumen.textContent.slice(0, 90) + "…";
    }
    indice.append(el("li", {}, enlace));

    // Navegación entre secciones con previousElementSibling y nextElementSibling
    const navegacion = el("p", { clase: "navegacion-termino" });
    const anterior = seccion.previousElementSibling;
    const siguiente = seccion.nextElementSibling;
    if (anterior && anterior.classList.contains("termino")) {
      navegacion.append(el("a", { href: "#" + anterior.id, texto: "← " + anterior.firstElementChild.textContent }));
    }
    if (siguiente && siguiente.classList.contains("termino")) {
      navegacion.append(el("a", { href: "#termino-" + (i + 2), texto: siguiente.firstElementChild.textContent + " →" }));
    }
    seccion.append(navegacion);
  });

  document.getElementById("contador-secciones").textContent =
    secciones.length + " secciones en " + contenedor.parentNode.tagName.toLowerCase() + " (" + contenedor.children.length + " hijos directos)";

  document.getElementById("boton-aceptar").addEventListener("click", function () {
    confirmarEnVentana("Términos y condiciones", "¿Confirma que leyó los términos y condiciones? Podrá continuar con su cotización.", "Sí, continuar", function () {
      window.location.href = "cotizacion.html";
    });
  });
}


/* ============================================================================
   BLOQUE 11 — PÁGINA DE PRODUCTOS
   ============================================================================ */

// Los botones «Agregar a la cotización» del catálogo llevan data-agregar="CÓDIGO"
function iniciarProductos() {
  document.addEventListener("click", function (evento) {
    const boton = evento.target.closest("[data-agregar]");
    if (!boton) {
      return;
    }
    const codigo = boton.dataset.agregar;
    const indice = CODIGOS.indexOf(codigo);
    if (indice === -1) {
      return;
    }
    abrirVentanaCantidad(codigo, function (cantidad) {
      agregarAlCarrito(codigo, cantidad);
      mostrarAviso("Agregado: " + cantidad + " × " + NOMBRES[indice]);
    });
  });
}


/* ============================================================================
   BLOQUE 12 — INICIALIZACIÓN
   ============================================================================ */

function iniciar() {
  cargarCarrito();
  iniciarMenuResponsivo();
  iniciarBotonSubir();
  iniciarEscuchasGlobales();

  const pagina = document.body.dataset.pagina || "";
  switch (pagina) {
    case "cotizacion":
      iniciarCotizacion();
      break;
    case "boleta":
      iniciarBoleta();
      break;
    case "terminos":
      iniciarTerminos();
      break;
    case "productos":
      iniciarProductos();
      break;
    default:
      break;
  }

  if (pagina !== "cotizacion" && pagina !== "boleta") {
    crearCarritoFlotante();
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
