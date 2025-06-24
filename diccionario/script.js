function mostrarPalabras(lista) {
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  let tarjetaAbierta = null;
  const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");

  lista.forEach(palabra => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";

    const reoTahiti = document.createElement("div");
    reoTahiti.className = "reo-tahiti";
    reoTahiti.textContent = palabra["Reo Tahiti"];

    const acciones = document.createElement("div");
    acciones.className = "acciones-tarjeta";

    // Copiar palabra
    const btnCopiar = document.createElement("button");
    btnCopiar.innerHTML = "📋";
    btnCopiar.title = "Copiar palabra";
    btnCopiar.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(palabra["Reo Tahiti"]);
      btnCopiar.innerHTML = "✅";
      setTimeout(() => (btnCopiar.innerHTML = "📋"), 1000);
    };
    acciones.appendChild(btnCopiar);

    // Favorito
    const btnFav = document.createElement("button");
    const id = palabra["Reo Tahiti"]; // se asume como clave única
    btnFav.innerHTML = favoritos.includes(id) ? "⭐" : "☆";
    btnFav.title = "Agregar a favoritos";
    btnFav.onclick = (e) => {
      e.stopPropagation();
      if (favoritos.includes(id)) {
        const i = favoritos.indexOf(id);
        favoritos.splice(i, 1);
        btnFav.innerHTML = "☆";
      } else {
        favoritos.push(id);
        btnFav.innerHTML = "⭐";
      }
      localStorage.setItem("favoritos", JSON.stringify(favoritos));
    };
    acciones.appendChild(btnFav);

    // Compartir palabra
    const btnShare = document.createElement("button");
    btnShare.innerHTML = "📤";
    btnShare.title = "Compartir";
    btnShare.onclick = (e) => {
      e.stopPropagation();
      const texto = `📘 ${palabra["Reo Tahiti"]} – ${palabra["Español"]}`;
      if (navigator.share) {
        navigator.share({ text: texto });
      } else {
        navigator.clipboard.writeText(texto);
        alert("Texto copiado para compartir.");
      }
    };
    acciones.appendChild(btnShare);

    // Reproducir audio
    if (palabra["Audio"]) {
      const btnAudio = document.createElement("button");
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Reproducir audio";
      btnAudio.onclick = (e) => {
        e.stopPropagation();
        const audio = new Audio(palabra["Audio"]);
        audio.play().catch(err => console.error("No se pudo reproducir:", err));
      };
      acciones.appendChild(btnAudio);
    }

    const espanol = document.createElement("div");
    espanol.className = "espanol";
    espanol.textContent = palabra["Español"];

    cabecera.appendChild(reoTahiti);
    cabecera.appendChild(espanol);
    cabecera.appendChild(acciones);

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
        const reoActivo = tarjetaAbierta.parentElement.querySelector(".reo-tahiti.activo");
        if (reoActivo) reoActivo.classList.remove("activo");
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
