/************* Variables Globales *************/
let players = [];
let dealer = { hand: [], score: 0 };
let currentPlayerIndex = 0;
let numPlayers = 0;
let gameOver = false;
let bank = 0;
let roundsPlayed = 0;
const maxRounds = 5; // Après 5 rounds, les mises pourront être renouvelées

function Player(id) {
  this.id = id;
  this.hands = [];
  this.currentHandIndex = 0;
  this.outcome = ""; // Message à afficher dans la case du joueur
  this.initialBet = 0; // Mise initiale pour round auto
}

/************* Paquet de cartes et calcul *************/
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let deck = [];
function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
}
function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}
function calculateHand(cards) {
  let total = 0, aces = 0;
  for (let card of cards) {
    let value;
    if (card.rank === 'A') { value = 11; aces++; }
    else if (['K','Q','J'].includes(card.rank)) { value = 10; }
    else { value = parseInt(card.rank); }
    total += value;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

/************* Phase de configuration et pari *************/
document.getElementById('startGame').addEventListener('click', startGame);
function startGame() {
  roundsPlayed = 0;
  numPlayers = parseInt(document.getElementById('numPlayers').value);
  bank = parseInt(document.getElementById('bankAmount').value);
  updateBankDisplay();
  players = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push(new Player(i + 1));
  }
  // Vider l'affichage du croupier pour la nouvelle manche
  document.getElementById('dealerHand').innerHTML = "";
  document.getElementById('dealerScore').textContent = "Score: ?";
  document.getElementById('setupContainer').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
  startBetting();
}
function startBetting() {
  const playersSection = document.getElementById('playersSection');
  playersSection.innerHTML = '';
  players.forEach(player => {
    let playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    let header = document.createElement('h2');
    header.textContent = "Joueur " + player.id;
    playerDiv.appendChild(header);
    // Zone de pari pour chaque joueur
    let betDiv = document.createElement('div');
    betDiv.className = 'betContainer';
    let betInput = document.createElement('input');
    betInput.type = 'number';
    betInput.min = '1';
    betInput.placeholder = 'Votre mise';
    betInput.id = 'betPlayer' + player.id;
    betInput.addEventListener('keydown', (e) => {
      if (e.key === "Enter") { betBtn.click(); }
    });
    betDiv.appendChild(betInput);
    let betBtn = document.createElement('button');
    betBtn.textContent = 'Valider mise';
    betBtn.addEventListener('click', () => {
      let mainBet = parseInt(betInput.value);
      if (!mainBet || mainBet <= 0 || mainBet > bank) {
        alert("Mise invalide ou supérieure au montant de la banque (" + bank + ")");
      } else {
        player.initialBet = mainBet;
        player.hands = [];  // Réinitialiser les mains pour ce round
        player.hands.push({
          cards: [],
          bet: mainBet,
          natural: (mainBet && 0) // par défaut false
        });
        bank -= mainBet;
        updateBankDisplay();
        betDiv.innerHTML = "Mise validée: " + mainBet;
        // Dès que tous les joueurs ont validé leur pari, on distribue les cartes.
        if (players.every(p => p.hands.length > 0)) {
          dealInitialCards();
        }
      }
    });
    betDiv.appendChild(betBtn);
    playerDiv.appendChild(betDiv);
    playersSection.appendChild(playerDiv);
  });
}
function updateBankDisplay() {
  document.getElementById('bankDisplay').textContent = "Banque: " + bank;
  if (bank <= 0) {
    document.getElementById('bankDisplay').textContent += " - Game Over";
  }
}

/************* Distribution initiale *************/
function dealInitialCards() {
  dealer = { hand: [], score: 0 };
  currentPlayerIndex = 0;
  gameOver = false;
  createDeck();
  shuffleDeck();
  // Distribuer 2 cartes à chaque joueur
  for (let i = 0; i < 2; i++) {
    players.forEach(p => {
      p.hands[0].cards.push(deck.pop());
    });
  }
  // Pour le croupier, on dévoile sa première carte et on cache le reste
  dealer.hand.push(deck.pop());
  updateDisplay();
}

/************* Affichage du jeu *************/
function updateDisplay() {
  // Affichage du croupier : dès que les cartes sont distribuées, la première carte est visible.
  const dealerHandDiv = document.getElementById('dealerHand');
  dealerHandDiv.innerHTML = "";
  if (dealer.hand.length > 0) {
    // Toujours afficher la première carte, même si le tour des joueurs n'est pas terminé
    let firstCard = document.createElement('div');
    firstCard.className = 'card';
    firstCard.textContent = dealer.hand[0].rank + dealer.hand[0].suit;
    dealerHandDiv.appendChild(firstCard);
    // Pour le reste, si le tour des joueurs n'est pas terminé, on affiche "??"
    if (currentPlayerIndex < players.length) {
      for (let i = 1; i < dealer.hand.length; i++) {
        let hiddenCard = document.createElement('div');
        hiddenCard.className = 'card';
        hiddenCard.textContent = "??";
        dealerHandDiv.appendChild(hiddenCard);
      }
      document.getElementById('dealerScore').textContent = "Score: ?";
    } else {
      // Si le round est terminé, révéler toutes les cartes
      for (let i = 1; i < dealer.hand.length; i++) {
        let card = document.createElement('div');
        card.className = 'card';
        card.textContent = dealer.hand[i].rank + dealer.hand[i].suit;
        dealerHandDiv.appendChild(card);
      }
      dealer.score = calculateHand(dealer.hand);
      document.getElementById('dealerScore').textContent = "Score: " + dealer.score;
    }
  }
  // Affichage des joueurs
  const playersSection = document.getElementById('playersSection');
  playersSection.innerHTML = "";
  players.forEach((player, pIndex) => {
    let playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    let header = document.createElement('h2');
    header.textContent = "Joueur " + player.id + (pIndex === currentPlayerIndex ? " (à jouer)" : "");
    playerDiv.appendChild(header);
    if (gameOver && player.outcome) {
      let outcomeP = document.createElement('p');
      outcomeP.className = "outcome";
      outcomeP.textContent = player.outcome;
      // Appliquer la couleur selon le résultat
      if (player.outcome.includes("Gagné")) outcomeP.classList.add("win");
      else if (player.outcome.includes("Perdu")) outcomeP.classList.add("lose");
      else outcomeP.classList.add("tie");
      playerDiv.appendChild(outcomeP);
    }
    player.hands.forEach((handObj, handIndex) => {
      let handContainer = document.createElement('div');
      handContainer.className = 'handContainer';
      let subHeader = document.createElement('p');
      subHeader.style.fontWeight = 'bold';
      
      // Vérifier si c'est un blackjack naturel (exactement 2 cartes totalisant 21)
      let isNatural = (handObj.cards.length === 2 && calculateHand(handObj.cards) === 21);
      let betDisplay = handObj.bet;
      subHeader.textContent = "Main " + (handIndex + 1) + " | Mise: " + betDisplay +
                               (isNatural ? " (Blackjack)" : "");
      handContainer.appendChild(subHeader);
      
      let handDiv = document.createElement('div');
      handDiv.className = 'hand';
      handObj.cards.forEach(card => {
        let cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.textContent = card.rank + card.suit;
        handDiv.appendChild(cardDiv);
      });
      handContainer.appendChild(handDiv);
      
      let score = calculateHand(handObj.cards);
      let scoreP = document.createElement('p');
      scoreP.textContent = "Score: " + score + (score > 21 ? " - BUSTED!" : "");
      handContainer.appendChild(scoreP);
      
      // Affichage des actions pour le joueur actif et la main en cours
      if (!gameOver && pIndex === currentPlayerIndex &&
          handIndex === players[currentPlayerIndex].currentHandIndex) {
        let actionsDiv = document.createElement('div');
        actionsDiv.className = 'actionButtons';
        // Si BUST, passer automatiquement
        if (score > 21) {
          let msg = document.createElement('p');
          msg.style.fontStyle = 'italic';
          msg.textContent = "BUSTED!";
          handContainer.appendChild(msg);
          setTimeout(() => { nextHand(); }, 1000);
        } else if (score === 21 && handObj.cards.length === 2) {
          // Blackjack naturel : message et passage automatique
          let msg = document.createElement('p');
          msg.style.fontStyle = 'italic';
          msg.textContent = "Blackjack !";
          handContainer.appendChild(msg);
          setTimeout(() => { nextHand(); }, 1000);
        } else if (score === 21 && handObj.cards.length > 2) {
          // 21 avec 3 cartes ou plus est traité comme une main gagnante normale
          let msg = document.createElement('p');
          msg.style.fontStyle = 'italic';
          msg.textContent = "21 atteint";
          handContainer.appendChild(msg);
          setTimeout(() => { nextHand(); }, 1000);
        } else {
          // Bouton Split
          if (handObj.cards.length === 2 && handObj.cards[0].rank === handObj.cards[1].rank) {
            if (bank >= handObj.bet) {
              let splitBtn = document.createElement('button');
              splitBtn.className = 'split';
              splitBtn.textContent = "Split";
              splitBtn.addEventListener('click', playerSplit);
              actionsDiv.appendChild(splitBtn);
            }
          }
          // Bouton Double : uniquement si la main contient exactement 2 cartes
          if (handObj.cards.length === 2) {
            let currentScore = calculateHand(handObj.cards);
            if ([9,10,11].includes(currentScore) || handObj.cards.some(c => c.rank === 'A')) {
              let doubleBtn = document.createElement('button');
              doubleBtn.className = 'double';
              doubleBtn.textContent = "Double";
              doubleBtn.addEventListener('click', playerDouble);
              actionsDiv.appendChild(doubleBtn);
            }
          }
          // Bouton Tirer
          let hitBtn = document.createElement('button');
          hitBtn.className = 'hit';
          hitBtn.textContent = "Tirer";
          hitBtn.addEventListener('click', playerHit);
          actionsDiv.appendChild(hitBtn);
          // Bouton Rester
          let standBtn = document.createElement('button');
          standBtn.className = 'stand';
          standBtn.textContent = "Rester";
          standBtn.addEventListener('click', playerStand);
          actionsDiv.appendChild(standBtn);
          handContainer.appendChild(actionsDiv);
        }
      }
      playerDiv.appendChild(handContainer);
    });
    playersSection.appendChild(playerDiv);
  });
}

/************** Actions du joueur **************/
function playerHit() {
  let player = players[currentPlayerIndex];
  let currentHand = player.hands[player.currentHandIndex];
  currentHand.cards.push(deck.pop());
  updateDisplay();
}
function playerStand() {
  nextHand();
}
function playerDouble() {
  let player = players[currentPlayerIndex];
  let currentHand = player.hands[player.currentHandIndex];
  // Vérifier que la main contient exactement 2 cartes
  if (currentHand.cards.length !== 2) return;
  let additionalBet = currentHand.bet;
  if (bank < additionalBet) {
    alert("Banque insuffisante pour doubler.");
    return;
  }
  bank -= additionalBet;
  updateBankDisplay();
  currentHand.bet *= 2;
  // Distribuer uniquement une carte supplémentaire et terminer le tour
  currentHand.cards.push(deck.pop());
  updateDisplay();
  nextHand();
}
function playerSplit() {
  let player = players[currentPlayerIndex];
  let currentHand = player.hands[player.currentHandIndex];
  if (currentHand.cards.length === 2 && currentHand.cards[0].rank === currentHand.cards[1].rank) {
    if (bank < currentHand.bet) {
      alert("Banque insuffisante pour splitter.");
      return;
    }
    bank -= currentHand.bet;
    updateBankDisplay();
    let card1 = currentHand.cards[0];
    let card2 = currentHand.cards[1];
    player.hands[player.currentHandIndex] = {
      cards: [card1],
      bet: currentHand.bet,
      natural: false
    };
    player.hands.push({
      cards: [card2],
      bet: currentHand.bet,
      natural: false
    });
    // Distribuer une carte supplémentaire pour chaque main split
    player.hands[player.currentHandIndex].cards.push(deck.pop());
    player.hands[player.hands.length - 1].cards.push(deck.pop());
    updateDisplay();
  } else {
    alert("Impossible de splitter cette main.");
  }
}
function nextHand() {
  let player = players[currentPlayerIndex];
  if (player.currentHandIndex < player.hands.length - 1) {
    player.currentHandIndex++;
    updateDisplay();
  } else {
    currentPlayerIndex++;
    if (currentPlayerIndex < players.length) {
      updateDisplay();
    } else {
      dealerPlay();
    }
  }
}

/************** Tour du croupier et Résolution **************/
function dealerPlay() {
  // Révéler toutes les cartes du croupier après que tous les joueurs ont terminé
  while (calculateHand(dealer.hand) <= 16) {
    dealer.hand.push(deck.pop());
    updateDisplay();
  }
  dealer.score = calculateHand(dealer.hand);
  updateDisplay();
  determineWinners();
}
function determineWinners() {
  gameOver = true;
  players.forEach(player => {
    let outcomeMessage = "";
    player.hands.forEach((hand, index) => {
      let handScore = calculateHand(hand.cards);
      // Paiement : blackjack naturel paye 2.5× (gain de 1.5×), sinon gain 2× la mise
      if (handScore > 21) {
        outcomeMessage += "Main " + (index + 1) + ": Perdu. ";
      } else if (dealer.score > 21 || handScore > dealer.score) {
        if (hand.cards.length === 2 && handScore === 21) {
          outcomeMessage += "Main " + (index + 1) + ": Blackjack ! Gagné: " + Math.floor(hand.bet * 2.5) + ". ";
          bank += Math.floor(hand.bet * 2.5);
        } else {
          outcomeMessage += "Main " + (index + 1) + ": Gagné: " + (hand.bet * 2) + ". ";
          bank += hand.bet * 2;
        }
      } else if (handScore === dealer.score) {
        outcomeMessage += "Main " + (index + 1) + ": Égalité. ";
        bank += hand.bet;
      } else {
        outcomeMessage += "Main " + (index + 1) + ": Perdu. ";
      }
    });
    player.outcome = outcomeMessage;
  });
  updateBankDisplay();
  document.getElementById('result').innerHTML = "Résolution terminée.";
  document.getElementById('newRoundBtn').style.display = 'inline-block';
  updateDisplay();
}

/************** Rounds Automatiques / Nouvelle Manche **************/
document.getElementById('newRoundBtn').addEventListener('click', newRound);
function newRound() {
  // Réinitialiser pour permettre de saisir de nouvelles mises
  players.forEach(p => {
    p.hands = [];
    p.currentHandIndex = 0;
    p.outcome = "";
  });
  currentPlayerIndex = 0;
  gameOver = false;
  roundsPlayed = 0;
  document.getElementById('result').innerHTML = '';
  document.getElementById('newRoundBtn').style.display = 'none';
  // Vider l'affichage du croupier
  document.getElementById('dealerHand').innerHTML = "";
  document.getElementById('dealerScore').textContent = "Score: ?";
  startBetting();
}