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

  const tablaContenedor = document.getElementById("tabla-palabras");
const buscador = document.getElementById("buscador");

function cargarTablaPalabras() {
  fetch(`${API_URL}?accion=leer`)
    .then(res => res.json())
    .then(data => {
      palabrasGlobal = data; // guarda globalmente para filtro y edición
      mostrarTabla(data);
    });
}

function mostrarTabla(palabras) {
  if (!palabras.length) {
    tablaContenedor.innerHTML = "<p>No hay palabras.</p>";
    return;
  }

  let html = `
    <input type="text" id="buscador" placeholder="Buscar palabra...">
    <table class="tabla-palabras">
      <thead>
        <tr>
          <th>ID</th><th>Reo Tahiti</th><th>Español</th><th>Categoría</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const p of palabras) {
    html += `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td>${p.reo}</td>
        <td>${p.espanol}</td>
        <td>${p.categoria}</td>
        <td>
          <button class="btn-editar">Editar</button>
          <button class="btn-eliminar">Eliminar</button>
        </td>
      </tr>`;
  }

  html += "</tbody></table>";
  tablaContenedor.innerHTML = html;

  // Reasignar evento del buscador
  const inputBuscar = document.getElementById("buscador");
  inputBuscar.addEventListener("input", e => {
    const filtro = e.target.value.toLowerCase();
    const filtradas = palabrasGlobal.filter(p =>
      p.reo.toLowerCase().includes(filtro) || p.espanol.toLowerCase().includes(filtro)
    );
    mostrarTabla(filtradas);
  });

  // Eventos botones
  tablaContenedor.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.closest("tr").dataset.id;
      abrirModalEdicion(id);
    });
  });

  tablaContenedor.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.closest("tr").dataset.id;
      if (confirm("¿Eliminar esta palabra?")) {
        eliminarPalabra(id);
      }
    });
  });
}

let palabrasGlobal = [];

function abrirModalEdicion(id) {
  const palabra = palabrasGlobal.find(p => p.id === id);
  if (!palabra) return;

  // Crear modal con formulario para editar
  const modalHtml = `
    <div class="modal-fondo">
      <div class="modal-contenido">
        <h3>Editar Palabra ID: ${palabra.id}</h3>
        <form id="formEditar">
          <label>Reo Tahiti:
            <input name="reo" value="${palabra.reo}" required />
          </label>
          <label>Español:
            <input name="espanol" value="${palabra.espanol}" required />
          </label>
          <label>Categoría:
            <input name="categoria" value="${palabra.categoria || ''}" />
          </label>
          <label>Descripción:
            <textarea name="descripcion">${palabra.descripcion || ''}</textarea>
          </label>
          <label>Enlaces:
            <input name="enlaces" value="${palabra.enlaces || ''}" />
          </label>
          <button type="submit">Guardar</button>
          <button type="button" id="btnCerrarModal">Cancelar</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Cerrar modal
  document.getElementById("btnCerrarModal").addEventListener("click", () => {
    document.querySelector(".modal-fondo").remove();
  });

  // Guardar cambios
  document.getElementById("formEditar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updated = {
      id: palabra.id,
      reo: formData.get("reo").trim(),
      espanol: formData.get("espanol").trim(),
      categoria: formData.get("categoria").trim(),
      descripcion: formData.get("descripcion").trim(),
      enlaces: formData.get("enlaces").trim()
    };

    if (!updated.reo || !updated.espanol) {
      mostrarNotificacion("Reo Tahiti y Español son obligatorios", "error");
      return;
    }

    try {
      const params = new URLSearchParams({ accion: "editar", ...updated });
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const text = await res.text();
      if (text.includes("OK")) {
        mostrarNotificacion("✅ Palabra actualizada", "success");
        cargarTablaPalabras();
        document.querySelector(".modal-fondo").remove();
      } else {
        throw new Error(text);
      }
    } catch (err) {
      mostrarNotificacion("Error al actualizar: " + err.message, "error");
    }
  });
}

async function eliminarPalabra(id) {
  try {
    const params = new URLSearchParams({ accion: "eliminar", id });
    const res = await fetch(`${API_URL}?${params.toString()}`);
    const text = await res.text();
    if (text.includes("OK")) {
      mostrarNotificacion("✅ Palabra eliminada", "success");
      cargarTablaPalabras();
    } else {
      throw new Error(text);
    }
  } catch (err) {
    mostrarNotificacion("Error al eliminar: " + err.message, "error");
  }
}

});
