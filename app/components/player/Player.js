import { RULES } from '../../config';
import { sessionSet, sessionGet, sessionRemove } from '../../libs/storage';
import IO from '../communications/IO';
import Message from '../communications/Message';
import Hand from '../hand/Hand';
import Game from '../game/Game';
import Lobby from '../lobby/Lobby';
import Menu from '../menu/Menu';


class Player {


  constructor() {
    this.id = '';
    this.name = '';

    this.reset();
  }


  simplify() {
    return {
      id: this.id,
      name: this.name,
    };
  }


  init(id) {
    this.id = id;
    this.getNameFromStorage();
  }


  initHand() {
    this.hand = new Hand();
  }


  reset() {
    this.color = '';
    this.pieces = 0;
    this.active = false;
    this.hand = [];
    this.builtRoutes = [];
    this.actionsLeft = 0;
  }


  getNameFromStorage() {
    const name = sessionGet('ttr_username');
    if (name) {
      this.setName(name, false);
    }
  }


  setName(name, message = true) {
    if (name === '') return;
    IO.emit('Player.setName', { name, id: this.id })
      .then(() => {
        this.name = name;
        sessionSet('ttr_username', name);
        if (message) {
          Message.success('Username changed!');
        }
        Menu.renderUpdateUser(this.name);
        Lobby.renderUpdateUser(this.name);
      })
      .catch(response => {
        this.name = '';
        sessionRemove('ttr_username');
        Message.error(response.message);
        Menu.renderUpdateUser(this.name);
        Lobby.renderUpdateUser(this.name);
      });
  }


  setColor(color) {
    this.color = color;
  }


  setActive(active) {
    this.active = active;
  }


  startTurn = activePlayer => {
    if (activePlayer.id === this.id) {
      this.setActive(true);
      this.actionsLeft = RULES.turn.actions;
    } else {
      this.setActive(false);
      this.actionsLeft = 0;
    }
  }


  changeTurn() {
    if (this.actionsLeft <= 0) {
      IO.emit('Player.endTurn', {
        player: this.simplify(),
        game: Game.simplify(),
      })
        .then(() => {
          if (Game.room.players.length > 1) {
            this.setActive(false);
          }
          Message.success('Your turn ended.');
        })
        .catch(response => {
          this.setActive(true);
          Message.error(response.message);
        });
    } else {
      this.setActive(true);
    }
  }


  drawCardFromDeck(card) {
    this.actionsLeft -= RULES.action.drawFromDeck;
    this.hand.addCard(card);
    this.changeTurn();
  }

}


export default new Player();
