const CLAVE_ADMIN = "maitaimaitai";
const API_URL = "https://script.google.com/macros/s/AKfycbyI0EZvG_lOfDIFSk5EsKspKvt3eblG1DlOUbTxYWr_6_39sWuscLwqNoKUkBBv6Aw/exec";
const IMAGEN_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvsNQa3MWh4nCXLLRZQKzsQFEtvg0U1fDHkMUIlqt5PIalPPrYVC24Xp4pF8CLzpi7/exec";

let palabrasGlobal = [];
let modoEdicion = false;
let idEditando = null;

document.addEventListener("DOMContentLoaded", () => {
  const claveInput = document.getElementById("clave");
  const btnEntrar = document.getElementById("btnEntrar");
  const seccionAdmin = document.getElementById("seccion-admin");
  const notificacion = document.getElementById("notificacion");
  const form = document.getElementById("formAgregar");
  const inputImagen = form.querySelector('input[name="imagen"]');
  const btnSubmit = form.querySelector("button[type='submit']");

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

  // Envío del formulario Agregar o Editar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      id: idEditando,
      reo: form.reo.value.trim(),
      espanol: form.espanol.value.trim(),
      categoria: form.categoria.value.trim(),
      descripcion: form.descripcion.value.trim(),
      imagen: form.imagenUrl?.value.trim() || "",
      enlaces: form.enlaces.value.trim(),
      notas: form.notas?.value.trim() || ""
    };

    if (!data.reo || !data.espanol) {
      mostrarNotificacion("Reo Tahiti y Español son obligatorios", "error");
      return;
    }

    if (!modoEdicion) {
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
    }

    const accion = modoEdicion ? "editar" : "agregar";
    const params = new URLSearchParams({ accion, ...data });

    try {
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const txt = await res.text();
      if (txt.includes("OK")) {
        mostrarNotificacion(modoEdicion ? "✅ Palabra actualizada" : "✅ Palabra agregada", "success");
        form.reset();
        cargarCategorias();
        cargarTablaPalabras();
        if (modoEdicion) cancelarEdicion();
      } else {
        throw new Error(txt);
      }
    } catch (err) {
      mostrarNotificacion("Error: " + err.message, "error");
    }
  });

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

  function cargarTablaPalabras() {
    fetch(`${API_URL}?accion=leer`)
      .then(res => res.json())
      .then(data => {
        palabrasGlobal = data;
        mostrarTabla(data);
      });
  }

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

    document.getElementById("buscador").addEventListener("input", e => {
      const filtro = e.target.value.toLowerCase();
      const filtradas = palabrasGlobal.filter(p =>
        p.reo.toLowerCase().includes(filtro) || p.espanol.toLowerCase().includes(filtro)
      );
      mostrarTabla(filtradas);
    });

    tablaContenedor.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest("tr").dataset.id;
        activarEdicion(id);
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

  function activarEdicion(id) {
    const palabra = palabrasGlobal.find(p => p.id === id);
    if (!palabra) return;

    cambiarTab("agregar");
    modoEdicion = true;
    idEditando = id;

    const form = document.getElementById("formAgregar");
    form.reo.value = palabra.reo;
    form.espanol.value = palabra.espanol;
    form.categoria.value = palabra.categoria || "";
    form.descripcion.value = palabra.descripcion || "";
    form.enlaces.value = palabra.enlaces || "";
    form.notas.value = palabra.notas || "";
    if (form.imagenUrl) form.imagenUrl.value = palabra.imagen || "";

    const btnSubmit = form.querySelector("button[type='submit']");
    btnSubmit.textContent = "Actualizar";

    let btnCancelar = document.getElementById("btnCancelarEdicion");
    if (!btnCancelar) {
      btnCancelar = document.createElement("button");
      btnCancelar.id = "btnCancelarEdicion";
      btnCancelar.type = "button";
      btnCancelar.textContent = "Cancelar edición";
      btnCancelar.style.marginTop = "0.5rem";
      btnSubmit.insertAdjacentElement("afterend", btnCancelar);
    }

    btnCancelar.addEventListener("click", cancelarEdicion);
  }

  function cancelarEdicion() {
    modoEdicion = false;
    idEditando = null;
    const form = document.getElementById("formAgregar");
    form.reset();
    form.querySelector("button[type='submit']").textContent = "Agregar";
    const btnCancelar = document.getElementById("btnCancelarEdicion");
    if (btnCancelar) btnCancelar.remove();
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
