// compartir.js
import { extraerEnlacesTexto } from "./util.js";

export function compartirPalabra(palabra) {
  const partes = [];

  partes.push(`📘 ${palabra["Reo Tahiti"]} – ${palabra["Español"]}`);

  if (palabra["Categoría"]) {
    partes.push(`📂 Categoría: ${palabra["Categoría"]}`);
  }

  if (palabra["Notas"]) {
    partes.push(`📝 Notas:\n${palabra["Notas"]}`);
  }

  if (palabra["Descripción"]) {
    partes.push(`📖 Descripción:\n${palabra["Descripción"]}`);
  }

  if (palabra["Enlaces"]) {
    const enlacesTexto = extraerEnlacesTexto(palabra["Enlaces"]);
    if (enlacesTexto.trim() !== "") {
      partes.push(`🔗 Enlaces:\n${enlacesTexto}`);
    }
  }

  const contenido = partes.join("\n\n");

  if (navigator.share) {
    navigator.share({ text: contenido });
  } else {
    navigator.clipboard.writeText(contenido);
    alert("Texto copiado para compartir.");
  }
}
