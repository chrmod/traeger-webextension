const Spanan = spanan.default;

class Traeger {

  constructor() {
    this.status = 'off';
    this.port = chrome.runtime.connectNative('traeger');

    const portWrapper = new Spanan((message) => {
      this.port.postMessage({
        requestId: message.uuid,
        action: message.functionName,
        args: message.args,
      });
    });

    this.traeger = portWrapper.createProxy();

    this.port.onMessage.addListener(function(message) {
      portWrapper.dispatch({
        uuid: message.requestId,
        returnedValue: message.response,
      });
    });

    this.port.onDisconnect.addListener(function() {
      console.log("Disconnected");
    });
  }

  start() {
    return this.traeger.getPort().then((port) => {
      startProxy(port);
    });
  }

  enable() {
    return this.traeger.setBlock(true).then(() => {
      this.status = 'on';
    });
  }

  disable() {
    return this.traeger.setBlock(false).then(() => {
      this.status = 'off';
    });
  }

  stop() {
    this.port.disconnect();
  }

}

let traeger = new Traeger();

chrome.browserAction.setBadgeBackgroundColor({
  color: '#000000'
});

chrome.browserAction.setBadgeText({
  text: 'off'
});

chrome.browserAction.onClicked.addListener(function(tab) {
  let promise;
  if (traeger.status === 'off') {
    traeger.start();
    promise = traeger.enable();
  } else {
    promise = traeger.disable();
  }

  promise.then(() => {
    chrome.browserAction.setBadgeText({
      text: traeger.status
    });
  });
});

function startProxy(port) {
  var config = {
    mode: "fixed_servers",
    rules: {
      proxyForHttp: {
        scheme: "socks5",
        host: "localhost",
        port: port,
      },
      proxyForHttps: {
        scheme: "socks5",
        host: "localhost",
        port: port,
      }

    }
  };
  chrome.proxy.settings.set(
    {value: config, scope: 'regular'},
    function() {});
};


window.onunload = function () {
  console.log('unload');

  if (traeger) {
    traeger.stop();
  }
}
