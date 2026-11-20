// A short two-note chime made with Web Audio, so no audio file ships with the widget.
// Browsers only allow sound after the page has had a user gesture; until then this stays silent.
let context: AudioContext | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  try {
    context ??= new AudioContext();
    const audio = context;
    if (audio.state === "suspended") void audio.resume();
    const start = audio.currentTime;
    for (const [index, frequency] of [880, 1320].entries()) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = start + index * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.3);
    }
  } catch {
    // Sound is a nicety; never let it break the page.
  }
}
