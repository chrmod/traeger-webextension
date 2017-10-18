import * as Spanan from 'spanan';

declare var chrome;

const webRequestEvents = [
  'onBeforeRequest',
  'onBeforeSendHeaders',
  'onHeadersReceived',
];

const log = console.log.bind(console, '[Traeger WebExtension]');

const promiseFromEvent = (object, eventName) => new Promise(
  resolve => object.addEventListener(eventName, function onEvent() {
    object.removeEventListener(eventName, onEvent);
    resolve();
  }));

const createBroxyProxy = (socket) => {
  const broxyWrapper = new Spanan((message) => {
    log('Sending message', message);

    socket.send(JSON.stringify(message));
  });

  socket.addEventListener('message', ({ data }) => {
    log('Message from server ', data);

    const message = JSON.parse(data);

    broxyWrapper.dispatch({
      uuid: message.responseId,
      returnedValue: message.response,
    });
  });

  return broxyWrapper.createProxy();
};

log('start');

(async () => {
  const broxySocket = new WebSocket('ws://localhost:8080/');
  await promiseFromEvent(broxySocket, 'open');

  const broxy = createBroxyProxy(broxySocket);

  webRequestEvents.forEach((eventName) => {
    chrome.webRequest[eventName].addListener((...args) => {
      log(eventName, ...args);
      return broxy[eventName](...args).then((response) => {
        log(eventName, 'response:', response);
        return response;
      });
    }, {
      urls: ['*://*/*'],
    });
  });

})();
