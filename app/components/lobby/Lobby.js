import './lobby.css';
import uuid from 'node-uuid';
import { APP_CONTAINER, RULES } from '../../config';
import { listen } from '../../libs/events';
import Message from '../message';
import PubSub from '../../libs/PubSub';


export default class Lobby {


  constructor(io, user) {
    this.io = io;
    this.user = {
      id: user.id,
      name: user.name,
      room: user.room,
    };
    this.rooms = [];

    this.io.emit('Rooms/list', {});
    this.io.on('Rooms/list', rooms => {
      this.rooms = rooms.list;
      this.renderUpdateRooms();
    });

    PubSub.sub('User/changed', this.renderUpdateUser);
  }


  render() {
    APP_CONTAINER.insertAdjacentHTML('afterbegin', `
      <div class="lobby-overlay">
        <div class="lobby">
          <form class="usernameForm hidden">
            <input name="username" type="text" placeholder="Change name">
            <input type="submit" value="Save">
          </form>
          <table class="rooms hidden">
            <thead>
              <tr>
                <th>Room</th>
                <th>Owner</th>
                <th>Players</th>
                <th></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <form class="roomForm hidden">
            <input name="room" type="text" placeholder="New room">
            <input type="submit" value="Create">
          </form>
        </div>
      </div>
    `);
    const lobby = APP_CONTAINER.querySelector('.lobby');
    this.element = {
      lobby,
      usernameForm: lobby.querySelector('.usernameForm'),
      usernameInput: lobby.querySelector('.usernameForm input[type="text"]'),
      usernameSubmit: lobby.querySelector('.usernameForm input[type="submit"]'),
      rooms: lobby.querySelector('table.rooms'),
      roomsList: lobby.querySelector('table.rooms tbody'),
      roomForm: lobby.querySelector('.roomForm'),
      roomInput: lobby.querySelector('.roomForm input[type="text"]'),
      roomSubmit: lobby.querySelector('.roomForm input[type="submit"]'),
    };
    listen(this.element.usernameSubmit, 'click', this.changeUsername);
    listen(this.element.roomSubmit, 'click', this.createRoom);

    if (this.user.name === '') {
      this.element.usernameForm.classList.remove('hidden');
    }
  }


  renderUpdateUser = data => {
    this.user = {
      id: data.id,
      name: data.name,
      room: data.room,
    };
    if (data.name !== '') {
      this.element.usernameForm.classList.add('hidden');
      this.element.roomForm.classList.remove('hidden');
      this.renderUpdateRooms();
    } else {
      this.element.usernameForm.classList.remove('hidden');
      this.element.roomForm.classList.add('hidden');
    }
  }


  renderUpdateRooms = () => {
    while (this.element.roomsList.firstChild) {
      this.element.roomsList.removeChild(this.element.roomsList.firstChild);
    }

    if (this.rooms.length > 0) {
      this.element.rooms.classList.remove('hidden');
    } else {
      this.element.rooms.classList.add('hidden');
      return;
    }

    for (const room of this.rooms) {
      let actions = '';
      let players = '';

      for (const player of room.players) {
        players += `<span>${player.name}</span>`;
      }

      if (
        room.status === 'open' && this.user.name !== '' &&
        room.players.length < RULES.player.max &&
        !room.players.find(p => p.id === this.user.id)
      ) {
        actions += `<a
          href="#" class="join"
          data-room-id="${room.id}" data-room-name="${room.name}"
        >Join</a>`;
      }
      if (room.players.find(p => p.id === this.user.id)) {
        actions += `<a
          href="#" class="leave"
          data-room-id="${room.id}" data-room-name="${room.name}"
        >Leave</a>`;
      }

      this.element.roomsList.insertAdjacentHTML('afterbegin',`
        <tr>
          <td class="room-name">${room.name}</td>
          <td class="room-owner">${room.owner.name}</td>
          <td class="room-players">${players}</td>
          <td class="room-actions">${actions}</td>
        </tr>
      `);
    }

    const joinButtons = this.element.roomsList.querySelectorAll('.join');
    const leaveButtons = this.element.roomsList.querySelectorAll('.leave');
    for (const join of [...joinButtons]) {
      listen(join, 'click', this.joinRoom);
    }
    for (const leave of [...leaveButtons]) {
      listen(leave, 'click', this.leaveRoom);
    }
  }


  changeUsername = e => {
    e.preventDefault();
    if (this.element.usernameInput.value !== '') {
      PubSub.pub('User/name', this.element.usernameInput.value);
      this.element.usernameInput.value = '';
    }
  }


  createRoom = e => {
    e.preventDefault();
    if (this.user.name === '') return;
    if (this.element.roomInput.value !== '') {
      const room = {
        id: uuid.v4(),
        name: this.element.roomInput.value,
        owner: this.user,
        players: [],
        status: 'open',
      };
      this.io.emit('Rooms/create', room, response => {
        if (response === 'ok') {
          PubSub.pub('Room/join', room);
          Message.show({
            type: 'success',
            message: 'Room created!',
          });
        } else {
          Message.show({
            type: 'error',
            message: response,
          });
        }
      });
      this.element.roomInput.value = '';
    }
  }


  joinRoom = e => {
    e.preventDefault();
    if (this.user.name === '') return;
    const room = {
      id: e.target.dataset.roomId,
      name: e.target.dataset.roomName,
    };
    this.io.emit('Rooms/join', {
      room,
      player: this.user,
    }, response => {
      if (response === 'ok') {
        PubSub.pub('Room/join', room);
        Message.show({
          type: 'success',
          message: `Joined room <b>${room.name}</b>!`,
        });
      } else {
        Message.show({
          type: 'error',
          message: response,
        });
      }
    });
  }


  leaveRoom = e => {
    e.preventDefault();
    if (this.user.name === '') return;
    const room = {
      id: e.target.dataset.roomId,
      name: e.target.dataset.roomName,
    };
    this.io.emit('Rooms/leave', {
      room,
      player: this.user,
    }, response => {
      if (response === 'ok') {
        PubSub.pub('Room/leave', room);
        Message.show({
          type: 'success',
          message: `Left room <b>${room.name}</b>!`,
        });
      } else {
        Message.show({
          type: 'error',
          message: response,
        });
      }
    });
  }

}
