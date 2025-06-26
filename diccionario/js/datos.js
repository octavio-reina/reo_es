export const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

export let palabras = [];

export async function cargarDatos() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: function(results) {
        palabras = results.data;
        palabras.sort((a, b) => a["Reo Tahiti"].localeCompare(b["Reo Tahiti"], 'es', { sensitivity: 'base' }));
        resolve(palabras);
      },
      error: function(err) {
        document.getElementById("resultados").innerHTML = `<p>Error al cargar datos: ${err.message}</p>`;
        reject(err);
      }
    });
  });
}
