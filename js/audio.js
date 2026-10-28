// Áudio local opcional; fallback para voz japonesa do dispositivo.
// Para garantir funcionamento totalmente offline, coloque MP3s em audios/<script>/<romaji>.mp3.
window.JapaneseAudio = {
  enabled: true,
  async play(kana) {
    if (!this.enabled || !kana) return;
    const localPath = `audios/${kana.script}/${kana.romaji}.mp3`;
    if (location.protocol !== "file:") {
      try {
        const audio = new Audio(localPath);
        audio.preload = "auto";
        await audio.play();
        return;
      } catch (_) {}
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(kana.romaji);
      utterance.lang = "ja-JP";
      utterance.rate = 0.78;
      const voices = window.speechSynthesis.getVoices();
      const japaneseVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ja"));
      if (japaneseVoice) utterance.voice = japaneseVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Este navegador não oferece síntese de voz. Para áudio offline garantido, adicione gravações locais.");
    }
  }
};
