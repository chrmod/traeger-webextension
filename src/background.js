class Traeger {

  constructor() {
    this.status = 'off';
    this.port = chrome.runtime.connectNative('traeger');
    this.requestId = 1111;
    this.port.onMessage.addListener(function(msg) {
      console.log("Received", msg);
      if (msg.requestId === this.requestId && msg.response) {
        console.log(msg.response);
        startProxy(msg.response);
      }
    }.bind(this));
    this.port.onDisconnect.addListener(function() {
      console.log("Disconnected");
    });
  }

  start() {
    this.port.postMessage({requestId: this.requestId, action: 'getPort'});
  }

  enable() {
    this.port.postMessage({action: 'setBlock', args: [true]});
    this.status = 'on';
  }

  disable() {
    this.port.postMessage({action: 'setBlock', args: [false]});
    this.status = 'off';
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
  if (traeger.status === 'off') {
    traeger.start();
    traeger.enable();
  } else {
    traeger.disable();
  }

  chrome.browserAction.setBadgeText({
    text: traeger.status
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
