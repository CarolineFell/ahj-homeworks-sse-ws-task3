/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
import API from './API';

const api = new API('https://ahj-homeworks-sse-ws-server3.herokuapp.com/inst');

function convertDate(value) {
  const newValue = value < 10 ? `0${value}` : value;
  return newValue;
}

function printData(valueDate) {
  const newDate = new Date(valueDate);
  const date = convertDate(newDate.getDate());
  const month = convertDate(newDate.getMonth() + 1);
  const year = convertDate(newDate.getFullYear());
  const hours = convertDate(newDate.getHours());
  const minutes = convertDate(newDate.getMinutes());
  const seconds = convertDate(newDate.getSeconds());
  const shownDate = `${hours}:${minutes}:${seconds} ${date}.${month}.${year}`;
  return shownDate;
}

export default class Messanger {
  constructor() {
    this.url = 'wss://ahj-homeworks-sse-ws-server3.herokuapp.com/ws';
  }

  init() {
    this.elInstances = document.getElementById('instances');
    this.initWebSocket();
    this.addEvents();

    this.dashboard = document.querySelector('.dashboard');
    this.elInputMessage = document.querySelector('#inp-msg');
    this.elListMessages = document.querySelector('#list-msg');
    this.dashboard.classList.remove('hidden');

    this.drawUsersList();

    window.addEventListener('beforeunload', () => {
      this.ws.close(1000, 'work end');
      api.remove(this.nameUser);
      this.drawUsersList();
    });
  }

  addEvents() {
    this.elInstances.addEventListener('click', (event) => {
      event.preventDefault();

      const evtClassList = event.target.classList;
      if (evtClassList.contains('new-instance')) {
        api.add();
      } else if (evtClassList.contains('stop-start')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        api.patch(idPatch);
      } else if (evtClassList.contains('close')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        api.remove(idPatch);
      }
    });
  }

  initWebSocket() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      console.log('connected');
    });

    this.ws.addEventListener('message', (evt) => {
      // print msg
      this.drawMessage(evt);
    });

    this.ws.addEventListener('close', (evt) => {
      console.log('connection closed', evt);
    });

    this.ws.addEventListener('error', () => {
      console.log('error');
    });
  }

  async drawUsersList() {
    const response = await api.load();
    const arrUsers = await response.json();
    // console.log(this.nameUser);
    const elListInst = document.querySelector('.instance-list');
    elListInst.innerHTML = '';
    for (const item of arrUsers) {
      const elItemUser = document.createElement('li');
      elItemUser.className = `instance-item ${item.state}`;
      elItemUser.innerHTML = `
      <span class="instance-id">${item.id}</span>
      <span class="instance-status">
        Status: 
        <span class="status"></span>
      </span>
      <span class="instance-actions">
        Actions: 
        <div class="stop-start status-icon"></div>
        <div class="close status-icon"></div>
      </span>
      `;
      elListInst.appendChild(elItemUser);
    }
  }

  drawMessage(message) {
    const { type } = JSON.parse(message.data);

    if (type === 'message') {
      const { name, msg, dateTime } = JSON.parse(message.data);

      const itemMessage = document.createElement('li');
      itemMessage.className = 'list-item-msg';

      itemMessage.innerHTML = `
      <div class="list-item-head">
        <span>${printData(dateTime)}</span>
      </div>
      <div class="list-item-msg">
      <span>Server: ${name}</span>
      INFO: ${msg}
      </div>
      `;

      if (msg === 'Created') {
        this.drawUsersList();
      }

      if (msg === 'Deleted') {
        this.drawUsersList();
      }

      if (msg === 'started' || msg === 'stopped') {
        this.drawUsersList();
      }

      this.elListMessages.appendChild(itemMessage);
      this.elListMessages.scrollTo(0, itemMessage.offsetTop);
    }
  }

  sendMessage(message) {
    // change
    if (this.ws.readyState === WebSocket.OPEN) {
      const msgC = {
        type: 'change',
        name: this.nameUser,
        msg: message,
        dateTime: new Date(),
      };
      const jsonMsgC = JSON.stringify(msgC);
      this.ws.send(jsonMsgC);

      try {
        const msg = {
          type: 'message',
          name: this.nameUser,
          msg: message,
          dateTime: new Date(),
        };
        const jsonMsg = JSON.stringify(msg);
        this.ws.send(jsonMsg);
      } catch (e) {
        console.log('err');
        console.log(e);
      }
    } else {
      // Reconnect
      console.log('reconect');
      this.ws = new WebSocket(this.url);
    }
  }
}
const messanger = new Messanger();
messanger.init();