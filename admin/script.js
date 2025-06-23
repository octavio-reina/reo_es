const CLAVE_SECRETA = "maitaimaitai";
const URL_BASE =
  "https://script.google.com/macros/s/AKfycbyI0EZvG_lOfDIFSk5EsKspKvt3eblG1DlOUbTxYWr_6_39sWuscLwqNoKUkBBv6Aw/exec";

let editandoID = null;
let palabrasCache = [];

function verificarClave() {
  if (document.getElementById("codigo").value.trim() === CLAVE_SECRETA) {
    document.getElementById("clave").style.display = "none";
    document.getElementById("admin").classList.remove("oculto");
    cargarTabla();
  } else {
    alert("Clave incorrecta.");
  }
}

function mostrarSeccion(seccion) {
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.classList.remove("active")
  );
  document.querySelectorAll("#agregar, #gestionar").forEach((sec) =>
    sec.classList.add("oculto")
  );
  document.getElementById(seccion).classList.remove("oculto");
  document
    .querySelector(`.tab-btn[onclick*='${seccion}']`)
    .classList.add("active");
  clearMensajes();
}

function cargarTabla() {
  fetch(URL_BASE + "?accion=leer")
    .then((res) => res.json())
    .then((data) => {
      palabrasCache = data;
      cargarCategorias();
      const tbody = document.querySelector("#tabla tbody");
      tbody.innerHTML = "";
      data.forEach((palabra) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${palabra.id}</td>
          <td>${palabra.reo}</td>
          <td>${palabra.espanol}</td>
          <td>${palabra.categoria}</td>
          <td class="acciones">
            <button onclick='editar(${JSON.stringify(palabra)})'>✏️</button>
            <button onclick='eliminar(${palabra.id})'>🗑️</button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    })
    .catch((err) => {
      mostrarError("Error al cargar datos.");
      console.error(err);
    });
}

function filtrarTabla() {
  const query = document.getElementById("busqueda").value.toLowerCase();
  document.querySelectorAll("#tabla tbody tr").forEach((row) => {
    const texto = row.innerText.toLowerCase();
    row.style.display = texto.includes(query) ? "" : "none";
  });
}

function editar(palabra) {
  document.getElementById("reo").value = palabra.reo;
  document.getElementById("espanol").value = palabra.espanol;
  document.getElementById("categoria-select").value = palabra.categoria || "";
  mostrarInputCategoria();
  document.getElementById("categoria-nueva").value = "";
  document.getElementById("notas").value = palabra.notas || "";
  document.getElementById("descripcion").value = palabra.descripcion || "";
  document.getElementById("imagen-url").value = palabra.imagen || "";

  limpiarCamposEnlaces();
  try {
    const enlaces = JSON.parse(palabra.enlaces || "[]");
    enlaces.forEach(link => agregarCampoEnlace(link.url, link.texto));
  } catch {
    agregarCampoEnlace();
  }

  editandoID = palabra.id;
  mostrarSeccion("agregar");
  document.getElementById("titulo-form").textContent = `Editando palabra ID ${palabra.id}`;
  clearMensajes();
}

function mostrarInputCategoria() {
  const select = document.getElementById("categoria-select");
  const inputNueva = document.getElementById("categoria-nueva");
  if (select.value === "otra") {
    inputNueva.classList.remove("oculto");
  } else {
    inputNueva.classList.add("oculto");
    inputNueva.value = "";
  }
}

function cargarCategorias() {
  const select = document.getElementById("categoria-select");
  select.innerHTML = '<option value="">Selecciona categoría</option>';
  const categorias = [
    ...new Set(
      palabrasCache
        .map((p) => p.categoria && p.categoria.trim())
        .filter((c) => c && c !== "")
    ),
  ].sort();
  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
  const optOtra = document.createElement("option");
  optOtra.value = "otra";
  optOtra.textContent = "Otra...";
  select.appendChild(optOtra);
  mostrarInputCategoria();
}

function efectoClick(btn) {
  btn.classList.add("active-click");
  setTimeout(() => btn.classList.remove("active-click"), 300);
}

function handleGuardar(btn) {
  efectoClick(btn);
  guardar();
}

function guardar() {
  clearMensajes();

  const reo = document.getElementById("reo").value.trim();
  const espanol = document.getElementById("espanol").value.trim();
  const categoriaSeleccionada = document.getElementById("categoria-select").value;
  const categoriaNueva = document.getElementById("categoria-nueva").value.trim();
  const categoria = categoriaSeleccionada === "otra" ? categoriaNueva : categoriaSeleccionada;
  const notas = document.getElementById("notas").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const imagen = document.getElementById("imagen-url").value.trim();

  const enlaces = [];
  document.querySelectorAll(".campo-enlace").forEach(contenedor => {
    const url = contenedor.querySelector(".input-url").value.trim();
    const texto = contenedor.querySelector(".input-texto").value.trim();
    if (url) {
      enlaces.push({ url, texto });
    }
  });

  if (!reo || !espanol) {
    return mostrarError("Reo Tahiti y Español son obligatorios.");
  }

  if (!editandoID) {
    const dup = palabrasCache.find(
      (p) =>
        p.reo.toLowerCase() === reo.toLowerCase() ||
        p.espanol.toLowerCase() === espanol.toLowerCase()
    );
    if (dup) {
      const confirmar = confirm(
        `¡Atención! Se encontró una palabra duplicada:\nReo Tahiti: ${dup.reo}\nEspañol: ${dup.espanol}\n\n¿Quieres agregar igual? (Aceptar)\n¿O prefieres editar la palabra existente? (Cancelar)`
      );
      if (!confirmar) {
        editar(dup);
        return;
      }
    }
  }

  let url = `${URL_BASE}?reo=${encodeURIComponent(reo)}&espanol=${encodeURIComponent(
    espanol
  )}&categoria=${encodeURIComponent(categoria)}&notas=${encodeURIComponent(
    notas
  )}&descripcion=${encodeURIComponent(descripcion)}&imagen=${encodeURIComponent(
    imagen
  )}&enlaces=${encodeURIComponent(JSON.stringify(enlaces))}`;

  if (editandoID) url += `&accion=editar&id=${editandoID}`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      if (data.trim() === "OK") {
        mostrarEstado(editandoID ? "✅ Palabra actualizada" : "✅ Palabra agregada");
        limpiarFormulario();
        cargarTabla();
      } else {
        mostrarError("❌ Error: " + data);
      }
    })
    .catch(() => {
      mostrarError("❌ Error al guardar.");
    });
}

