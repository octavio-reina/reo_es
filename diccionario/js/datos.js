import { ordenarAlfabeticamente } from "./util.js";
import { generarFiltros } from "./filtros.js";
import { mostrarPalabras } from "./tarjeta.js";

export const palabras = [];
export const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_ykT7tdYfacb16eKygphFcMv3XMeuISx1LApPBT-g5M4GRKeae3f-WgyHDAWprMmdyQrxY7dYvl6c/pub?gid=0&single=true&output=csv";

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
