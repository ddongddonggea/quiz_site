(function () {
  const cards = Array.isArray(window.QUIZ_CARDS) ? window.QUIZ_CARDS : [];
  const WRONG_NOTE_KEY = "clinical_quiz_wrong_note_ids_v5";
  const PROGRESS_KEY = "clinical_quiz_viewed_order_v5";

  const totalCount = document.getElementById("total-count");
  const wrongCount = document.getElementById("wrong-count");
  const viewedCount = document.getElementById("viewed-count");
  const quizPanel = document.getElementById("quiz-panel");
  const emptyPanel = document.getElementById("empty-panel");
  const completionPanel = document.getElementById("completion-panel");
  const cardLabel = document.getElementById("card-label");
  const progressLabel = document.getElementById("progress-label");
  const questionImage = document.getElementById("question-image");
  const answerImage = document.getElementById("answer-image");
  const questionText = document.getElementById("question-text");
  const answerBox = document.getElementById("answer-box");
  const revealBtn = document.getElementById("reveal-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const resetBtn = document.getElementById("reset-btn");
  const markCorrectBtn = document.getElementById("mark-correct-btn");
  const markWrongBtn = document.getElementById("mark-wrong-btn");
  const wrongToggleBtn = document.getElementById("wrong-toggle-btn");
  const viewedList = document.getElementById("viewed-list");
  const viewedEmpty = document.getElementById("viewed-empty");
  const wrongListPanel = document.getElementById("wrong-list-panel");
  const wrongList = document.getElementById("wrong-list");
  const wrongListEmpty = document.getElementById("wrong-list-empty");
  const saveStatus = document.getElementById("save-status");
  const completionText = document.getElementById("completion-text");

  totalCount.textContent = String(cards.length);

  if (!cards.length) {
    emptyPanel.hidden = false;
    return;
  }

  quizPanel.hidden = false;

  let currentIndex = -1;
  let historyCursor = -1;
  const history = [];
  let wrongIds = loadSet(WRONG_NOTE_KEY);
  let viewedOrder = loadProgress();
  let viewedSet = new Set(viewedOrder);

  function loadSet(key) {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(function (cardId) {
        return cards.some(function (card) {
          return card.id === cardId;
        });
      });
    } catch (error) {
      return [];
    }
  }

  function persistWrongIds() {
    window.localStorage.setItem(WRONG_NOTE_KEY, JSON.stringify(Array.from(wrongIds)));
  }

  function persistProgress() {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(viewedOrder));
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
    viewedCount.textContent = String(viewedOrder.length);
  }

  function updatePrevButton() {
    prevBtn.disabled = historyCursor <= 0;
  }

  function updateNextButton() {
    nextBtn.disabled = viewedOrder.length >= cards.length;
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

  function buildButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderViewedList() {
    viewedList.innerHTML = "";
    viewedEmpty.hidden = viewedOrder.length > 0;

    viewedOrder.forEach(function (cardId) {
      const card = getCardById(cardId);
      if (!card) {
        return;
      }
      viewedList.appendChild(
        buildButton(String(card.question_number), "mini-chip", function () {
          const index = getCardIndexById(cardId);
          if (index >= 0) {
            renderCard(index, { fromHistory: false, preserveProgress: true });
          }
        })
      );
    });
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
      const item = document.createElement("div");
      item.className = "list-item-split";

      item.appendChild(
        buildButton("문제 " + card.question_number, "list-link", function () {
          const index = getCardIndexById(card.id);
          if (index >= 0) {
            renderCard(index, { fromHistory: false, preserveProgress: true });
          }
          wrongListPanel.hidden = true;
          wrongToggleBtn.textContent = "오답노트 보기";
        })
      );

      item.appendChild(
        buildButton("삭제", "list-remove", function () {
          wrongIds.delete(card.id);
          persistWrongIds();
          updateCounts();
          renderWrongList();
          if (currentIndex >= 0 && cards[currentIndex].id === card.id) {
            updateMarkButtons(cards[currentIndex]);
            updateSaveStatus(cards[currentIndex]);
          }
        })
      );

      wrongList.appendChild(item);
    });
  }

  function updateCompletionState() {
    const done = viewedOrder.length >= cards.length;
    completionPanel.hidden = !done;
    if (done) {
      completionText.textContent = "총 " + cards.length + "문제를 모두 풀었습니다. 초기화하면 처음부터 다시 시작할 수 있습니다.";
    }
  }

  function getNextUnseenIndex() {
    const unseen = cards
      .map(function (_, index) { return index; })
      .filter(function (index) { return !viewedSet.has(cards[index].id); });

    if (!unseen.length) {
      return -1;
    }

    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  function registerViewed(cardId) {
    if (viewedSet.has(cardId)) {
      return;
    }
    viewedOrder.push(cardId);
    viewedSet.add(cardId);
    persistProgress();
    updateCounts();
    updateNextButton();
    updateCompletionState();
    renderViewedList();
  }

  function renderCard(index, options) {
    const card = cards[index];
    const fromHistory = options && options.fromHistory;
    const preserveProgress = options && options.preserveProgress;
    currentIndex = index;

    if (!fromHistory) {
      if (historyCursor < history.length - 1) {
        history.splice(historyCursor + 1);
      }
      history.push(index);
      historyCursor = history.length - 1;
    }

    if (!preserveProgress) {
      registerViewed(card.id);
    }

    cardLabel.textContent = "문제 " + card.question_number;
    progressLabel.textContent = viewedOrder.length + " / " + cards.length;
    questionImage.src = card.question_image;
    answerImage.src = card.answer_image;
    questionText.textContent = card.question_text || "";
    answerBox.classList.remove("visible");
    revealBtn.textContent = "답 확인하기";
    revealBtn.disabled = false;
    updatePrevButton();
    updateNextButton();
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

  function resetProgress() {
    viewedOrder = [];
    viewedSet = new Set();
    history.length = 0;
    historyCursor = -1;
    wrongListPanel.hidden = true;
    wrongToggleBtn.textContent = "오답노트 보기";
    window.localStorage.removeItem(PROGRESS_KEY);
    updateCounts();
    updatePrevButton();
    updateNextButton();
    updateCompletionState();
    renderViewedList();
    const nextIndex = getNextUnseenIndex();
    if (nextIndex >= 0) {
      renderCard(nextIndex, { fromHistory: false, preserveProgress: false });
    }
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
    renderCard(history[historyCursor], { fromHistory: true, preserveProgress: true });
  });

  nextBtn.addEventListener("click", function () {
    const nextIndex = getNextUnseenIndex();
    if (nextIndex >= 0) {
      renderCard(nextIndex, { fromHistory: false, preserveProgress: false });
    }
  });

  resetBtn.addEventListener("click", function () {
    resetProgress();
  });

  markWrongBtn.addEventListener("click", function () {
    saveAsWrong();
  });

  markCorrectBtn.addEventListener("click", function () {
    saveAsCorrect();
  });

  wrongToggleBtn.addEventListener("click", function () {
    const willHide = !wrongListPanel.hidden;
    wrongListPanel.hidden = willHide;
    wrongToggleBtn.textContent = willHide ? "오답노트 보기" : "오답노트 닫기";
    renderWrongList();
    if (!willHide) {
      wrongListPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  updateCounts();
  renderViewedList();
  renderWrongList();
  updateCompletionState();

  if (viewedOrder.length < cards.length) {
    const nextIndex = getNextUnseenIndex();
    if (nextIndex >= 0) {
      renderCard(nextIndex, { fromHistory: false, preserveProgress: false });
    }
  } else if (viewedOrder.length) {
    const lastViewedIndex = getCardIndexById(viewedOrder[viewedOrder.length - 1]);
    if (lastViewedIndex >= 0) {
      renderCard(lastViewedIndex, { fromHistory: false, preserveProgress: true });
    }
  }
})();
