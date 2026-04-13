(function () {
  const cards = Array.isArray(window.QUIZ_CARDS) ? window.QUIZ_CARDS : [];
  const WRONG_NOTE_KEY = "clinical_quiz_wrong_note_ids_v2";

  const totalCount = document.getElementById("total-count");
  const wrongCount = document.getElementById("wrong-count");
  const quizPanel = document.getElementById("quiz-panel");
  const emptyPanel = document.getElementById("empty-panel");
  const cardLabel = document.getElementById("card-label");
  const progressLabel = document.getElementById("progress-label");
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
  const wrongListPanel = document.getElementById("wrong-list-panel");
  const wrongList = document.getElementById("wrong-list");
  const wrongListEmpty = document.getElementById("wrong-list-empty");
  const saveStatus = document.getElementById("save-status");

  totalCount.textContent = String(cards.length);

  if (!cards.length) {
    emptyPanel.hidden = false;
    return;
  }

  quizPanel.hidden = false;

  let currentIndex = -1;
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

  function getCardById(cardId) {
    return cards.find(function (card) {
      return card.id === cardId;
    });
  }

  function getCardIndexById(cardId) {
    return cards.findIndex(function (card) {
      return card.id === cardId;
    });
  }

  function updateCounts() {
    wrongCount.textContent = String(wrongIds.size);
  }

  function updatePrevButton() {
    prevBtn.disabled = historyCursor <= 0;
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

  function buildWrongListItem(card) {
    const item = document.createElement("div");
    item.className = "wrong-item";

    const title = document.createElement("button");
    title.className = "wrong-link";
    title.type = "button";
    title.textContent = `문제 ${card.question_number}번`;
    title.addEventListener("click", function () {
      const index = getCardIndexById(card.id);
      if (index >= 0) {
        renderCard(index, { fromHistory: false });
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "wrong-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "삭제";
    removeBtn.addEventListener("click", function () {
      wrongIds.delete(card.id);
      persistWrongIds();
      updateCounts();
      renderWrongList();
      if (currentIndex >= 0 && cards[currentIndex].id === card.id) {
        updateMarkButtons(cards[currentIndex]);
        updateSaveStatus(cards[currentIndex]);
      }
    });

    item.appendChild(title);
    item.appendChild(removeBtn);
    return item;
  }

  function renderWrongList() {
    wrongList.innerHTML = "";
    const wrongCards = Array.from(wrongIds)
      .map(getCardById)
      .filter(Boolean)
      .sort(function (a, b) {
        return a.question_number - b.question_number;
      });

    wrongListEmpty.hidden = wrongCards.length > 0;

    wrongCards.forEach(function (card) {
      wrongList.appendChild(buildWrongListItem(card));
    });
  }

  function pickRandomIndex() {
    if (cards.length <= 1) {
      return 0;
    }

    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * cards.length);
    }
    return next;
  }

  function renderCard(index, options) {
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

    cardLabel.textContent = `문제 ${card.question_number}`;
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

  function saveAsWrong() {
    if (currentIndex < 0) {
      return;
    }
    wrongIds.add(cards[currentIndex].id);
    persistWrongIds();
    updateCounts();
    updateMarkButtons(cards[currentIndex]);
    updateSaveStatus(cards[currentIndex]);
    renderWrongList();
  }

  function saveAsCorrect() {
    if (currentIndex < 0) {
      return;
    }
    wrongIds.delete(cards[currentIndex].id);
    persistWrongIds();
    updateCounts();
    updateMarkButtons(cards[currentIndex]);
    updateSaveStatus(cards[currentIndex]);
    renderWrongList();
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
    wrongListPanel.hidden = true;
    allModeBtn.disabled = true;
    wrongModeBtn.disabled = false;
  });

  wrongModeBtn.addEventListener("click", function () {
    wrongListPanel.hidden = false;
    allModeBtn.disabled = false;
    wrongModeBtn.disabled = true;
    renderWrongList();
    wrongListPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  updateCounts();
  renderWrongList();
  allModeBtn.disabled = true;
  wrongModeBtn.disabled = false;
  renderCard(pickRandomIndex(), { fromHistory: false });
})();
