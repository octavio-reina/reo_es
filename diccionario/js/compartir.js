export function extraerEnlacesTexto(jsonStr) {
  try {
    const enlaces = JSON.parse(jsonStr);
    return enlaces.map(e => `${e.texto || e.url}: ${e.url}`).join("\n");
  } catch {
    return "";
  }
}

export function construirTextoCompartido(palabra) {
  const partes = [];
  partes.push(`📘 ${palabra["Reo Tahiti"]} – ${palabra["Español"]}`);

  if (palabra["Categoría"]) partes.push(`📂 Categoría: ${palabra["Categoría"]}`);
  if (palabra["Notas"]) partes.push(`📝 Notas:\n${palabra["Notas"]}`);
  if (palabra["Descripción"]) partes.push(`📖 Descripción:\n${palabra["Descripción"]}`);
  if (palabra["Enlaces"]) {
    const enlaces = extraerEnlacesTexto(palabra["Enlaces"]);
    if (enlaces.trim()) partes.push(`🔗 Enlaces:\n${enlaces}`);
  }

  return partes.join("\n\n");
}
