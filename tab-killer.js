var bg = {
  contextMenuText: "Close tabs",
  contexts : ["all"],
  parentContextMenuId : undefined,
  menus : [],
  init: function() {
    bg.parentContextMenuId = chrome.contextMenus.create({
      "title": "Close tabs",
      "contexts": bg.contexts
    });

    chrome.tabs.onActivated.addListener(
      function(activeInfo) {
        chrome.tabs.get(activeInfo.tabId, bg.resetSubMenu);
      }
    );

    chrome.tabs.onUpdated.addListener(
      function(tabId, changeInfo, tab) {
        chrome.tabs.getCurrent(
          function(currentTab) {
            if (tabId === currentTab.id)
              chrome.tabs.get(abId, bg.resetSubMenu);
          }
        );
      }
    );
  },

  resetSubMenu: function(tab) {
    "use strict";

    function getDomain(url) {
      return url.split(/\/+/g)[1];
    };

    function subUrl(tab, index) {
      return tab.url.split(/\/+/g).slice(2, index + 1).join('/');
    }

    var domain = "";
    if (tab !== undefined) {
      domain = getDomain(tab.url);
    }

    // reset old menus
    for (var i = 0; i < bg.menus.length; i++) {
      chrome.contextMenus.remove(bg.menus[i]);
    }
    bg.menus = [];

    function filterTabs(closeIf) {
      chrome.tabs.getAllInWindow(null, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (closeIf(tabs[i])) {
            chrome.tabs.remove(tabs[i].id, null);
          }
        }
      });
    };

    function addMenu(title, closeIf) {
      bg.menus.push(chrome.contextMenus.create({
        "title": title,
        "contexts": bg.contexts,
        "parentId": bg.parentContextMenuId,
        "onclick": function(info, tab) {
          filterTabs(function(other) { return closeIf(other, tab); });
        },
      }));
    }

    addMenu("Left tabs",
      function(other, tab) { return other.index < tab.index; });
    addMenu("Right tabs",
      function(other, tab) { return other.index > tab.index; });
    addMenu("This tab",
      function(other, tab) { return other.index == tab.index; });
    addMenu("Other tabs",
      function(other, tab) { return other.index != tab.index; });
    addMenu("From domain: " + domain,
      function(other, tab) { return getDomain(other.url) === getDomain(tab.url); });
    addMenu("Not from domain: " + domain,
      function(other, tab) { return getDomain(other.url) !== getDomain(tab.url); });
    addMenu("This URL",
      function(other, tab) { return other.url == tab.url; });

    let parts = tab.url.split(/\/+/g);
    for (i = 2; i < parts.length; i++) {
      let index = i;
      addMenu(
        "Sub-URL: " + subUrl(tab, index),
        function(other, tab) {
          return getDomain(other.url) === getDomain(tab.url) &&
          subUrl(other, index) === subUrl(tab, index);
        }
      );
    }
  }

};

bg.init();
