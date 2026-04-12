(function () {
  const cards = Array.isArray(window.QUIZ_CARDS) ? window.QUIZ_CARDS : [];

  const totalCount = document.getElementById("total-count");
  const quizPanel = document.getElementById("quiz-panel");
  const emptyPanel = document.getElementById("empty-panel");
  const cardLabel = document.getElementById("card-label");
  const progressLabel = document.getElementById("progress-label");
  const questionImage = document.getElementById("question-image");
  const answerImage = document.getElementById("answer-image");
  const questionText = document.getElementById("question-text");
  const answerBox = document.getElementById("answer-box");
  const revealBtn = document.getElementById("reveal-btn");
  const nextBtn = document.getElementById("next-btn");

  totalCount.textContent = String(cards.length);

  if (!cards.length) {
    emptyPanel.hidden = false;
    return;
  }

  quizPanel.hidden = false;

  let currentIndex = -1;
  let viewedCount = 0;

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

  function renderCard(index) {
    const card = cards[index];
    currentIndex = index;
    viewedCount += 1;
    cardLabel.textContent = `페이지 ${card.page} / 문제 ${card.question_number}`;
    progressLabel.textContent = `${viewedCount}번째로 본 카드`;
    questionImage.src = card.question_image;
    answerImage.src = card.answer_image;
    questionText.textContent = card.question_text || "";
    answerBox.classList.remove("visible");
    revealBtn.textContent = "답 확인하기";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  revealBtn.addEventListener("click", function () {
    answerBox.classList.add("visible");
    revealBtn.textContent = "답 확인됨";
  });

  nextBtn.addEventListener("click", function () {
    renderCard(pickRandomIndex());
  });

  renderCard(pickRandomIndex());
})();
