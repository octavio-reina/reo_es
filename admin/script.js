const CLAVE_ADMIN = "maitaimaitai"; // Cambia por tu clave segura
const API_URL = "https://script.google.com/macros/s/AKfycbyI0EZvG_lOfDIFSk5EsKspKvt3eblG1DlOUbTxYWr_6_39sWuscLwqNoKUkBBv6Aw/exec";
const IMAGEN_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxshNA7u6-BR9XZZnYkjVicgrOt1qWIe1AfOta4Nb88f2ID1HMB8Zcc6bBqs-gt056h/exec";

let palabrasGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
  const claveInput = document.getElementById("clave");
  const btnEntrar = document.getElementById("btnEntrar");
  const seccionAdmin = document.getElementById("seccion-admin");
  const notificacion = document.getElementById("notificacion");
  const form = document.getElementById("formAgregar");
  const inputImagen = form.querySelector('input[name="imagen"]');

  // Validar acceso
  btnEntrar.addEventListener("click", () => {
    if (claveInput.value === CLAVE_ADMIN) {
      document.getElementById("seccion-login").classList.add("oculto");
      seccionAdmin.classList.remove("oculto");
      cargarCategorias();
      cargarTablaPalabras();
      cambiarTab("agregar");
    } else {
      mostrarNotificacion("Clave incorrecta", "error");
    }
  });

  // Control tabs
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
    }
  }

  // Envío del formulario Agregar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      reo: form.reo.value.trim(),
      espanol: form.espanol.value.trim(),
      categoria: form.categoria.value.trim(),
      descripcion: form.descripcion.value.trim(),
      imagen: "",
      enlaces: form.enlaces.value.trim(),
      notas: form.notas.value.trim()
    };

    if (!data.reo || !data.espanol) {
      mostrarNotificacion("Reo Tahiti y Español son obligatorios", "error");
      return;
    }

    const file = inputImagen.files[0];
    if (file) {
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        mostrarNotificacion("Solo se permiten imágenes PNG o JPG", "error");
        return;
      }
      try {
        mostrarNotificacion("Subiendo imagen...", "info");
        data.imagen = await subirImagenViaAppsScript(file);
        mostrarNotificacion("Imagen subida correctamente", "success");
      } catch (error) {
        mostrarNotificacion("Error al subir imagen", "error");
        return;
      }
    }

    const params = new URLSearchParams({ accion: "agregar", ...data });
    try {
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const txt = await res.text();
      if (txt.includes("OK")) {
        mostrarNotificacion("✅ Palabra agregada correctamente", "success");
        form.reset();
        cargarCategorias();
        cargarTablaPalabras();
      } else {
        throw new Error(txt);
      }
    } catch (err) {
      mostrarNotificacion("Error al guardar palabra: " + err.message, "error");
    }
  });

  // Subir imagen al backend Apps Script
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

  // Cargar categorías en datalist
  function cargarCategorias() {
    fetch(`${API_URL}?accion=leer`)
      .then(res => res.json())
      .then(data => {
        palabrasGlobal = data;
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

  // Cargar tabla para editar/eliminar
  function cargarTablaPalabras() {
    fetch(`${API_URL}?accion=leer`)
      .then(res => res.json())
      .then(data => {
        palabrasGlobal = data;
        mostrarTabla(data);
      });
  }

  // Mostrar tabla con buscador y botones
  function mostrarTabla(palabras) {
    const tablaContenedor = document.getElementById("tabla-palabras");
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
          <td>${p.categoria || ""}</td>
          <td>
            <button class="btn-editar">Editar</button>
            <button class="btn-eliminar">Eliminar</button>
          </td>
        </tr>`;
    }

    html += "</tbody></table>";
    tablaContenedor.innerHTML = html;

    // Buscador dinámico
    document.getElementById("buscador").addEventListener("input", e => {
      const filtro = e.target.value.toLowerCase();
      const filtradas = palabrasGlobal.filter(p =>
        p.reo.toLowerCase().includes(filtro) || p.espanol.toLowerCase().includes(filtro)
      );
      mostrarTabla(filtradas);
    });

    // Eventos editar
    tablaContenedor.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest("tr").dataset.id;
        abrirModalEdicion(id);
      });
    });

    // Eventos eliminar
    tablaContenedor.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest("tr").dataset.id;
        if (confirm("¿Eliminar esta palabra?")) {
          eliminarPalabra(id);
        }
      });
    });
  }

  // Modal edición palabra
  function abrirModalEdicion(id) {
    const palabra = palabrasGlobal.find(p => p.id === id);
    if (!palabra) return;

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
              <input name="categoria" value="${palabra.categoria || ''}" list="categorias" />
            </label>
            <label>Notas:
              <input name="notas" value="${palabra.notas || ''}" />
            </label>
            <label>Descripción:
              <textarea name="descripcion">${palabra.descripcion || ''}</textarea>
            </label>
            <label>Imagen (URL):
              <input name="imagen" value="${palabra.imagen || ''}" />
            </label>
            <label>Enlaces:
              <input name="enlaces" value="${palabra.enlaces || ''}" />
            </label>
            <button type="submit">Guardar</button>
            <button type="button" id="btnCerrarModal">Cancelar</button>
          </form>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document.getElementById("btnCerrarModal").addEventListener("click", () => {
      document.querySelector(".modal-fondo").remove();
    });

    document.getElementById("formEditar").addEventListener("submit", async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updated = {
        id: palabra.id,
        reo: formData.get("reo").trim(),
        espanol: formData.get("espanol").trim(),
        categoria: formData.get("categoria").trim(),
        notas: formData.get("notas").trim(),
        descripcion: formData.get("descripcion").trim(),
        imagen: formData.get("imagen").trim(),
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

  // Eliminar palabra
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

  // Mostrar notificación con contador regresivo
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
