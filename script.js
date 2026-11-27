
const STORAGE_KEY = "pairGeneratorData";

const DEFAULT_PARTICIPANTS = [
  "Ta", "Hi", "Ry", "Lu",
  "Al", "St", "Em", "Sa"
];

const generateBtn = document.querySelector("#generateBtn");
const pairsContainer = document.querySelector("#pairs");
const roundDisplay = document.querySelector("#round");
const statusDisplay = document.querySelector("#status");

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Invalid saved data:", error);
    }
  }

  return {
    round: 0,
    participants: [...DEFAULT_PARTICIPANTS],
    history: []
  };
}

let pairingData = loadData();

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(pairingData)
  );
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] =
      [result[j], result[i]];
  }

  return result;
}

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

function createSchedule(participants) {
  const players = shuffle(participants);

  const fixed = players[0];
  let rotating = players.slice(1);

  const schedule = [];

  for (let round = 0; round < 7; round++) {
    const current = [fixed, ...rotating];
    const pairs = [];

    for (let i = 0; i < 4; i++) {
      pairs.push([
        current[i],
        current[7 - i]
      ]);
    }

    schedule.push(pairs);

    rotating = [
      rotating[rotating.length - 1],
      ...rotating.slice(0, -1)
    ];
  }

  return schedule;
}

function generatePairs() {
  if (pairingData.round >= 7) {
    pairingData.round = 0;
    pairingData.history = [];
  }

  if (pairingData.round === 0) {
    pairingData.schedule =
      createSchedule(pairingData.participants);
  }

  const pairs =
    pairingData.schedule[pairingData.round];

  pairingData.round++;

  pairingData.history.push({
    round: pairingData.round,
    date: new Date().toISOString(),
    pairs
  });

  saveData();

  renderPairs(pairs);
  updateRound();

  statusDisplay.textContent = "Pairs generated!";
}

function renderPairs(pairs) {
  pairsContainer.innerHTML = "";

  pairs.forEach((pair, index) => {
    const card = document.createElement("div");

    card.className = "pair-card";
    card.textContent =
      `Pair ${index + 1}: ${pair[0]} × ${pair[1]}`;

    pairsContainer.appendChild(card);
  });
}

function updateRound() {
  roundDisplay.textContent =
    `Round: ${pairingData.round} / 7`;
}

function renderLastRound() {
  const history = pairingData.history;

  if (history.length > 0) {
    renderPairs(history[history.length - 1].pairs);
  }
}

generateBtn.addEventListener("click", generatePairs);

updateRound();
renderLastRound();
