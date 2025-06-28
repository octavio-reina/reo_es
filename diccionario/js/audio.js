// audio.js
let audioEnReproduccion = null;

export function reproducirAudio(url, btnAudio) {
  if (audioEnReproduccion) {
    audioEnReproduccion.pause();
    audioEnReproduccion.currentTime = 0;
    audioEnReproduccion = null;
    btnAudio.innerHTML = "🔊";
    btnAudio.title = "Reproducir audio";
    // Si pausamos el mismo audio, no continuar
    if (btnAudio._urlReproduciendo === url) {
      btnAudio._urlReproduciendo = null;
      return;
    }
  }

  const audio = new Audio(url);
  audio.play().catch(err => console.error("No se pudo reproducir:", err));
  audioEnReproduccion = audio;
  btnAudio.innerHTML = "⏹️";
  btnAudio.title = "Detener audio";
  btnAudio._urlReproduciendo = url;

  audio.onended = () => {
    audioEnReproduccion = null;
    btnAudio.innerHTML = "🔊";
    btnAudio.title = "Reproducir audio";
    btnAudio._urlReproduciendo = null;
  };
}
