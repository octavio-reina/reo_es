// tarjeta.js

import { obtenerFavoritos, agregarFavorito, eliminarFavorito, esFavorito } from "./favoritos.js";
import { compartirPalabra } from "./compartir.js";
import { reproducirAudio } from "./audio.js";
import { extraerEnlacesTexto } from "./util.js";

let tarjetaAbierta = null;

export function mostrarPalabras(lista) {
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  const favoritos = obtenerFavoritos();

  lista.forEach(palabra => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";

    const filaTop = document.createElement("div");
    filaTop.style.display = "flex";
    filaTop.style.alignItems = "center";
    filaTop.style.justifyContent = "space-between";
    filaTop.style.flexWrap = "wrap";

    const reoTahiti = document.createElement("div");
    reoTahiti.className = "reo-tahiti";
    reoTahiti.textContent = palabra["Reo Tahiti"];

    const acciones = document.createElement("div");
    acciones.className = "acciones-tarjeta";
    acciones.style.display = "flex";
    acciones.style.gap = "0.6rem";

    // Botón Compartir
    const btnShare = document.createElement("button");
    btnShare.innerHTML = "📤";
    btnShare.title = "Compartir";
    btnShare.onclick = (e) => {
      e.stopPropagation();
      compartirPalabra(palabra);
    };
    acciones.appendChild(btnShare);

    // Botón Copiar palabra
    const btnCopiar = document.createElement("button");
    btnCopiar.innerHTML = "📋";
    btnCopiar.title = "Copiar palabra";
    btnCopiar.setAttribute("aria-label", `Copiar la palabra ${palabra["Reo Tahiti"]}`);
    btnCopiar.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(palabra["Reo Tahiti"]).then(() => {
        btnCopiar.innerHTML = "✅";
        btnCopiar.title = "Copiado ✅";
        setTimeout(() => {
          btnCopiar.innerHTML = "📋";
          btnCopiar.title = "Copiar palabra";
        }, 1000);
      });
    };
    acciones.appendChild(btnCopiar);

    // Botón Favorito
    const btnFav = document.createElement("button");
    const id = palabra["Reo Tahiti"];
    btnFav.innerHTML = esFavorito(id) ? "⭐" : "☆";
    btnFav.title = "Agregar a favoritos";
    btnFav.onclick = (e) => {
      e.stopPropagation();
      if (esFavorito(id)) {
        eliminarFavorito(id);
        btnFav.innerHTML = "☆";
      } else {
        agregarFavorito(id);
        btnFav.innerHTML = "⭐";
      }
      // Actualizar la lista filtrada si está activo el filtro de favoritos
      const eventoChange = new Event('change');
      document.getElementById("filtros")?.dispatchEvent(eventoChange);
    };
    acciones.appendChild(btnFav);

    // Botón Audio si existe
    if (palabra["Audio"]) {
      const btnAudio = document.createElement("button");
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Reproducir audio";
      btnAudio.onclick = (e) => {
        e.stopPropagation();
        reproducirAudio(palabra["Audio"], btnAudio);
      };
      // Se coloca al final del texto Reo Tahiti
      reoTahiti.appendChild(btnAudio);
    }

    filaTop.appendChild(reoTahiti);
    filaTop.appendChild(acciones);
    cabecera.appendChild(filaTop);

    const espanol = document.createElement("div");
    espanol.className = "espanol";
    espanol.textContent = palabra["Español"];
    cabecera.appendChild(espanol);

    if (palabra["Categoría"]) {
      const categoria = document.createElement("div");
      categoria.className = "categoria";
      categoria.textContent = palabra["Categoría"];
      cabecera.appendChild(categoria);
    }

    const contenido = document.createElement("div");
    contenido.className = "contenido-oculto";

    if (palabra["Notas"]) {
      const notas = document.createElement("p");
      notas.innerHTML = `<strong>Notas:</strong> ${palabra["Notas"]}`;
      contenido.appendChild(notas);
    }

    if (palabra["Descripción"]) {
      const descripcion = document.createElement("p");
      const textoConSaltos = palabra["Descripción"].replace(/\n/g, "<br>");
      descripcion.innerHTML = `<strong>Descripción:</strong><br>${textoConSaltos}`;
      contenido.appendChild(descripcion);
    }

    if (palabra["Imagen"]) {
      const img = document.createElement("img");
      img.src = palabra["Imagen"];
      img.alt = palabra["Reo Tahiti"];
      img.loading = "lazy";
      img.className = "imagen-palabra";
      contenido.appendChild(img);
    }

    if (palabra["Enlaces"]) {
      try {
        const enlaces = JSON.parse(palabra["Enlaces"]);
        if (Array.isArray(enlaces) && enlaces.length > 0) {
          const titulo = document.createElement("p");
          titulo.innerHTML = "<strong>Referencias:</strong>";
          const listaEnlaces = document.createElement("ul");
          enlaces.forEach(enlace => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = enlace.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = enlace.texto || enlace.url;
            li.appendChild(a);
            listaEnlaces.appendChild(li);
          });
          contenido.appendChild(titulo);
          contenido.appendChild(listaEnlaces);
        }
      } catch (e) {
        console.warn("❌ Error al parsear enlaces:", palabra["Enlaces"]);
      }
    }

    cabecera.addEventListener("click", () => {
      const yaEstaVisible = contenido.classList.contains("visible");
      if (tarjetaAbierta && tarjetaAbierta !== contenido) {
        tarjetaAbierta.classList.remove("visible");
        tarjetaAbierta.parentElement.querySelector(".reo-tahiti")?.classList.remove("activo");
      }
      if (!yaEstaVisible) {
        contenido.classList.add("visible");
        reoTahiti.classList.add("activo");
        tarjetaAbierta = contenido;
      } else {
        contenido.classList.remove("visible");
        reoTahiti.classList.remove("activo");
        tarjetaAbierta = null;
      }
    });

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(contenido);
    container.appendChild(tarjeta);
  });
}
