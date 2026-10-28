(() => {
  const $ = id => document.getElementById(id);
  const screens = ["homeScreen","challengeSetup","sessionScreen","resultScreen"];
  let selectedScript = "hiragana";
  let selectedMode = "study";
  let challengeType = "visual";
  let round = [];
  let index = 0;
  let score = 0;
  let mistakes = [];
  let answered = false;
  let lastMode = "challenge";
  let soundEnabled = true;
  const labels = {hiragana:"Hiragana",katakana:"Katakana"};
  const getPool = () => selectedScript === "hiragana" ? window.KANA_HIRAGANA : window.KANA_KATAKANA;
  const current = () => round[index];

  function showScreen(id) {
    screens.forEach(s => $(s).classList.toggle("active", s === id));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function setScript(script) {
    selectedScript = script;
    document.querySelectorAll("[data-script]").forEach(b => b.classList.toggle("selected", b.dataset.script === script));
  }
  function startSession(mode, type="visual") {
    selectedMode = mode;
    challengeType = type;
    lastMode = mode;
    round = JapaneseExercises.round(getPool(), 10);
    index = 0; score = 0; mistakes = []; answered = false;
    $("sessionScriptLabel").textContent = labels[selectedScript];
    $("sessionModeLabel").textContent = mode === "study" ? "Estudo" : "Desafio";
    showScreen("sessionScreen");
    renderQuestion();
  }
  function renderQuestion() {
    const kana = current();
    answered = false;
    $("questionCounter").textContent = `${index+1} / ${round.length}`;
    $("progressBar").style.width = `${(index / round.length)*100}%`;
    const audioOnly = selectedMode === "challenge" && (challengeType === "audio" || (challengeType === "mixed" && index % 2 === 1));
    $("phaseEyebrow").textContent = selectedMode === "study" ? "MODO DE ESTUDO" : `DESAFIO · PERGUNTA ${index+1}`;
    $("phaseTitle").textContent = selectedMode === "study" ? "Conheça o caractere" : (audioOnly ? "Qual som você ouviu?" : "Qual é a leitura?");
    $("phaseDescription").textContent = selectedMode === "study" ? "Observe a forma, leia o romaji e ouça a pronúncia." : (audioOnly ? "O caractere fica escondido. Toque no áudio e escolha a leitura." : "Escolha uma das quatro alternativas.");
    $("cardTag").textContent = labels[selectedScript].toUpperCase();
    $("cardIndex").textContent = `CARD ${String(index+1).padStart(2,"0")}`;
    const audioOnlyMode = selectedMode === "challenge" && (challengeType === "audio" || (challengeType === "mixed" && index % 2 === 1));
    $("characterDisplay").textContent = audioOnlyMode ? "？" : kana.char;
    $("characterDisplay").classList.toggle("audio-hidden", audioOnlyMode);
    $("romajiDisplay").textContent = audioOnlyMode ? "ÁUDIO" : (selectedMode === "study" ? kana.romaji : "");
    $("cardHint").textContent = selectedMode === "study" ? "Veja, leia em voz alta e ouça." : (audioOnlyMode ? "Não há pista visual nesta pergunta." : "Identifique a leitura do caractere." );
    $("playAudio").classList.remove("hidden");
    if (audioOnlyMode) setTimeout(() => JapaneseAudio.play(kana), 250);
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("continueButton").classList.add("hidden");
    $("studyControls").classList.toggle("hidden", selectedMode !== "study");
    $("answerArea").classList.toggle("hidden", selectedMode === "study");
    if (selectedMode === "study") {
      $("prevStudy").disabled = index === 0;
      $("nextStudy").textContent = index === round.length-1 ? "Concluir estudo ✓" : "Próximo →";
      $("progressBar").style.width = `${((index+1) / round.length)*100}%`;
      return;
    }
    $("answerPrompt").textContent = audioOnly ? "Qual foi a pronúncia?" : "Escolha o romaji correspondente:";
    const opts = JapaneseExercises.options(kana, getPool(), 4);
    $("optionsGrid").innerHTML = "";
    opts.forEach(opt => {
      const button = document.createElement("button");
      button.className = "option-button";
      button.textContent = opt.romaji.toUpperCase();
      button.addEventListener("click", () => answerQuestion(opt, button));
      $("optionsGrid").appendChild(button);
    });
  }
  function answerQuestion(opt, button) {
    if (answered) return;
    answered = true;
    const kana = current();
    const correct = opt.romaji === kana.romaji;
    document.querySelectorAll(".option-button").forEach(b => {
      b.disabled = true;
      if (b.textContent.toLowerCase() === kana.romaji) b.classList.add("correct");
    });
    if (correct) {
      score++;
      $("feedback").textContent = "✓ Isso mesmo! Muito bem!";
      $("feedback").classList.add("good");
    } else {
      button.classList.add("wrong");
      mistakes.push(kana);
      $("feedback").textContent = `Quase! A resposta é ${kana.romaji.toUpperCase()}.`;
      $("feedback").classList.add("bad");
    }
    $("progressBar").style.width = `${((index+1) / round.length)*100}%`;
    $("continueButton").textContent = index === round.length-1 ? "Ver resultado →" : "Próxima pergunta →";
    $("continueButton").classList.remove("hidden");
  }
  function next() {
    if (index < round.length-1) { index++; renderQuestion(); }
    else showResults();
  }
  function showResults() {
    const total = round.length, wrong = total-score, accuracy = Math.round(score/total*100);
    $("finalScore").textContent = `${score}/${total}`;
    $("correctCount").textContent = score;
    $("wrongCount").textContent = wrong;
    $("accuracyCount").textContent = `${accuracy}%`;
    $("resultEmoji").textContent = accuracy >= 80 ? "🎉" : accuracy >= 50 ? "🌱" : "💪";
    $("resultTitle").textContent = accuracy >= 80 ? "Mandou muito bem!" : accuracy >= 50 ? "Bom progresso!" : "Continue praticando!";
    $("resultMessage").textContent = accuracy >= 80 ? "Seu treino está indo muito bem. Continue assim!" : "A prática frequente ajuda a fixar cada caractere.";
    $("reviewBox").classList.toggle("hidden", mistakes.length===0);
    $("reviewChars").innerHTML = "";
    [...new Map(mistakes.map(k=>[k.char,k])).values()].forEach(k => {
      const item = document.createElement("div");
      item.className = "review-char";
      item.innerHTML = `<b>${k.char}</b><small>${k.romaji.toUpperCase()}</small>`;
      $("reviewChars").appendChild(item);
    });
    saveProgress({date:new Date().toISOString(),script:selectedScript,mode:selectedMode,challengeType,score,total,accuracy,missed:[...new Set(mistakes.map(k=>k.char))]});
    showScreen("resultScreen");
  }
  function saveProgress(entry) {
    try {
      const history = JSON.parse(localStorage.getItem("japonesCardsHistory") || "[]");
      history.push(entry);
      localStorage.setItem("japonesCardsHistory", JSON.stringify(history.slice(-100)));
    } catch (_) {}
  }
  document.querySelectorAll("[data-script]").forEach(b => b.addEventListener("click",()=>setScript(b.dataset.script)));
  $("studyMode").addEventListener("click",()=>startSession("study"));
  $("challengeMode").addEventListener("click",()=>showScreen("challengeSetup"));
  $("challengeBack").addEventListener("click",()=>showScreen("homeScreen"));
  document.querySelectorAll("[data-challenge]").forEach(b => b.addEventListener("click",()=>startSession("challenge",b.dataset.challenge)));
  $("backHome").addEventListener("click",()=>showScreen("homeScreen"));
  $("playAudio").addEventListener("click",()=>JapaneseAudio.play(current()));
  $("continueButton").addEventListener("click",next);
  $("nextStudy").addEventListener("click",()=>index < round.length-1 ? (index++,renderQuestion()) : showScreen("homeScreen"));
  $("prevStudy").addEventListener("click",()=>{if(index>0){index--;renderQuestion();}});
  $("retryButton").addEventListener("click",()=>startSession(lastMode,challengeType));
  $("homeFromResult").addEventListener("click",()=>showScreen("homeScreen"));
  $("soundToggle").addEventListener("click",()=>{
    soundEnabled = !soundEnabled; JapaneseAudio.enabled = soundEnabled;
    $("soundToggle").textContent = soundEnabled ? "🔊" : "🔇";
    $("soundToggle").setAttribute("aria-label", soundEnabled ? "Desativar áudio" : "Ativar áudio");
  });
  // Seleciona Hiragana por padrão.
  setScript("hiragana");
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
  }
})();
