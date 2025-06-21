const CLAVE_ADMIN = "tupass123"; // Cambia esto por una clave segura
const API_URL = "https://script.google.com/macros/s/AKfycbwZwQCGXgoxE6kSx4N609NlUAdHT9Cbu8Oxr0Q7Y5McH95bctkihDZ1Ow8b-lonx2a0/exec";

// GitHub Config
const GITHUB_TOKEN = "ghp_xxx";
const REPO_OWNER = "octavio-reina";
const REPO_NAME = "reo_es";
const UPLOAD_FOLDER = "assets/images";

document.addEventListener("DOMContentLoaded", () => {
  const claveInput = document.getElementById("clave");
  const btnEntrar = document.getElementById("btnEntrar");
  const seccionAdmin = document.getElementById("seccion-admin");
  const notificacion = document.getElementById("notificacion");

  const form = document.getElementById("formulario");
  const inputImagen = form.querySelector('input[name="imagen"]');

  btnEntrar.addEventListener("click", () => {
    if (claveInput.value === CLAVE_ADMIN) {
      document.getElementById("seccion-login").classList.add("oculto");
      seccionAdmin.classList.remove("oculto");
      cargarCategorias();
    } else {
      mostrarNotificacion("Clave incorrecta", "error");
    }
  });

  // Tabs
  document.getElementById("tab-agregar").addEventListener("click", () => cambiarTab("agregar"));
  document.getElementById("tab-editar").addEventListener("click", () => cambiarTab("editar"));

  function cambiarTab(tab) {
    document.getElementById("tab-agregar").classList.remove("activo");
    document.getElementById("tab-editar").classList.remove("activo");
    document.getElementById("agregar-palabra").classList.add("oculto");
    document.getElementById("editar-palabra").classList.add("oculto");

    if (tab === "agregar") {
      document.getElementById("tab-agregar").classList.add("activo");
      document.getElementById("agregar-palabra").classList.remove("oculto");
    } else {
      document.getElementById("tab-editar").classList.add("activo");
      document.getElementById("editar-palabra").classList.remove("oculto");
      // TODO: cargarTablaPalabras()
    }
  }

  // Envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      reo: form.reo.value.trim(),
      espanol: form.espanol.value.trim(),
      categoria: form.categoria.value.trim(),
      descripcion: form.descripcion.value.trim(),
      imagen: "",
      enlaces: form.enlaces.value.trim()
    };

    // Validación básica
    if (!data.reo || !data.espanol) {
      mostrarNotificacion("Reo Tahiti y Español son obligatorios", "error");
      return;
    }

    // Subir imagen (si hay)
    const file = inputImagen.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        mostrarNotificacion("Solo se permiten imágenes PNG o JPG", "error");
        return;
      }

      try {
        const url = await subirImagenAGitHub(file);
        data.imagen = url;
      } catch (error) {
        mostrarNotificacion("Error al subir imagen", "error");
        return;
      }
    }

    // Enviar al servidor
    const params = new URLSearchParams(data);
    fetch(`${API_URL}?${params.toString()}`)
      .then(res => res.text())
      .then(txt => {
        if (txt.includes("OK")) {
          mostrarNotificacion("✅ Palabra agregada correctamente", "success");
          form.reset();
        } else {
          throw new Error(txt);
        }
      })
      .catch(err => mostrarNotificacion("Error al guardar palabra: " + err, "error"));
  });

  // Cargar categorías existentes
  function cargarCategorias() {
    fetch(`${API_URL}?accion=leer`)
      .then(res => res.json())
      .then(data => {
        const lista = new Set(data.map(p => p.categoria).filter(Boolean));
        const datalist = document.getElementById("categorias");
        datalist.innerHTML = "";
        lista.forEach(cat => {
          const opt = document.createElement("option");
          opt.value = cat;
          datalist.appendChild(opt);
        });
      });
  }

  // Subir imagen al repositorio
  async function subirImagenAGitHub(file) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "_");

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${UPLOAD_FOLDER}/${fileName}`;

    const body = {
      message: `Subir imagen ${fileName}`,
      content: base64
    };

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (!json.content || !json.content.download_url) {
      throw new Error("Error al subir a GitHub");
    }

    return json.content.download_url;
  }

  // Notificación
  function mostrarNotificacion(mensaje, tipo = "info") {
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`;
    notificacion.classList.remove("oculto");

    let segundos = 5;
    const interval = setInterval(() => {
      segundos--;
      notificacion.textContent = `${mensaje} (${segundos})`;
      if (segundos === 0) {
        clearInterval(interval);
        notificacion.classList.add("oculto");
      }
    }, 1000);
  }
});

