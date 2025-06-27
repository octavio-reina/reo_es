import { ordenarAlfabeticamente } from "./util.js";
import { generarFiltros } from "./filtros.js";
import { mostrarPalabras } from "./tarjeta.js";

export const palabras = [];
export const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

export function cargarDatos() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
      palabras.splice(0, palabras.length, ...results.data);
      ordenarAlfabeticamente(palabras);
      generarFiltros(palabras);
      mostrarPalabras(palabras);
    },
    error: function(err) {
      document.getElementById("resultados").innerHTML = `<p>Error al cargar datos: ${err.message}</p>`;
    }
  });
}
