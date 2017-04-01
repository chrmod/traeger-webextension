let traeger;

chrome.browserAction.setBadgeBackgroundColor({
  color: '#000000'
});

chrome.browserAction.setBadgeText({
  text: 'off'
});

chrome.browserAction.onClicked.addListener(function(tab) {
  if (!traeger) {
    traeger = new Traeger();
    traeger.start();
  }

  if (traeger.status === 'off') {
    traeger.enable();
  } else {
    traeger.disable();
  }

  chrome.browserAction.setBadgeText({
    text: traeger.status
  });
});

var config = {
  mode: "fixed_servers",
  rules: {
    proxyForHttp: {
      scheme: "socks5",
      host: "localhost",
      port: 1090,
    },
    proxyForHttps: {
      scheme: "socks5",
      host: "localhost",
      port: 1090,
    }

  }
};
chrome.proxy.settings.set(
  {value: config, scope: 'regular'},
  function() {});

class Traeger {

  constructor() {
    this.status = 'off';
  }

  start() {
    this.port = chrome.runtime.connectNative('traeger');
    this.port.onMessage.addListener(function(msg) {
      console.log("Received", msg);
    });
    this.port.onDisconnect.addListener(function() {
      console.log("Disconnected");
    });
  }

  enable() {
    this.port.postMessage({block: true});
    this.status = 'on';
  }

  disable() {
    this.port.postMessage({block: false});
    this.status = 'off';
  }

  stop() {
    this.port.disconnect();
  }

}

window.onunload = function () {
  console.log('unload');

  if (traeger) {
    traeger.stop();
  }
}
