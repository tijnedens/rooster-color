'use strict';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    let rule1 = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: 'rooster.rug.nl' },
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()],
    };
    chrome.declarativeContent.onPageChanged.addRules([rule1]);
  });
});