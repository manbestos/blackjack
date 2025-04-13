document.addEventListener('DOMContentLoaded', () => {
  // Références DOM
  const nameInput = document.getElementById('nameInput');
  const moneyInput = document.getElementById('moneyInput');
  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('start-screen');
  const gameTable = document.getElementById('game-table');
  const balanceDisplay = document.getElementById('balance-display');
  const dealButton = document.getElementById('dealButton');
  const seats = document.querySelectorAll('.player-seat');
  const balanceBox = document.getElementById('balance-box');
  const dealerArea = document.querySelector('.dealer-area');
  let dealerCardsContainer = document.querySelector('.dealer-cards');
  let dealerTotalDiv = document.querySelector('.dealer-total');
  const winningDisplay = document.getElementById('winning-display');
  const newRoundButton = document.getElementById('newRoundButton');

  let playerName = "";
  let remainingMoney = 0;
  let roundStarted = false;
  let moneyAtRound = 0; // Montant initial au début du round
  let activePlayers = [];
  let currentPlayerIndex = 0;
  // Pour chaque siège, playerHands[seat.id] sera soit un tableau (main normale)
  // ou un objet pour mains splitées (avec propriété "hands" et currentHandIndex).
  let playerHands = {};
  let dealerHand = [];

  // -------------------------------
  // 1) Création et mélange du deck
  // -------------------------------
  const cardSuits = ['♣', '♦', '♥', '♠'];
  const cardRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [];
  function createDeck() {
    let newDeck = [];
    for (let suit of cardSuits) {
      for (let rank of cardRanks) {
        newDeck.push({ rank, suit });
      }
    }
    return newDeck;
  }
  function shuffleDeck(deckArray) {
    for (let i = deckArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckArray[i], deckArray[j]] = [deckArray[j], deckArray[i]];
    }
    return deckArray;
  }

  // -------------------------------
  // 2) Création des éléments de carte
  // -------------------------------
  function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    let textColorClass = (card.suit === '♦' || card.suit === '♥') ? 'red' : 'black';
    const cornerTL = document.createElement('div');
    cornerTL.classList.add('card-corner', 'top-left', textColorClass);
    cornerTL.innerHTML = `${card.rank}<br>${card.suit}`;
    cardDiv.appendChild(cornerTL);
    const cornerBR = document.createElement('div');
    cornerBR.classList.add('card-corner', 'bottom-right', textColorClass);
    cornerBR.innerHTML = `${card.rank}<br>${card.suit}`;
    cardDiv.appendChild(cornerBR);
    const centerDiv = document.createElement('div');
    centerDiv.classList.add('card-center', textColorClass);
    centerDiv.innerHTML = createCardCenterHTML(card.rank, card.suit);
    cardDiv.appendChild(centerDiv);
    return cardDiv;
  }
  function createCardCenterHTML(rank, suit) {
    if (rank === 'A') {
      return `<div class="card-center-symbol">${suit}</div>`;
    } else if (["J", "Q", "K"].includes(rank)) {
      return `<div class="card-center-symbol">${rank}${suit}</div>`;
    } else {
      const count = parseInt(rank);
      let html = `<div class="card-center-grid">`;
      for (let i = 0; i < count; i++) {
        html += `<div class="card-center-symbol">${suit}</div>`;
      }
      html += `</div>`;
      return html;
    }
  }
  // Empilement diagonal des cartes
  function dealOneCard(targetElement, seatId) {
    if (deck.length === 0) {
      console.log("Le deck est vide !");
      return;
    }
    const card = deck.pop();
    const cardElement = createCardElement(card);
    const existingCards = targetElement.querySelectorAll('.card');
    const index = existingCards.length;
    const offsetLeft = 20;
    const offsetTop = 10;
    const rotation = 5;
    cardElement.style.left = `${index * offsetLeft}px`;
    cardElement.style.top = `${index * offsetTop}px`;
    cardElement.style.transform = `rotate(${index * rotation}deg)`;
    cardElement.style.zIndex = index + 1;
    targetElement.appendChild(cardElement);
    console.log(`Carte distribuée : ${card.rank}${card.suit}`);
    if (seatId) {
      if (!document.getElementById(seatId).dataset.split) {
        playerHands[seatId].push(card);
        updateHandTotal(seatId);
      }
    } else {
      dealerHand.push(card);
      updateDealerTotal();
    }
  }
  function dealOneCardForSplit(seat, handIndex, targetElement) {
    if (deck.length === 0) return;
    let card = deck.pop();
    let cardElement = createCardElement(card);
    let existingCards = targetElement.querySelectorAll('.card');
    let index = existingCards.length;
    const offsetLeft = 20;
    const offsetTop = 10;
    const rotation = 5;
    cardElement.style.left = `${index * offsetLeft}px`;
    cardElement.style.top = `${index * offsetTop}px`;
    cardElement.style.transform = `rotate(${index * rotation}deg)`;
    cardElement.style.zIndex = index + 1;
    targetElement.appendChild(cardElement);
    playerHands[seat.id].hands[handIndex].push(card);
    updateSplitHandTotal(seat, handIndex);
  }

  // -------------------------------
  // 3) Calcul des totaux (soft et hard)
  // -------------------------------
  function calculateHandTotals(hand) {
    let softTotal = 0;
    hand.forEach(card => {
      if (card.rank === 'A') softTotal += 11;
      else if (['J','Q','K'].includes(card.rank)) softTotal += 10;
      else softTotal += parseInt(card.rank);
    });
    let hardTotal = softTotal;
    let aces = hand.filter(card => card.rank === 'A').length;
    while (hardTotal > 21 && aces > 0) {
      hardTotal -= 10;
      aces--;
    }
    return { softTotal, hardTotal };
  }
  function updateHandTotal(seatId) {
    const hand = playerHands[seatId];
    const totals = calculateHandTotals(hand);
    const seatElement = document.getElementById(seatId);
    let totalDiv = seatElement.querySelector('.hand-total');
    if (!totalDiv) {
      totalDiv = document.createElement('div');
      totalDiv.classList.add('hand-total');
      seatElement.appendChild(totalDiv);
    }
    if (totals.hardTotal > 21) {
      totalDiv.textContent = "BUST";
    } else if (totals.softTotal <= 21 && totals.softTotal !== totals.hardTotal) {
      totalDiv.textContent = `Total: ${totals.softTotal}/${totals.hardTotal}`;
    } else {
      totalDiv.textContent = `Total: ${totals.hardTotal}`;
    }
  }
  function updateDealerTotal() {
    const totals = calculateHandTotals(dealerHand);
    dealerTotalDiv.textContent = `Total: ${totals.hardTotal}`;
  }
  function updateSplitHandTotal(seat, handIndex) {
    let hand = playerHands[seat.id].hands[handIndex];
    const totals = calculateHandTotals(hand);
    let handContainer = seat.querySelector(`.split-hand[data-hand-index="${handIndex}"]`);
    let totalDiv = handContainer.querySelector('.hand-total');
    if (totals.hardTotal > 21) {
      totalDiv.textContent = "BUST";
    } else if (totals.softTotal <= 21 && totals.softTotal !== totals.hardTotal) {
      totalDiv.textContent = `Total: ${totals.softTotal}/${totals.hardTotal}`;
    } else {
      totalDiv.textContent = `Total: ${totals.hardTotal}`;
    }
  }

  // -------------------------------
  // 4) Gestion du tour (Tirer / Rester / Split / Double)
  // -------------------------------
  function getCardValue(card) {
    if (card.rank === 'A') return 11;
    else if (['J','Q','K'].includes(card.rank)) return 10;
    else return parseInt(card.rank);
  }
  function activateTurnForPlayer(seat) {
    // Vérification immédiate du Blackjack (2 cartes totalisant 21)
    if (playerHands[seat.id].length === 2) {
      const totals = calculateHandTotals(playerHands[seat.id]);
      if (totals.hardTotal === 21) {
        let bjDiv = document.createElement('div');
        bjDiv.classList.add('blackjack-msg');
        bjDiv.textContent = "BlackJack";
        seat.appendChild(bjDiv);
        console.log("BlackJack détecté pour le siège " + seat.id);
        setTimeout(() => { nextPlayerTurn(); }, 1000);
        return;
      }
    }
    let turnDiv = document.createElement('div');
    turnDiv.classList.add('turn-options');
    turnDiv.innerHTML = `
      <button class="hit-button">Tirer</button>
      <button class="stand-button">Rester</button>
    `;
    // Option Double
    if (playerHands[seat.id].length === 2) {
      const currentBet = parseFloat(seat.dataset.bet);
      if (remainingMoney >= currentBet) {
        let doubleButton = document.createElement('button');
        doubleButton.classList.add('double-button');
        doubleButton.textContent = "Double";
        turnDiv.appendChild(doubleButton);
        doubleButton.addEventListener('click', () => {
          remainingMoney -= currentBet;
          seat.dataset.bet = (currentBet * 2).toString();
          let betDisplay = seat.querySelector('.bet-display');
          if (betDisplay) {
            betDisplay.textContent = `Mise: ${seat.dataset.bet}`;
          }
          balanceDisplay.textContent = `Solde restant: ${remainingMoney}`;
          const containerId = seat.dataset.cardsContainerId;
          const seatContainer = document.getElementById(containerId);
          dealOneCard(seatContainer, seat.id);
          seat.removeChild(turnDiv);
          nextPlayerTurn();
        });
      }
    }
    // Option Split si les 2 cartes ont la même valeur
    if (!seat.dataset.split) {
      let hand = playerHands[seat.id];
      if (hand.length === 2 && getCardValue(hand[0]) === getCardValue(hand[1])) {
        let splitButton = document.createElement('button');
        splitButton.classList.add('split-button');
        splitButton.textContent = "Split";
        turnDiv.appendChild(splitButton);
        splitButton.addEventListener('click', () => {
          performSplit(seat);
          seat.removeChild(turnDiv);
          activateTurnForSplitHand(seat, 0);
        });
      }
    }
    seat.appendChild(turnDiv);
    turnDiv.querySelector('.hit-button').addEventListener('click', () => {
      const containerId = seat.dataset.cardsContainerId;
      const seatContainer = document.getElementById(containerId);
      dealOneCard(seatContainer, seat.id);
      const totals = calculateHandTotals(playerHands[seat.id]);
      if (totals.hardTotal >= 21) {
        seat.removeChild(turnDiv);
        nextPlayerTurn();
      }
    });
    turnDiv.querySelector('.stand-button').addEventListener('click', () => {
      seat.removeChild(turnDiv);
      nextPlayerTurn();
    });
  }
  function activateTurnForSplitHand(seat, handIndex) {
    let handContainer = seat.querySelector(`.split-hand[data-hand-index="${handIndex}"]`);
    let turnDiv = document.createElement('div');
    turnDiv.classList.add('turn-options');
    turnDiv.innerHTML = `
      <button class="hit-button">Tirer</button>
      <button class="stand-button">Rester</button>
    `;
    handContainer.appendChild(turnDiv);
    turnDiv.querySelector('.hit-button').addEventListener('click', () => {
      const cardsContainer = handContainer.querySelector('.cards-container');
      dealOneCardForSplit(seat, handIndex, cardsContainer);
      const totals = calculateHandTotals(playerHands[seat.id].hands[handIndex]);
      if (totals.hardTotal >= 21) {
        handContainer.removeChild(turnDiv);
        nextSplitHand(seat);
      }
    });
    turnDiv.querySelector('.stand-button').addEventListener('click', () => {
      handContainer.removeChild(turnDiv);
      nextSplitHand(seat);
    });
  }
  function nextPlayerTurn() {
    currentPlayerIndex++;
    console.log("Next player turn:", currentPlayerIndex, "out of", activePlayers.length);
    if (currentPlayerIndex < activePlayers.length) {
      activateTurnForPlayer(activePlayers[currentPlayerIndex]);
    } else {
      dealerTurn();
    }
  }
  function nextSplitHand(seat) {
    if (playerHands[seat.id].currentHandIndex === 0) {
      playerHands[seat.id].currentHandIndex = 1;
      activateTurnForSplitHand(seat, 1);
    } else {
      nextPlayerTurn();
    }
  }
  function dealerTurn() {
    // Révéler la deuxième carte si le croupier n'en a qu'une
    if (dealerHand.length === 1) {
      dealOneCard(dealerCardsContainer);
      updateDealerTotal();
    }
    function dealerDraw() {
      const totals = calculateHandTotals(dealerHand);
      if (totals.hardTotal <= 16) {
        dealOneCard(dealerCardsContainer);
        updateDealerTotal();
        setTimeout(dealerDraw, 1000);
      } else {
        updateDealerTotal();
        console.log("Le croupier s'arrête.");
        evaluateRound();
      }
    }
    dealerDraw();
  }
  // -------------------------------
  // 5) Fonction Split
  // -------------------------------
  function performSplit(seat) {
    let originalHand = playerHands[seat.id];
    let betValue = parseFloat(seat.dataset.bet);
    if (remainingMoney < betValue) {
      alert("Solde insuffisant pour splitter.");
      return;
    }
    remainingMoney -= betValue;
    balanceDisplay.textContent = `Solde restant: ${remainingMoney}`;
    playerHands[seat.id] = {
      hands: [
        [originalHand[0]],
        [originalHand[1]]
      ],
      currentHandIndex: 0
    };
    seat.dataset.split = "true";
    seat.innerHTML = `<span class="player-label">${playerName} (Split)</span><br>`;
    let hand1Container = document.createElement('div');
    hand1Container.classList.add('split-hand');
    hand1Container.setAttribute('data-hand-index', 0);
    let cardsContainer1 = document.createElement('div');
    cardsContainer1.classList.add('cards-container');
    cardsContainer1.id = `${seat.id}-hand0`;
    hand1Container.appendChild(cardsContainer1);
    let totalDiv1 = document.createElement('div');
    totalDiv1.classList.add('hand-total');
    hand1Container.appendChild(totalDiv1);
    
    let hand2Container = document.createElement('div');
    hand2Container.classList.add('split-hand');
    hand2Container.setAttribute('data-hand-index', 1);
    let cardsContainer2 = document.createElement('div');
    cardsContainer2.classList.add('cards-container');
    cardsContainer2.id = `${seat.id}-hand1`;
    hand2Container.appendChild(cardsContainer2);
    let totalDiv2 = document.createElement('div');
    totalDiv2.classList.add('hand-total');
    hand2Container.appendChild(totalDiv2);
    
    seat.appendChild(hand1Container);
    seat.appendChild(hand2Container);
    
    dealOneCardForSplit(seat, 0, cardsContainer1);
    dealOneCardForSplit(seat, 1, cardsContainer2);
    updateSplitHandTotal(seat, 0);
    updateSplitHandTotal(seat, 1);
  }

  // -------------------------------
  // 6) Évaluation de la manche (victoire / défaite / blackjack)
  // -------------------------------
  moneyAtRound = remainingMoney; // Enregistré au début du round
  function evaluateRound() {
    let dealerTotals = calculateHandTotals(dealerHand);
    let dealerFinal = dealerTotals.hardTotal;
    console.log(`Total croupier: ${dealerFinal}`);
    let totalWinnings = 0;
    activePlayers.forEach(seat => {
      let bet = parseFloat(seat.dataset.bet);
      if (!seat.dataset.split) {
        let hand = playerHands[seat.id];
        // Vérifier si c'est un blackjack (2 cartes totalisant 21)
        if (hand.length === 2 && calculateHandTotals(hand).hardTotal === 21) {
          totalWinnings += bet * 2.5;
          console.log(`Siège ${seat.id} BlackJack!`);
          let seatElement = document.getElementById(seat.id);
          let bjDiv = seatElement.querySelector('.blackjack-msg');
          if (!bjDiv) {
            bjDiv = document.createElement('div');
            bjDiv.classList.add('blackjack-msg');
            seatElement.appendChild(bjDiv);
          }
          bjDiv.textContent = "BlackJack";
        } else {
          let totals = calculateHandTotals(hand);
          let playerFinal = totals.hardTotal;
          if (playerFinal > 21) {
            console.log(`Siège ${seat.id} perd (BUST).`);
          } else if (dealerFinal > 21 || playerFinal > dealerFinal) {
            totalWinnings += bet * 2;
            console.log(`Siège ${seat.id} gagne.`);
          } else if (playerFinal === dealerFinal) {
            totalWinnings += bet;
            console.log(`Siège ${seat.id} fait égalité.`);
          } else {
            console.log(`Siège ${seat.id} perd.`);
          }
        }
      } else {
        let betForSeat = bet;
        playerHands[seat.id].hands.forEach(hand => {
          let totals = calculateHandTotals(hand);
          let playerFinal = totals.hardTotal;
          if (playerFinal > 21) {
            console.log(`Main splittée perd (BUST).`);
          } else if (dealerFinal > 21 || playerFinal > dealerFinal) {
            totalWinnings += betForSeat * 2;
            console.log(`Main splittée gagne.`);
          } else if (playerFinal === dealerFinal) {
            totalWinnings += betForSeat;
            console.log(`Main splittée fait égalité.`);
          } else {
            console.log(`Main splittée perd.`);
          }
        });
      }
    });
    remainingMoney += totalWinnings;
    balanceBox.textContent = `Solde restant: ${remainingMoney}`;
    console.log(`Nouveau solde: ${remainingMoney}`);
    if (totalWinnings > 0) {
      winningDisplay.textContent = `Montant gagné: ${totalWinnings}`;
      winningDisplay.style.display = "block";
      setTimeout(() => {
        winningDisplay.style.display = "none";
        newRoundButton.style.display = "block";
      }, 3000);
    } else {
      newRoundButton.style.display = "block";
    }
  }

  // -------------------------------
  // 7) Fonction Nouvelle Manche
  // -------------------------------
  function newRound() {
    roundStarted = false;
    dealerHand = [];
    if (dealerCardsContainer) {
      dealerCardsContainer.innerHTML = "";
    }
    if (dealerTotalDiv) {
      dealerTotalDiv.textContent = "";
    }
    seats.forEach(seat => {
      seat.innerHTML = `
        <span class="seat-top-text">Take a seat</span>
        <span class="seat-status">+</span>
      `;
      delete seat.dataset.occupied;
      delete seat.dataset.bet;
      delete seat.dataset.split;
      delete seat.dataset.cardsContainerId;
    });
    playerHands = {};
    activePlayers = [];
    currentPlayerIndex = 0;
    deck = createDeck();
    shuffleDeck(deck);
    
    balanceDisplay.style.display = "block";
    balanceDisplay.textContent = `Solde restant: ${remainingMoney}`;
    balanceBox.style.display = "block";
    // Réafficher le conteneur "Distribuer" centré
    let dealContainer = document.getElementById('deal-container');
    dealContainer.style.display = "flex";
    dealContainer.style.justifyContent = "center";
    dealContainer.style.width = "100%";
    dealButton.style.display = "block";
    newRoundButton.style.display = "none";
  }

  // -------------------------------
  // 8) Événements et logique générale
  // -------------------------------
  function checkInputs() {
    const name = nameInput.value.trim();
    const amount = parseFloat(moneyInput.value);
    startButton.disabled = !(name !== "" && !isNaN(amount) && amount > 0);
  }
  nameInput.addEventListener('input', checkInputs);
  moneyInput.addEventListener('input', checkInputs);
  startButton.addEventListener('click', () => {
    playerName = nameInput.value.trim();
    remainingMoney = parseFloat(moneyInput.value);
    balanceDisplay.textContent = `Solde restant: ${remainingMoney}`;
    startScreen.style.display = "none";
    gameTable.style.display = "flex";
    deck = createDeck();
    shuffleDeck(deck);
  });
  function updateDealButtonState() {
    let takenSeats = 0, validSeats = 0;
    seats.forEach(seat => {
      if (seat.dataset.occupied === "true") {
        takenSeats++;
        if (seat.dataset.bet && parseFloat(seat.dataset.bet) > 0) {
          validSeats++;
        }
      }
    });
    dealButton.disabled = !(takenSeats > 0 && takenSeats === validSeats);
  }
  seats.forEach(seat => {
    seat.addEventListener('click', () => {
      if (roundStarted || seat.dataset.occupied === "true") return;
      seat.dataset.occupied = "true";
      updateDealButtonState();
      seat.innerHTML = `
        <span class="player-label">${playerName}</span>
        <div class="bet-area">
          <input type="number" class="bet-input" placeholder="Mise" min="1" />
          <br/>
          <button class="bet-button">Valider mise</button>
          <div class="bet-error"></div>
        </div>
      `;
      const betInput = seat.querySelector('.bet-input');
      const betButton = seat.querySelector('.bet-button');
      const betError = seat.querySelector('.bet-error');
      betButton.addEventListener('click', () => {
        const betValue = parseFloat(betInput.value);
        if (isNaN(betValue) || betValue <= 0) {
          betError.textContent = "La mise doit être supérieure à 0.";
          return;
        }
        if (betValue > remainingMoney) {
          betError.textContent = "Mise supérieure au solde disponible.";
          return;
        }
        seat.dataset.bet = betValue;
        seat.innerHTML = `
          <span class="player-label">${playerName}</span><br>
          <span class="bet-display">Mise: ${betValue}</span>
          <div class="cards-container"></div>
        `;
        seat.dataset.cardsContainerId = `${seat.id}-cards-container`;
        const seatDiv = seat.querySelector('.cards-container');
        seatDiv.setAttribute('id', seat.dataset.cardsContainerId);
        playerHands[seat.id] = [];
        remainingMoney -= betValue;
        balanceDisplay.textContent = `Solde restant: ${remainingMoney}`;
        console.log(`Siège ${seat.id} validé avec mise ${betValue}.`);
        updateDealButtonState();
      });
    });
  });
  dealButton.addEventListener('click', () => {
    moneyAtRound = remainingMoney; // Enregistrer le solde au début du round
    roundStarted = true;
    dealButton.style.display = "none";
    document.getElementById('deal-container').style.display = "none";
    seats.forEach(seat => {
      if (!seat.dataset.bet) {
        seat.innerHTML = "";
      }
    });
    console.log("Manche lancée. Les mises sont fixées.");
    balanceDisplay.style.display = "none";
    balanceBox.style.display = "block";
    balanceBox.textContent = `Solde restant: ${remainingMoney}`;
    // Distribution initiale de 2 cartes par joueur
    seats.forEach(seat => {
      if (seat.dataset.bet) {
        const containerId = seat.dataset.cardsContainerId;
        const seatContainer = document.getElementById(containerId);
        if (!seatContainer) return;
        dealOneCard(seatContainer, seat.id);
        dealOneCard(seatContainer, seat.id);
      }
    });
    // Distribution initiale pour le croupier : ne distribuer qu'une seule carte visible
    dealerHand = [];
    if (!dealerCardsContainer) {
      dealerCardsContainer = document.createElement('div');
      dealerCardsContainer.classList.add('cards-container', 'dealer-cards');
      dealerArea.appendChild(dealerCardsContainer);
    } else {
      dealerCardsContainer.innerHTML = "";
    }
    dealOneCard(dealerCardsContainer);
    updateDealerTotal();
    // Définir l'ordre des tours (de droite à gauche)
    activePlayers = Array.from(seats).filter(seat => seat.dataset.bet);
    activePlayers.reverse();
    currentPlayerIndex = 0;
    console.log("Active players:", activePlayers);
    if (activePlayers.length > 0) {
      activateTurnForPlayer(activePlayers[currentPlayerIndex]);
    } else {
      dealerTurn();
    }
  });
  newRoundButton.addEventListener('click', () => {
    newRound();
  });
});