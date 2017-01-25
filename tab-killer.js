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
            if (currentTab !== undefined && tabId === currentTab.id)
              chrome.tabs.get(abId, bg.resetSubMenu);
          }
        );
      }
    );
  },

  resetSubMenu: function(tab) {
    "use strict";

    // See @urlParts example. First 4 items are protocol-specific.
    let kUrlPartsDomain = 4;
    function urlParts(url) {
      // Split by '/' and '?'.
      // > 'https://a.com/?/b'.split(/([\/\?])/g)
      // [ 'https:', '/', '', '/', 'a.com', '/', '', '?', '', '/', 'b' ]
      return url.split(/([\/\?])/g);
    }

    function getDomain(url) {
      return urlParts(url)[kUrlPartsDomain];
    };

    var domain = "";
    if (tab !== undefined) {
      domain = getDomain(tab.url);
    }

    // reset old menus
    for (var i = 0; i < bg.menus.length; i++) {
      chrome.contextMenus.remove(bg.menus[i]);
    }
    bg.menus = [];

    // Filter in reverse order so the last tab (in chrome order) remains open.
    function filterTabs(closeIf) {
      chrome.tabs.getAllInWindow(null, function(tabs) {
       let toRemove = [];
        for (var i = tabs.length - 1; i != 0; i--) {
          if (closeIf(tabs, i)) {
            toRemove.push(tabs[i].id);
          }
        }
        chrome.tabs.remove(toRemove, null);
      });
    };

    function addMenu(title, closeIf) {
      bg.menus.push(chrome.contextMenus.create({
        "title": title,
        "contexts": bg.contexts,
        "parentId": bg.parentContextMenuId,
        "onclick": function(info, curTab) {
          filterTabs(function(tabs, i) { return closeIf(tabs, i, curTab); });
        },
      }));
    }

    addMenu("Duplicate tabs (same URL)",
      function(tabs, i, curTab) {
        for (var j = i + 1; j < tabs.length; j++) {
          if (tabs[i].url === tabs[j].url) {
            return true;
          }
        }
        return false;
      }
    );

    addMenu("Left tabs",
      function(tabs, i, curTab) { return tabs[i].index < curTab.index; });
    addMenu("Right tabs",
      function(tabs, i, curTab) { return tabs[i].index > curTab.index; });
    addMenu("This tab",
      function(tabs, i, curTab) { return tabs[i].index === curTab.index; });
    addMenu("Other tabs",
      function(tabs, i, curTab) { return tabs[i].index !== curTab.index; });
    addMenu("From domain: " + domain,
      function(tabs, i, curTab) { return getDomain(tabs[i].url) === getDomain(curTab.url); });
    addMenu("Not from domain: " + domain,
      function(tabs, i, curTab) { return getDomain(tabs[i].url) !== getDomain(curTab.url); });
    addMenu("This URL",
      function(tabs, i, curTab) { return tabs[i].url === curTab.url; });


    let parts = urlParts(tab.url);
    for (i = kUrlPartsDomain; i < parts.length - 1; i++) {
      if (parts[i] === '' || parts[i] === '/' || parts[i] === '?') {
        continue;
      }

      function subUrl(tab, lastPart) {
        return urlParts(tab.url).slice(kUrlPartsDomain, lastPart + 1).join('');
      }
      let index = i;
      addMenu(
        "URL path: " + subUrl(tab, index),
        function(tabs, i, curTab) {
          return (getDomain(tabs[i].url) === getDomain(tab.url) &&
                  subUrl(tabs[i], index) === subUrl(tab, index));
        }
      );
    }
  }

};

bg.init();
