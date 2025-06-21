const CLAVE_ADMIN = "maitaimaitai"; // Cámbiala por una segura
const API_URL = "https://script.google.com/macros/s/AKfycbwZwQCGXgoxE6kSx4N609NlUAdHT9Cbu8Oxr0Q7Y5McH95bctkihDZ1Ow8b-lonx2a0/exec";
const IMAGEN_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxshNA7u6-BR9XZZnYkjVicgrOt1qWIe1AfOta4Nb88f2ID1HMB8Zcc6bBqs-gt056h/exec";

document.addEventListener("DOMContentLoaded", () => {
  const claveInput = document.getElementById("clave");
  const btnEntrar = document.getElementById("btnEntrar");
  const seccionAdmin = document.getElementById("seccion-admin");
  const notificacion = document.getElementById("notificacion");
  const form = document.getElementById("formulario");
  const inputImagen = form.querySelector('input[name="imagen"]');

  // Validar acceso
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

    if (!data.reo || !data.espanol) {
      mostrarNotificacion("Reo Tahiti y Español son obligatorios", "error");
      return;
    }

    const file = inputImagen.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        mostrarNotificacion("Solo se permiten imágenes PNG o JPG", "error");
        return;
      }

      try {
        const url = await subirImagenViaAppsScript(file);
        data.imagen = url;
      } catch (error) {
        mostrarNotificacion("Error al subir imagen", "error");
        return;
      }
    }

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

  // Subida de imagen vía Apps Script seguro
  async function subirImagenViaAppsScript(file) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const nombre = `${Date.now()}-${file.name}`.replace(/\s+/g, "_");

    const response = await fetch(IMAGEN_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, base64 })
    });

    const result = await response.json();
    if (result.ok) {
      return result.url;
    } else {
      throw new Error("No se pudo subir imagen");
    }
  }

  // Cargar categorías
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

  // Mostrar notificación con contador
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
