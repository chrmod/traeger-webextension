import * as Spanan from 'spanan';

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


  const response = await broxy.checkRequest();
  log('Broxy response', response);
})();

