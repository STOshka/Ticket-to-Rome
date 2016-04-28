import socketIo from 'socket.io';
import * as API from '../API';
import store from '../store';
import { createPlayer/*, deletePlayer*/ } from '../actions';

export default function socket(server) {
  const io = socketIo.listen(server);

  /*console.log(JSON.stringify(store.getState()));

  const unsubscribe = store.subscribe(() => {
    console.log(JSON.stringify(store.getState()));
  });

  store.dispatch(createPlayer({
    id: 1,
    name: 'Player 1',
  }));
  store.dispatch(createPlayer({
    id: 2,
    name: 'Player 2',
  }));
  store.dispatch(deletePlayer(1));

  unsubscribe();*/

  io.on(API.CONNECTION, client => {
    console.log(`Client ${client.id} connected.`);

    client.on(API.CREATE_PLAYER, (player, callback) => {
      store.dispatch(createPlayer(player));
      callback();
    });
  });
}
