import './deck.css';
import { RULES } from '../../config';
import { qs, addClass, removeClass } from '../../libs/dom';
import { listen } from '../../libs/events';
import IO from '../communications/IO';
import Message from '../communications/Message';
import Game from '../game/Game';
import Player from '../player/Player';


export default class Deck {


  constructor(cardsCount) {
    this.counter = cardsCount;

    this.el = { deck: document.getElementById('deck') };
    this.el.counter = qs('span', this.el.deck);
    this.el.counter.textContent = this.counter;

    this.listen();
  }


  listen() {
    IO.io.on('Deck.count', this.update);
    listen(this.el.deck, 'click', this.draw);
  }


  update = cardsCount => {
    this.counter = cardsCount;
    this.el.counter.textContent = this.counter;
    if (this.counter) {
      removeClass(this.el.deck, 'empty');
    } else {
      addClass(this.el.deck, 'empty');
    }
  }


  draw = () => {
    if (Player.active
      && Player.actionsLeft >= RULES.action.drawFromDeck
      && this.counter > 0
    ) {
      Player.setActive(false);
      IO.emit('Deck.draw', Game.simplify())
        .then(response => {
          this.update(this.counter - 1);
          Player.drawCardFromDeck(response.body);
          Message.success(response.message);
        })
        .catch(response => {
          Message.error(response.message);
          Player.setActive(true);
        });
    }
  }

}