function eliminar(id) {
  clearMensajes();
  if (!confirm("¿Eliminar esta palabra?")) return;
  fetch(`${URL_BASE}?accion=eliminar&id=${id}`)
    .then((res) => res.text())
    .then((data) => {
      if (data.trim() === "OK") {
        mostrarEstado("✅ Palabra eliminada");
        cargarTabla();
      } else {
        mostrarError("❌ Error al eliminar: " + data);
      }
    })
    .catch(() => {
      mostrarError("❌ Error al eliminar.");
    });
}

function limpiarCamposEnlaces() {
  document.getElementById("contenedor-enlaces").innerHTML = "";
  agregarCampoEnlace();
}

function agregarCampoEnlace(url = "", texto = "") {
  const contenedor = document.getElementById("contenedor-enlaces");
  const grupo = document.createElement("div");
  grupo.className = "campo-enlace";
  grupo.innerHTML = `
    <input type="text" class="input-url" placeholder="URL" value="${url}" />
    <input type="text" class="input-texto" placeholder="Texto del enlace" value="${texto}" />
    <button onclick="this.parentNode.remove()">❌</button>
  `;
  contenedor.appendChild(grupo);
}

function limpiarFormulario() {
  document.getElementById("reo").value = "";
  document.getElementById("espanol").value = "";
  document.getElementById("categoria-select").value = "";
  document.getElementById("categoria-nueva").value = "";
  document.getElementById("categoria-nueva").classList.add("oculto");
  document.getElementById("notas").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("imagen-url").value = "";
  limpiarCamposEnlaces();
  document.getElementById("titulo-form").textContent = "Agregar nueva palabra";
  editandoID = null;
}

let cuentaRegresivaTimeout;
function mostrarEstado(mensaje) {
  clearMensajes();
  const estado = document.getElementById("estado");
  let segundos = 5;
  estado.textContent = `${mensaje} (${segundos})`;

  cuentaRegresivaTimeout = setInterval(() => {
    segundos--;
    if (segundos > 0) {
      estado.textContent = `${mensaje} (${segundos})`;
    } else {
      clearInterval(cuentaRegresivaTimeout);
      estado.textContent = "";
    }
  }, 1000);
}

function mostrarError(mensaje) {
  clearMensajes();
  const error = document.getElementById("error");
  error.textContent = mensaje;
  setTimeout(() => {
    error.textContent = "";
  }, 7000);
}

function clearMensajes() {
  clearInterval(cuentaRegresivaTimeout);
  document.getElementById("estado").textContent = "";
  document.getElementById("error").textContent = "";
}
