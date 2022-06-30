"use strict";

const url = new RegExp("[a-zA-Z]+:\/\/rooster\.rug\.nl\/.*");

browser.browserAction.onClicked.addListener((tab) => {

  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    for (const tab of tabs) {
      if (tab.url.match(url)) {
        console.log("send message");
        browser.tabs.sendMessage(tab.id, { data: { action: "TOGGLE" } });
      }
    }

  });

});
