
const generateBtn = document.querySelector("#generateBtn");
const pairsContainer = document.querySelector("#pairs");
const roundDisplay = document.querySelector("#round");
const statusDisplay = document.querySelector("#status");

// 履歴を取得
async function loadHistory() {
  try {
    const response = await fetch("/api/pairing");

    if (!response.ok) {
      throw new Error("Failed to load history.");
    }

    const data = await response.json();

    roundDisplay.textContent = `Round: ${data.round} / 7`;

    if (data.history.length > 0) {
      renderPairs(data.history[data.history.length - 1].pairs);
    }

  } catch (error) {
    statusDisplay.textContent = error.message;
  }
}

// ペアを画面に表示
function renderPairs(pairs) {
  pairsContainer.innerHTML = "";

  pairs.forEach((pair, index) => {
    const card = document.createElement("div");

    card.className = "pair-card";
    card.textContent = `Pair ${index + 1}: ${pair[0]} × ${pair[1]}`;

    pairsContainer.appendChild(card);
  });
}

// 新しいペアを生成
async function generatePairs() {
  generateBtn.disabled = true;
  statusDisplay.textContent = "Generating...";

  try {
    const response = await fetch("/api/pairing", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Failed to generate pairs.");
    }

    const data = await response.json();

    renderPairs(data.pairs);

    roundDisplay.textContent =
      `Round: ${data.round} / 7`;

    statusDisplay.textContent = "Pairs generated!";

  } catch (error) {
    statusDisplay.textContent = error.message;
  } finally {
    generateBtn.disabled = false;
  }
}

generateBtn.addEventListener("click", generatePairs);

loadHistory();
