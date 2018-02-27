module.exports = function() {
  PAIR_BASE = 42;
  TOK_BASE = 60;
  FLUSH_BASE = 70;
  STRAIGHT_BASE = 80;
  FULLHOUSE_BASE = 90;
  NONE = 'none'
  var ANALYSIS = {
    "count": 0
  }
  function cardAnalysis(hole, community, state, player, players) {
    var hand = [];
    var score = 0;
    if (state == 'pre-flop') {
      score = preFlopStrategy(sortCards(hole), players)
      score = (score) ? score : 5;
    } else {
      if (community.length) {
        hand = handEval(player.cards, community);
        score = postFlopStrategy(hand, sortCards(hole), sortCards(community), players)
      }
    }

    if (player.actions[state][0]['type'] == 'call') {

      ANALYSIS[player['name']]['called'][state][1]++
        if (ANALYSIS[player['name']]['called'][state][0] == NONE)
          ANALYSIS[player['name']]['called'][state][0] = score;
        else {
          ANALYSIS[player['name']]['called'][state][0] =
            Math.ceil(score * (1 / ANALYSIS[player['name']]['called'][state][1]) +
              (ANALYSIS[player['name']]['called'][state][0] * (1 - (1 / ANALYSIS[player['name']]['called'][state][1]))));
        }

    } else if ((player.actions[state][0]['type'] == 'raise') || (player.actions[state][0]['type'] == 'all-in')) {
      ANALYSIS[player['name']]['raised'][state][1]++
        if (ANALYSIS[player['name']]['raised'][state][0] == NONE)
          ANALYSIS[player['name']]['raised'][state][0] = score;
        else {
          ANALYSIS[player['name']]['raised'][state][0] =
            Math.ceil(score * (1 / ANALYSIS[player['name']]['raised'][state][1]) +
              (ANALYSIS[player['name']]['raised'][state][0] * (1 - (1 / ANALYSIS[player['name']]['raised'][state][1]))));
        }
    }
    if ((player.actions[state][0]['type'] == 'call') ||
      (player.actions[state][0]['type'] == 'raise') ||
      (player.actions[state][0]['type'] == 'all-in')) {
      bet = player.actions[state][0]['bet']
      var betType;
      if (player.actions[state][0]['type'] == 'all-in')
        betType = 'all-in'
      else if (bet < 30){ // low bet
        betType = 'low';
      }
      else if (bet < 55){ // med bet
        betType = 'med';
      }
      else{ // high bet
        betType = 'high';
        }


      ANALYSIS[player['name']]['betting'][state][betType][1]++;
      if (ANALYSIS[player['name']]['betting'][state][betType][0] == NONE) {
        ANALYSIS[player['name']]['betting'][state][betType][0] = score
      } else {
        ANALYSIS[player['name']]['betting'][state][betType][0] =
          Math.ceil(score * (1 / ANALYSIS[player['name']]['betting'][state][betType][1]) +
            (ANALYSIS[player['name']]['betting'][state][betType][0] *
              (1 - (1 / ANALYSIS[player['name']]['betting'][state][betType][1]))));
      }
    }

  }

  function record(game) {
    //  //console.log(game)
    n = game.players.length
    lastp = game.players[n - 1]
    for (var p = 0; p < n; p++) {
      player = game.players[p]
      if (ANALYSIS[player['name']] == undefined) {
        ANALYSIS[player['name']] = {
          'wagered': 0,
          "calls": 0,
          'folds': 0,
          'raises': 0,
          'called': {
            'pre-flop': [NONE, 0],
            'flop': [NONE, 0],
            'turn': [NONE, 0],
            'river': [NONE, 0]
          },
          'raised': {
            'pre-flop': [NONE, 0],
            'flop': [NONE, 0],
            'turn': [NONE, 0],
            'river': [NONE, 0]
          },
          'betting': {
            'pre-flop': {
              'low': [NONE, 0],
              'med': [NONE, 0],
              'high': [NONE, 0]
            },
            'flop': {
              'low': [NONE, 0],
              'med': [NONE, 0],
              'high': [NONE, 0],
              'all-in': [NONE, 0]
            },
            'turn': {
              'low': [NONE, 0],
              'med': [NONE, 0],
              'high': [NONE, 0],
              'all-in': [NONE, 0]
            },
            'river': {
              'low': [NONE, 0],
              'med': [NONE, 0],
              'high': [NONE, 0],
              'all-in': [NONE, 0]
            }
          }
        };
      } else {
        if (player['actions'][game.state]) {
          //console.log(player['actions'][game.state])
          la = player['actions'][game.state].length - 1
          //console.log(ANALYSIS[player['name']]['betting'][game.state])
          //console.log("la "+la)

          if (player['actions'][game.state][la]['type'] == 'fold')
            ANALYSIS[player['name']]['folds']++
          else if (player['actions'][game.state][la]['type'] == 'call'){
            ANALYSIS[player['name']]['calls']++
            if (!player.wagered)
              ANALYSIS[player['name']]['wagered'] = player.wagered;
          }
          else if (player['actions'][game.state][la]['type'] == 'raise'){
              ANALYSIS[player['name']]['raises']++
              if (!player.wagered)
                ANALYSIS[player['name']]['wagered'] = player.wagered;
          }
        }
      }
      if (player.cards) {
        s = ['pre-flop', 'flop', 'turn', 'river'];
        s.forEach(function(state) {
          if (player.actions[state]) {
            hasCase = true;
            community = [];
            switch (state) {
              case 'pre-flop':
                break;
              case 'flop':
                community = game.community.slice(0, 3);
                break;
              case 'turn':
                community = game.community.slice(0, 4);
                break;
              case 'river':
                community = game.community
              default:
                hasCase = false
            }
            if (hasCase) {
              cardAnalysis(player.cards, community, state, player, game.players);
            }

          }
        });
      }
      lastp = player;
    }
    if (ANALYSIS['count'] < game.hand)
      ANALYSIS['count'] = game.hand;
  }
  var info = {
    name: "Shakey",
    email: "holsi006@umn.edu",
    btcWallet: "NONE"
  };
  opportunity = 0;
  risk = 0;

  function cardVal(card) {
    if (card)
      return "23456789TJQKA".indexOf(card[0]) + 2;
    return 0;
  }

  function cardValues(cards) {
    vals = [];
    for (var i = 0; i < cards.length; i++)
      vals.push(cardVal(cards[i]));
    return vals;
  }

  function sumVals(cards) {
    c = cardValues(cards);
    return c.reduce((a, b) => a + b);
  }

  function sortCards(cards) {
    return cards.sort(function(a, b) {
      return cardVal(a) - cardVal(b)
    });
  }

  function multiples(arr) {
    var Multi = function(val, quant) {
      this.value = val;
      this.quantity = quant;
    };
    var a = [],
      b = [],
      prev = null;

    for (var i = 0; i < arr.length; i++) {
      preV = (prev == null) ? -1 : cardVal(prev)
      if (cardVal(arr[i]) !== preV) {
        a.push(cardVal(arr[i]));
        b.push(1);
      } else {
        b[b.length - 1]++;
      }
      prev = arr[i];
    }
    result = []
    for (var i = 0; i < a.length; i++) {
      obj = new Multi(a[i], b[i]);
      result.push(obj);
    }
    result = result.sort(function(a, b) {
      return b.quantity - a.quantity;
    });
    return result.sort(result);
  }

  function flushEval(hole, cards) {
    suits = {
      'c': 0,
      'd': 0,
      'h': 0,
      's': 0
    };
    hsuits = {
      'c': 0,
      'd': 0,
      'h': 0,
      's': 0
    };
    if (hole.length) {
      hsuits[hole[0][1]] = hsuits[hole[0][1]] + 1
      hsuits[hole[1][1]] = hsuits[hole[1][1]] + 1
    }
    flush = {
      'suit': null,
      'comm': 0,
      'hole': 0
    };
    if (cards) {
      for (var i = 0; i < cards.length; i++) {
        suits[cards[i][1]] = suits[cards[i][1]] + 1;
        if (suits[cards[i][1]] >= 3) { // 3 matching suits in communityCards
          flush['suit'] = cards[i][1];
          flush['comm'] = suits[cards[i][1]]
          if (hole.length) {
            if (hsuits[cards[i][1]] === 1)
              flush['hole'] = 1; // we have 4 or 5 matching suits
            else if (hsuits[cards[i][1]] === 2)
              flush['hole'] = 2; // we have a flush
          }
        }
      }
    }
    return flush
  }


  function handEval(hole, communityCards) {
    suitedCards = flushEval(hole, communityCards);
    cards = hole.concat(communityCards);
    cards = cards.sort(cards);
    hand = []
    m = multiples(cards)
    var pairs = 0;
    var tok = 0;
    var fok = 0;
    var fullhouse = 0;
    var flush = 0;
    var straight = 0;
    var highcard = 0;
    for (var i = 0; i < m.length; i++) {
      match = 0
      if (m[i].quantity == 4) {
        fok = 1;
        match = 1;
        highcard = 0;
      } else if (m[i].quantity == 3) {
        tok += 1;
        match = 1;
        highcard = 0;
      } else if (m[i].quantity == 2) {
        pairs += 1;
        match = 1;
        highcard = 0;
      }
      if (match)
        hand = (hand.length == 1) ? cards.filter(card => cardVal(card) == m[i].value) : hand.concat(cards.filter(card => cardVal(card) == m[i].value));
      if ((tok && pairs) || (tok && fok) || (fok && pairs) || (tok == 2))
        fullhouse = 1;

      if (cards.length > 2) { //post flop; check for straight and flush
        if (suitedCards['suit']) { // flush risk/opportunity
          if (suitedCards['hole'] && ((suitedCards['hole'] + suitedCards['comm']) > 4)) { // flush
            flush = 1;
          } else { // risk
            flush = 0;
          }
        }
        if (flush) {
          hand = cards.filter(card => (card[1] == suitedCards['suit']));
        }
        // check for straight
        strTemp = cardValues(sortCards(cards));
        strTemp = strTemp.filter((v, i, a) => a.indexOf(v) === i); // remove dups
        if (strTemp[strTemp.length] == 14)
          strTemp = [1].concat(strTemp); // add '1' for ace
        iter = strTemp.length - 5;
        for (var i = 0; i < iter; i++) {
          val = strTemp[i + 4] // value of highest rank in straight
          if (strTemp[i] + 4 == val) {
            h = []
            chk = val;
            for (var j = cards.length - 1; j >= 0; j--) {
              if (cardVal(cards[j]) == chk) {
                h.push(cards[j]);
                chk--;
              }
              if (val == 5) h.push(cards[cards.length]) // add ace if 'a2345' is straight
            }
            hand = h.reverse();
            straight = 1;
          }
        }
      }
      highcard = (pairs || tok || fok || fullhouse) ? 0 : 1;
      handtypes = {
        "highc": highcard,
        "pair": pairs,
        "tok": tok,
        "fok": fok,
        "flush": flush,
        "straight": straight,
        "fullh": fullhouse
      }
      //console.log(handtypes)
      var htype = '';
      for (h in handtypes) {
        if (handtypes[h] > 1)
          htype = "2 " + h
        else if (handtypes[h]) {
          if (h == "highc") {
            htype = "highc";
            if (hole.length)
              hand.push(hole[1]);
            else
              hand.push(cards[cards.length - 1]);
            htype = "highc";
          } else htype = h
        }
      }
      return [htype, hand];
    }
  }

  function nearStraight(hole, communityCards) {
    near = 0;
    cards = hole.concat(communityCards);
    cards = cardValues(sortCards(cards));
    cards = cards.filter((v, i, a) => a.indexOf(v) === i); // remove dups
    if (cards[cards.length] == 14)
      cards = [1].concat(cards); // add '1' for ace
    iter = cards.length - 5;
    cards = cards.sort(cards);
    for (var i = 0; i <= iter; i++) {
      val = cards[i + 3] // value of highest of 4 cards
      if ((cards[i] + 4 == val) || (cards[i] + 3 == val)) {
        h = [];
        chk = cardVal(cards[i]);
        if (val == 5) h.push(cards[cards.length]) // add ace
        for (var j = 0; j < cards.length; j++) {
          if (cardVal(cards[j]) == chk)
            h.push(cards[j]);
          chk++;
          if (chk > val) break;
        }
        near = 1;
      }
    }
    return near;
  }

  function fullhouseEval(hand, hole, com, players) {
    certainty = 0;
    hole = (hole.length) ? hole.sort(hole) : [];
    com = com.sort(com);
    hp = (hand.indexOf(hole[1]) + 1) ? 1 : 0; //holeHigh in hand
    lp = (hand.indexOf(hole[0]) + 1) ? 1 : 0; //holeLow in hand
    pp = ((cardVal(hole[0]) == cardVal(hole[1])) && hp) ? 1 : 0; // pocket-pair in hand
    if (hp || lp) {
      certainty = FULLHOUSE_BASE;
      certainty += (hp) ? cardVal(hole[1]) / 2 : 0;
      certainty += (lp) ? cardVal(hole[1]) / 2 : 0;
    }
    return Math.ceil(certainty);

  }

  function overpair(hand, hole, com, players) {
    oprisk = 0;
    hole = sortCards(hole);
    com = sortCards(com);
    hp = (hand.indexOf(hole[1]) + 1) ? 1 : 0;
    lp = (hand.indexOf(hole[0]) + 1) ? 1 : 0;
    pp = ((cardVal(hole[0]) == cardVal(hole[1])) && hp) ? 1 : 0; // pocket-pair in hand
    cp = (lp || hp) ? 0 : 1; // community-pair
    if (cp)
      oprisk = -sumVals(hand) * 2;
    else {
      card = (hand.indexOf(hole[0] + 1)) ? hole[1] : hole[0];
      for (var i = 0; i < com.length; i++) {
        diff = (cardVal(com[i]) - cardVal(card));
        oprisk -= (diff > 0) ? diff * 0.25 : 0;
      }
      if (hp) oprisk -= (15 - cardVal(hole[1]))* 0.25
      else if (lp) oprisk -= (15 - cardVal(hole[0]))* 0.25
    }
    //console.log(risk)
    return oprisk
  }

  function flushRisk(hand, hole, com, players) {
    flush = flushEval(hole, com);
    cards = cardValues(hand);
    risk = 0;
    if (flush.suit) {

      if ((flush.hole + flush.comm) > 4) {
        if (flush.hole) {
          hcard = (hole[1][1] == flush.suit) ? hole[1] : hole[0];
          for (var i = 14; i > 1; i--)
            if ((cards.indexOf(i) + 1 == 0) && (i > cardVal(hcard))) risk--;
          risk = risk * (3 - flush.hole) * 0.3;
        } else { // community flush
          risk = -100;
        }
        if (players) {
          risk -= players.length;

        }
      } else { //risk, but no flush
        if (flush.comm == 4)
          risk -= (players.length) * .5;
        else
          risk -= players.length * (flush.comm - 1) * .25;
      }
    }
    return risk;
  }

  function ThreeOfAKind(hand, holeCards, community, players) {
    risk = overpair(hand, holeCards, community, players)
    if (sumVals(hand) + risk)
      return TOK_BASE + Math.ceil(risk * (1 - (1/players.length)));
    else
      return risk;
  }

  function preFlopStrategy(holeCards, players) {
    certainty = 0;
    hand = handEval(holeCards, []);
    pair = (hand[1].length == 2)
    if (pair) { // pocket-pair
      certainty = PAIR_BASE + Math.ceil((cardVal(hand[1][0]) * cardVal(hand[1][0])) / 2)
      if (sumVals(holeCards) < 18)
        certainty = Math.min(certainty, 110);
    } else { // no pair
      certainty = (((cardVal(holeCards[1]) > 11) && (cardVal(holeCards[0]) > 9)) ||
          ((cardVal(holeCards[1]) > 12) && (cardVal(holeCards[0]) > 8))) ?
        Math.floor(cardVal(holeCards[1]) * sumVals(holeCards) * 0.15) : 0;

      certainty += ((cardVal(holeCards[1]) > 11) && (coin)) ?
        Math.floor(sumVals(holeCards) * 1.13) : 0;
      certainty += ((cardVal(holeCards[0]) > 5) && (cardVal(holeCards[1]) == (1 + cardVal(holeCards[0])))) ? 10 : 0
      certainty += Math.ceil((holeCards[0][1] == holeCards[1][1]) ? cardVal(holeCards[1]) : 0); // suitedCards
    }
    //console.log('pfc: ' + certainty)
    return certainty;
  }

  function postFlopStrategy(hand, holeCards, community, players) {
    round = 1.5 + (5 - community.length) % 4;
    var certainty = 0;
    //console.log("##################################################    "+hand[0])
    switch (hand[1].length) {
      case 7:
      case 6:
      case 5:
        switch (hand[0]) {
          case 'fullh':
            certainty = fullhouseEval(hand, holeCards, community, players)
            break;
          case 'flush':
            certainty = FLUSH_BASE * round;
            certainty += flushRisk(hand, holeCards, community, players);
            break;
          case 'straight':
            max = (hand[1].indexOf(holeCards[0]) > hand[1].indexOf(holeCards[1])) ? hand[1].indexOf(holeCards[0]) : hand[1].indexOf(holeCards[1])
            certainty = STRAIGHT_BASE * round + (5 - max) + ((cardVal(hand[1][max]) * cardVal(hand[1][max])) * 1.15);
            certainty += flushRisk(hand, holeCards, community, players);
            if (community.length == 5)
              var hc = cardVal(hand[1][hand[1].length-1]);
              certainty += (hc > 12)? 100*(hc - 12) : hc;
        }
        break;
      case 4: // 2pair
        if ((hand[0] == 'fok') && (hand[1].indexOf(holeCards[0])) && (hand[1].indexOf(holeCards[0])))
          certainty += PAIR_BASE;
        certainty += (hand[1].indexOf(holeCards[0]) + 1) ? 0 : PAIR_BASE;
        certainty += (hand[1].indexOf(holeCards[1]) + 1) ? 0 : PAIR_BASE;
        risk = overpair(hand[1].slice(0, 2), holeCards, community, players);
        certainty += (risk) ? Math.floor(risk*0.5) : 0;
        risk = overpair(hand[1].slice(2), holeCards, community, players);
        certainty += (risk) ? Math.floor(risk*0.5) : 0;
        certainty += flushRisk(hand, holeCards, community, players);
        break;
      case 3: // ThreeOfAKind
        certainty = ThreeOfAKind(hand[1], holeCards, community, players);
        certainty += flushRisk(hand, holeCards, community, players);
        certainty += 45;
        break;
      case 2: // pair
        certainty = PAIR_BASE;
        risk = overpair(hand[1], holeCards, community, players);
        certainty += (risk) ? Math.floor(risk * 1.25) : 20;
        break;
      case 1: //highcard
        if ((hand[1].length < 5) && (nearStraight([], community)))
          certainty -= 10;
        else if (nearStraight(holeCards, community)) {
          certainty += (5 - community.length) * 12;

        }
    }
    return certainty;
  }


  function update(game) {
    var hand;
    var betting_bonus = {
      "fullh": 5,
      'flush': 4,
      'straight': 4,
      'fok': 4,
      'tok': 3,
      'pairs': 1.5,
      'pair': 1.25,
      'highc': 0.85
    }
    players = game.players.filter(p => p.state == 'active');
    if (game.state !== "complete") {
      //console.log(game.self)
      community = sortCards(game.community);
      holeCards = sortCards(game.self.cards)
      hand = handEval(holeCards, community);
      certainty = 0;
      bet = 0;
      coin = (Math.floor(Math.random() * 2))
      randomizer = (10 + (Math.random()*11))
      switch (game.state) {
        case 'pre-flop':
          certainty = preFlopStrategy(holeCards, players) + randomizer ;
          break;
        case 'flop':
          certainty = postFlopStrategy(hand, holeCards, community, players) + randomizer*2;
          break;
        case 'turn':
          certainty = postFlopStrategy(hand, holeCards, community, players)
          certainty += (betting_bonus[hand[0]] > 1.2) ? 3 * betting_bonus[hand[0]] : 0
          break;
        case 'river':
          certainty = postFlopStrategy(hand, holeCards, community, players);
          certainty += (((Math.random() * 100) > 33) && (!game.betting.call)) ? Math.floor(5 + Math.random() * 50) : 0
          certainty += ((game.self.name == players[players.length - 1].name) && (game.betting.call == 0) && (certainty > 75)) ? 45 : 0;
          break;
      }



      if (community.length) {
        testhand = handEval([], community);
        if (hand[0] == testhand[0]) {
          certainty -= postFlopStrategy(hand, [], community, players)
        }
      }

      bet = 0;

      if (true) {
        bet = generalizedAlgorithimicBetting(game, players, certainty, bet, betting_bonus[hand[0]])
      }
      if (game.hand > 25) {
        cfrWeight = cfrFrequenceyBetting(game, players, certainty, bet)

        if (cfrWeight && (cfrWeight.aggro))
          certainty += 20
        if (cfrWeight && cfrWeight.dynam && (certainty < 40))
          certainty += certainty
        bet1 = abHandEstimationBetting(game, players, certainty)
        bet2 = gcrAverageHandBetting(game, players, certainty, bet, betting_bonus[hand[0]])
        seq = [0]
        if (game.betting.call) seq = seq.concat([game.betting.call, game.betting.raise])
        else seq = seq.concat([game.betting.raise, 2*game.betting.raise])
        bets = [bet, bet1, bet2];
        bets = bets.sort(bets)
        uniqueBets = bets.filter(function(item, pos, self) {
          return self.indexOf(item) == pos;
        })
        adjbet = (bets.reduce((a, b) => a + b)/bets.length)
        if (adjbet > seq[2]) bet = seq[2];
        else if (adjbet > seq[1]) bet = seq[1];
        else bet = seq[0];
      }
    }
    record(game);
    return bet
  };

  //******************************************************************************
  // betting algorithms
  //******************************************************************************
  function generalizedAlgorithimicBetting(game, players, certainty, bet, bonus) {
    certainty += (game.self.wagered) ? game.self.wagered * bonus : 0

    if (certainty >= 95) {

      bet = (game.betting.call)? game.betting.call: game.betting.raise;
      chance = (Math.floor(Math.random() * 100) + 1);
      if ((chance > (certainty - (50 * bonus))) && (game.betting.raise < (game.self.chips / 4))) {
        bet = Math.floor(certainty - 90 + (Math.random() * 10) + 1) + game.betting.raise * bonus;
        bet = Math.max(bet, game.betting.raise)
      }
    } else if (certainty >= 80) {
      bet = game.betting.call;
      if (((Math.floor(Math.random() * 100) + 1) > certainty) && (game.betting.raise < (game.self.chips / 4))) {
        bet = Math.ceil(2 * game.betting.call * bonus);
        bet = Math.max(bet, game.betting.raise)
      }
    } else if (certainty >= 50) {
      if (game.betting.call < certainty / 2) {
        bet = game.betting.call;
        if ((Math.floor(Math.random() * 100) + 1) < certainty) bet = game.betting.raise;
      } else if ((game.betting.call < certainty) && (Math.floor(Math.random() * 100) + 1) < certainty)
        bet = game.betting.call
    }
    pot = game.players.map(player => player.wagered).reduce((a, b) => a + b);

    bet = ((game.state == 'river') && (!bet) && (!game.betting.call) && ((Math.random() * 95) > certainty) && (certainty >= 20)) ? game.betting.call * bonus : bet;
    if ((game.state == 'river') && (!bet) && (!game.betting.call) && (players[players.length - 1].name = game.self.name) && (pot <= players.length * 25))
      bet = Math.max(game.betting.call * bonus, game.betting.raise);
    if ((game.sate == 'river') && (certainty >= 25) && (bet < certainty)) {
      bet = Math.max(bet, game.betting.raise)
    }
    if ((game.state == 'pre-flop') && (certainty >= 1.5 * game.betting.call)) {
      bet = Math.max(game.betting.call, bet);
    }
    bet = (game.state == 'pre-flop') ? Math.min(bet, game.betting.raise * 3) : bet; // limits preflop to 3*raise
    if (certainty < 5) {
      bet = 0;
    } else {
      bet += Math.ceil((bet == 0 && (game.betting.raise < 25) )? ((Math.floor(Math.random() * 100) > 95)? game.betting.raise : 0) : bet)
    }
    return bet;
  }

  function gcrAverageHandBetting(game, players, certainty, bet, bonus) {
    raised = 0;
    betLimit = 0;
    safeRange = [1000, 0]
    players.forEach(function(player) {
      betLimit = (betLimit < player.chips) ? player.chips : betLimit;

      if (ANALYSIS[player.name] && (player.name != game.self.name)) {
        //console.log(ANALYSIS[player.name])
        if (ANALYSIS[player.name].called[game.state][0] != NONE)
          safeRange[0] = (ANALYSIS[player.name].called[game.state][0] < safeRange[0]) ? ANALYSIS[player.name].called[game.state][0] : safeRange[0];
        if (ANALYSIS[player.name].raised[game.state][0] != NONE)
          safeRange[1] = (ANALYSIS[player.name].raised[game.state][0] > safeRange[0]) ? ANALYSIS[player.name].raised[game.state][0] : safeRange[1];
      }
    });
    variance = Math.ceil((100 - game.hand) / 25) + 1
    min = {
      'pre-flop': 10,
      'flop': 25,
      'turn': 45,
      'river': 30
    }
    if ((bet == 0) && (safeRange[0] < 1000) && ((certainty + variance) > Math.max(safeRange[0], min[game.state]))) {
      bet = game.betting.call;
    }
    raiseLimit = Math.max(safeRange[1], min[game.state]);
    multiplier = Math.ceil((certainty - raiseLimit) / 9)
    multiplier += (game.state == 'river' && (Math.random*100 > certainty)) ? 1 : 0;
    if (safeRange[1] > 5){
      if ((bet <= game.betting.call) && ((certainty + variance) >= raiseLimit)) {
        bet = game.betting.raise * bonus;
      }
    } else bet = 10 + (Math.random() * 11)
    bet = (game.state == 'pre-flop') ? Math.min(bet, game.betting.raise * 3) : bet; // limits preflop to 3*raise
    bet = ((game.state == 'river') && (!bet) && (!game.betting.call) && (Math.random*100 > certainty) && (certainty >= 30)) ? game.betting.raise * bonus : bet;
    if ((game.state == 'pre-flop') && ((game.betting.call == 5) || (game.betting.call == 10)) && (certainty >= 2 * game.betting.call))
      bet = game.betting.call;

    bet = Math.min(betLimit, bet)
    return Math.ceil(bet);
  }

  function cfrFrequenceyBetting(game, players, certainty) {
    d = false;
    a = false;
    ret = 0;
    for (var i = 0; i < players.length; i++) {
      if ((players[i].actions[game.state]) && (ANALYSIS[players[i].name])) {
        if ((players[i].actions[game.state][0].type) == 'raise') {
          calls = (ANALYSIS[players[i].name].calls) ? ANALYSIS[players[i].name].calls : 1;
          folds = (ANALYSIS[players[i].name].folds) ? ANALYSIS[players[i].name].folds : 1;
          raises = (ANALYSIS[players[i].name].raises) ? ANALYSIS[players[i].name].raises : 1;
          limit = calls + folds + raises
          if (limit > 30) {
            dynam = (70 < Math.min((100 * folds / limit) + 10))
            aggro = 0;
            if (calls)
              aggro = (70 < (limit*(limit+raises)/calls))
            d = d || dynam;
            a = a || aggro;
          }
        }
      }
    }
    return {'dynam':d, 'aggro':a}
  }

  function abHandEstimationBetting(game, players, certainty) {
    var estimatedHand = []
    var betLimit;
    var betType;
    //console.log(ANALYSIS)
    players.forEach(function(player) {
      betLimit = (betLimit < player.chips) ? player.chips : betLimit;
      bet;
      if (ANALYSIS[player.name] && (player.name != game.self.name)) {
        if (player.actions[game.state]) {
          if (player.actions[game.state][0]['type'] == 'all-in')
            betType = 'all-in'
          else if (player.wagered < 30) // low bet
            betType = 'low';
          else if (player.wagered < 55) // med bet
            betType = 'med';
          else // high bet
            betType = 'high';

          if (ANALYSIS[player['name']]['betting'][game.state][betType][0] != NONE) {
            estimatedHand.push(ANALYSIS[player['name']]['betting'][game.state][betType][0])
            //console.log(player.name)
            //console.log(ANALYSIS[player['name']]['betting'][game.state])
          }
        }
      }

    });
    averageHand = estimatedHand.reduce(function(p, c, i, a) {
      return p + (c / a.length)
    }, 0);
    if (averageHand){
      bestHand = estimatedHand[estimatedHand.length - 1];
      if (((certainty + Math.ceil(game.hand / 5)) >= averageHand) && ((game.betting.call <= (bestHand))))
        bet = game.betting.call;
      else if ((certainty + Math.ceil(game.hand / 20)) >= bestHand)
        bet = game.betting.raise;
      //console.log(bet)
      return bet;
    } else {
      return 10 + (Math.random() * 11)
    }

  }
  return {
    update: update,
    info: info
  }

}
