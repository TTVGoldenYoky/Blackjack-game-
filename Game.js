// ======= GAME STATE =======
let deck = [];
let playerHand = [];
let dealerHand = [];

let balance = 1000;       // total balance
let sessionNet = 0;       // win/loss from playing
let currentBet = 50;
let roundActive = false;

// DOM elements
const balanceText = document.getElementById("balanceText");
const sessionText = document.getElementById("sessionText");

const dealerCardsDiv = document.getElementById("dealerCards");
const playerCardsDiv = document.getElementById("playerCards");
const dealerTotalDiv = document.getElementById("dealerTotal");
const playerTotalDiv = document.getElementById("playerTotal");

const betInput = document.getElementById("betInput");
const dealBtn = document.getElementById("dealBtn");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const messageP = document.getElementById("message");
const addButtons = document.querySelectorAll(".add-btn");

// ======= UTILS =======
function updateTopBar() {
  balanceText.textContent = `Balance: ${balance}`;
  const prefix = sessionNet >= 0 ? "+" : "";
  sessionText.textContent = `Win/Loss: ${prefix}${sessionNet}`;
}

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const newDeck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      newDeck.push({ rank, suit });
    }
  }
  // Simple shuffle
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function cardValue(card) {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

function handTotal(hand) {
  let total = 0;
  let aces = 0;

  hand.forEach(card => {
    total += cardValue(card);
    if (card.rank === "A") aces++;
  });

  // Adjust Aces from 11 to 1 if needed
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function renderHands(hideDealerHole = true) {
  dealerCardsDiv.innerHTML = "";
  playerCardsDiv.innerHTML = "";

  // Dealer cards
  dealerHand.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    if (hideDealerHole && index === 0 && roundActive) {
      cardDiv.textContent = "🂠";
    } else {
      cardDiv.textContent = `${card.rank}${card.suit}`;
    }
    dealerCardsDiv.appendChild(cardDiv);
  });

  // Player cards
  playerHand.forEach(card => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.textContent = `${card.rank}${card.suit}`;
    playerCardsDiv.appendChild(cardDiv);
  });

  // Totals
  if (roundActive) {
    dealerTotalDiv.textContent = "Dealer total: ?";
  } else {
    dealerTotalDiv.textContent = `Dealer total: ${handTotal(dealerHand)}`;
  }
  playerTotalDiv.textContent = `Player total: ${handTotal(playerHand)}`;
}

// ======= ROUND LOGIC =======
function startRound() {
  messageP.textContent = "";

  currentBet = parseInt(betInput.value, 10) || 0;
  if (currentBet <= 0) {
    messageP.textContent = "Bet must be more than 0.";
    return;
  }
  if (currentBet > balance) {
    messageP.textContent = "You don't have enough balance for that bet.";
    return;
  }

  if (deck.length < 10) {
    deck = createDeck();
  }

  // Take bet (but only settle at end)
  roundActive = true;
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];

  dealBtn.disabled = true;
  hitBtn.disabled = false;
  standBtn.disabled = false;

  renderHands(true);

  const playerTotal = handTotal(playerHand);
  if (playerTotal === 21) {
    // Natural blackjack
    endRound("blackjack");
  }
}

function playerHit() {
  if (!roundActive) return;

  playerHand.push(deck.pop());
  renderHands(true);

  const total = handTotal(playerHand);
  if (total > 21) {
    endRound("player_bust");
  }
}

function playerStand() {
  if (!roundActive) return;

  // Dealer's turn
  let dealerTotal = handTotal(dealerHand);
  while (dealerTotal < 17) {
    dealerHand.push(deck.pop());
    dealerTotal = handTotal(dealerHand);
  }
  renderHands(false);

  const playerTotal = handTotal(playerHand);

  if (dealerTotal > 21) {
    endRound("dealer_bust");
  } else if (dealerTotal > playerTotal) {
    endRound("dealer_win");
  } else if (dealerTotal < playerTotal) {
    endRound("player_win");
  } else {
    endRound("push");
  }
}

function endRound(result) {
  roundActive = false;
  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;

  renderHands(false);

  let msg = "";
  let change = 0; // how much balance changes from this round

  switch (result) {
    case "blackjack":
      change = Math.floor(currentBet * 1.5);
      balance += change;
      sessionNet += change;
      msg = `Blackjack! You win ${change}.`;
      break;
    case "player_bust":
      change = -currentBet;
      balance += change;
      sessionNet += change;
      msg = `You bust! You lose ${currentBet}.`;
      break;
    case "dealer_bust":
      change = currentBet;
      balance += change;
      sessionNet += change;
      msg = `Dealer busts! You win ${currentBet}.`;
      break;
    case "dealer_win":
      change = -currentBet;
      balance += change;
      sessionNet += change;
      msg = `Dealer wins. You lose ${currentBet}.`;
      break;
    case "player_win":
      change = currentBet;
      balance += change;
      sessionNet += change;
      msg = `You win ${currentBet}!`;
      break;
    case "push":
      msg = "Push. No one wins.";
      break;
  }

  messageP.textContent = msg;
  updateTopBar();
}

// ======= ADD BALANCE BUTTONS =======
addButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const amount = parseInt(btn.dataset.amount, 10);
    balance += amount;
    // Note: top-ups do NOT change sessionNet (only actual win/loss)
    updateTopBar();
  });
});

// ======= EVENT LISTENERS =======
dealBtn.addEventListener("click", startRound);
hitBtn.addEventListener("click", playerHit);
standBtn.addEventListener("click", playerStand);

// Init
deck = createDeck();
updateTopBar();
renderHands(false);
messageP.textContent = "Set your bet and press Deal to start.";
