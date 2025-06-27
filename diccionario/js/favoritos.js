// favoritos.js

const STORAGE_KEY = "favoritos";

export function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function esFavorito(id) {
  const favs = obtenerFavoritos();
  return favs.includes(id);
}

export function agregarFavorito(id) {
  const favs = obtenerFavoritos();
  if (!favs.includes(id)) {
    favs.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  }
}

export function eliminarFavorito(id) {
  let favs = obtenerFavoritos();
  favs = favs.filter(fav => fav !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}
