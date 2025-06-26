let audioEnReproduccion = null;

export function manejarAudio(url, btn) {
  if (audioEnReproduccion) {
    audioEnReproduccion.pause();
    audioEnReproduccion.currentTime = 0;
    audioEnReproduccion = null;
    btn.innerHTML = "🔊";
    btn.title = "Reproducir audio";
    return;
  }

  const audio = new Audio(url);
  audio.play().catch(console.error);
  audioEnReproduccion = audio;
  btn.innerHTML = "⏹️";
  btn.title = "Detener audio";

  audio.onended = () => {
    btn.innerHTML = "🔊";
    btn.title = "Reproducir audio";
    audioEnReproduccion = null;
  };
}
