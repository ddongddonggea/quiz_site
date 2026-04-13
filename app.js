(function () {
  const cards = Array.isArray(window.QUIZ_CARDS) ? window.QUIZ_CARDS : [];
  const WRONG_NOTE_KEY = "clinical_quiz_wrong_note_ids_v1";

  const totalCount = document.getElementById("total-count");
  const wrongCount = document.getElementById("wrong-count");
  const quizPanel = document.getElementById("quiz-panel");
  const emptyPanel = document.getElementById("empty-panel");
  const cardLabel = document.getElementById("card-label");
  const progressLabel = document.getElementById("progress-label");
  const modeLabel = document.getElementById("mode-label");
  const questionImage = document.getElementById("question-image");
  const answerImage = document.getElementById("answer-image");
  const questionText = document.getElementById("question-text");
  const answerBox = document.getElementById("answer-box");
  const revealBtn = document.getElementById("reveal-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const markCorrectBtn = document.getElementById("mark-correct-btn");
  const markWrongBtn = document.getElementById("mark-wrong-btn");
  const allModeBtn = document.getElementById("all-mode-btn");
  const wrongModeBtn = document.getElementById("wrong-mode-btn");
  const saveStatus = document.getElementById("save-status");

  totalCount.textContent = String(cards.length);

  if (!cards.length) {
    emptyPanel.hidden = false;
    return;
  }

  quizPanel.hidden = false;

  let currentIndex = -1;
  let currentMode = "all";
  const history = [];
  let historyCursor = -1;
  let wrongIds = loadWrongIds();

  function loadWrongIds() {
    try {
      const raw = window.localStorage.getItem(WRONG_NOTE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function persistWrongIds() {
    window.localStorage.setItem(WRONG_NOTE_KEY, JSON.stringify(Array.from(wrongIds)));
  }

  function updateCounts() {
    wrongCount.textContent = String(wrongIds.size);
  }

  function getCurrentPool() {
    if (currentMode === "wrong") {
      return cards
        .map(function (card, index) { return { card: card, index: index }; })
        .filter(function (item) { return wrongIds.has(item.card.id); })
        .map(function (item) { return item.index; });
    }
    return cards.map(function (_, index) { return index; });
  }

  function pickRandomIndex() {
    const pool = getCurrentPool();
    if (!pool.length) {
      return -1;
    }
    if (pool.length === 1) {
      return pool[0];
    }

    let next = currentIndex;
    while (next === currentIndex || pool.indexOf(next) === -1) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
    return next;
  }

  function updatePrevButton() {
    prevBtn.disabled = historyCursor <= 0;
  }

  function updateModeButtons() {
    const inWrongMode = currentMode === "wrong";
    allModeBtn.disabled = !inWrongMode;
    wrongModeBtn.disabled = inWrongMode;
    modeLabel.textContent = inWrongMode ? "오답노트 보는 중" : "전체 문제 보는 중";
  }

  function updateSaveStatus(card) {
    if (!card) {
      saveStatus.textContent = "";
      return;
    }
    saveStatus.textContent = wrongIds.has(card.id) ? "이 문제는 오답노트에 저장됨" : "아직 오답노트에 저장되지 않음";
  }

  function updateMarkButtons(card) {
    const saved = wrongIds.has(card.id);
    markWrongBtn.disabled = saved;
    markCorrectBtn.disabled = !saved;
  }

  function renderEmptyWrongMode() {
    currentIndex = -1;
    cardLabel.textContent = "오답노트 비어 있음";
    progressLabel.textContent = "X로 체크한 문제가 아직 없습니다";
    questionImage.removeAttribute("src");
    answerImage.removeAttribute("src");
    questionText.textContent = "문제를 풀고 답 확인 후 X 버튼을 누르면 여기에 모입니다.";
    answerBox.classList.remove("visible");
    revealBtn.textContent = "답 확인하기";
    revealBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.disabled = historyCursor <= 0;
    markCorrectBtn.disabled = true;
    markWrongBtn.disabled = true;
    updateSaveStatus(null);
  }

  function renderCard(index, options) {
    if (index < 0) {
      renderEmptyWrongMode();
      return;
    }

    const card = cards[index];
    const fromHistory = options && options.fromHistory;
    currentIndex = index;

    if (!fromHistory) {
      if (historyCursor < history.length - 1) {
        history.splice(historyCursor + 1);
      }
      history.push(index);
      historyCursor = history.length - 1;
    }

    cardLabel.textContent = `페이지 ${card.page} / 문제 ${card.question_number}`;
    progressLabel.textContent = `${historyCursor + 1}번째 카드`;
    questionImage.src = card.question_image;
    answerImage.src = card.answer_image;
    questionText.textContent = card.question_text || "";
    answerBox.classList.remove("visible");
    revealBtn.textContent = "답 확인하기";
    revealBtn.disabled = false;
    nextBtn.disabled = false;
    updatePrevButton();
    updateMarkButtons(card);
    updateSaveStatus(card);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveToMode(mode) {
    currentMode = mode;
    updateModeButtons();
    const next = pickRandomIndex();
    renderCard(next, { fromHistory: false });
  }

  function saveAsWrong() {
    if (currentIndex < 0) {
      return;
    }
    wrongIds.add(cards[currentIndex].id);
    persistWrongIds();
    updateCounts();
    updateMarkButtons(cards[currentIndex]);
    updateSaveStatus(cards[currentIndex]);
  }

  function saveAsCorrect() {
    if (currentIndex < 0) {
      return;
    }
    wrongIds.delete(cards[currentIndex].id);
    persistWrongIds();
    updateCounts();

    if (currentMode === "wrong" && !wrongIds.has(cards[currentIndex].id)) {
      moveToMode("wrong");
      return;
    }

    updateMarkButtons(cards[currentIndex]);
    updateSaveStatus(cards[currentIndex]);
  }

  revealBtn.addEventListener("click", function () {
    if (currentIndex < 0) {
      return;
    }
    answerBox.classList.add("visible");
    revealBtn.textContent = "답 확인됨";
  });

  prevBtn.addEventListener("click", function () {
    if (historyCursor <= 0) {
      return;
    }
    historyCursor -= 1;
    renderCard(history[historyCursor], { fromHistory: true });
  });

  nextBtn.addEventListener("click", function () {
    renderCard(pickRandomIndex(), { fromHistory: false });
  });

  markWrongBtn.addEventListener("click", function () {
    saveAsWrong();
  });

  markCorrectBtn.addEventListener("click", function () {
    saveAsCorrect();
  });

  allModeBtn.addEventListener("click", function () {
    moveToMode("all");
  });

  wrongModeBtn.addEventListener("click", function () {
    moveToMode("wrong");
  });

  updateCounts();
  updateModeButtons();
  renderCard(pickRandomIndex(), { fromHistory: false });
})();
