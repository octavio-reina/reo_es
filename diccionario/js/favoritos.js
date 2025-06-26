export function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos") || "[]");
}

export function toggleFavorito(id) {
  let favoritos = obtenerFavoritos();
  const index = favoritos.indexOf(id);
  if (index >= 0) favoritos.splice(index, 1);
  else favoritos.push(id);
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  return favoritos.includes(id);
}
