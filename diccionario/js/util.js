// util.js

export function normalizarTexto(txt) {
  return (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Extrae texto legible desde JSON de enlaces
export function extraerEnlacesTexto(jsonStr) {
  try {
    const enlaces = JSON.parse(jsonStr);
    return enlaces.map(e => `${e.texto || e.url}: ${e.url}`).join("\n");
  } catch {
    return "";
  }
}

// Ordenar alfabéticamente por "Reo Tahiti" normalizado
export function ordenarAlfabeticamente(lista) {
  lista.sort((a, b) => {
    const strA = normalizarTexto(a["Reo Tahiti"]);
    const strB = normalizarTexto(b["Reo Tahiti"]);
    return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
  });
}
