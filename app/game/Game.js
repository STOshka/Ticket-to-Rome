import './game.css';

import { create } from '../utils/dom';
import { listen } from '../utils/events';
import { random } from '../utils/helpers';
import { APP_CONTAINER } from '../constants/layout';
import { RULES } from '../constants/rules';
import Board from '../board/Board';
import Deck from '../deck/Deck';
import Player from '../player/Player';


/** Class representing the main game logic. */
export default class Game {


  /**
   * Create the main game logic.
   * @param  {number} numberOfPlayers - The current game's number of players.
   */
  constructor(numberOfPlayers) {
    this.board = new Board();
    this.deck = new Deck();

    this.players = [];
    for (let i = 0; i < numberOfPlayers; i++) {
      this.players.push(new Player(`P${i + 1}`, this.deck));
    }
    this.players[random(this.players.length)].active = true;
    this.activePlayer = this.players.findIndex(player => player.active);

    this.turn = 1;
    this.turnActions = RULES.turnActions;

    this.playerTurn = this.playerTurn.bind(this);

    this.elements = {
      state: create('div', { class: 'state' }),
      turn: create('div', { class: 'turn' }),
      activePlayer: create('div', { class: 'active-player' }),
    };
    this.render();
  }


  /**
   * Append the game state control element to the app container
   * and listen to turn changes.
   */
  render() {
    this.elements.turn.textContent = `Turn: ${this.turn}`;
    this.elements.activePlayer.textContent = `Active: ${this.players[this.activePlayer].name}`;
    this.elements.state.appendChild(this.elements.turn);
    this.elements.state.appendChild(this.elements.activePlayer);
    APP_CONTAINER.appendChild(this.elements.state);
    listen(APP_CONTAINER, 'click', this.playerTurn);
  }


  /**
   * Update the game state control element when the turn changes.
   */
  renderUpdate() {
    this.elements.turn.textContent = `Turn: ${this.turn}`;
    this.elements.activePlayer.textContent = `Active: ${this.players[this.activePlayer].name}`;
  }


  /**
   * Control the game turns.
   * @param  {Event} e - The event dispatched when a turn changes.
   */
  playerTurn(e) {
    if (this.turnActions > 0) {
      if (e.target === this.deck.element && this.deck.cards.length) {
        this.players[this.activePlayer].drawFromDeck(this.deck);
        this.turnActions--;
      }
    }

    if (this.turnActions <= 0) {
      this.players[this.activePlayer].active = false;
      if (this.activePlayer < this.players.length - 1) {
        this.activePlayer++;
      } else {
        this.activePlayer = 0;
      }
      this.players[this.activePlayer].active = true;
      this.turnActions = RULES.turnActions;
      this.turn++;
      this.renderUpdate();
    }
  }

}
