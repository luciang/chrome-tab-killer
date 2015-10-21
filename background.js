var bg = {
    keyVersion: "version",
    url: "chrome://extensions/",
    contextMenuText: "Close tabs",
    contexts : ["all"],
    parentContextMenuId : undefined,
    menus : [],
    init: function() {
        bg.parentContextMenuId = chrome.contextMenus.create({
            "title": "Close tabs",
            "contexts": bg.contexts
        });

	var fn = function(tabid) { chrome.tabs.get(tabid, bg.initContextMenu); };
	chrome.tabs.onSelectionChanged.addListener(fn);
	chrome.tabs.onUpdated.addListener(fn);
    },

    initContextMenu: function(tab) {
	var getDomain = function(url) { return url.split(/\/+/g)[1]; };

        var domain = ""
        if (tab !== undefined) 
	    domain = getDomain(tab.url);
    
	// reset old menus
	for (var i = 0; i < bg.menus.length; i++) {
	    chrome.contextMenus.remove(bg.menus[i]);
	}
	bg.menus = [];

	var filterTabs = function(closeif) {
	    chrome.tabs.getAllInWindow(null, function(tabs) {
		    for (var i = 0; i < tabs.length; i++) {
			if (closeif(tabs[i])) 
			    chrome.tabs.remove(tabs[i].id, null);
		    }
		});
        };

	function addMenu(title, closeCond) {
            bg.menus.push(chrome.contextMenus.create({
	        "title": title,
	     	"contexts": bg.contexts,
	       	"parentId": bg.parentContextMenuId,
	       	"onclick": function(info, tab) {
		    filterTabs(function(other) { return closeCond(other, tab); });
		},
	   }));
	}

	addMenu("Close tabs to the left", 
		function(other, tab) { return other.index < tab.index; });
	addMenu("Close tabs to the right", 
		function(other, tab) { return other.index > tab.index; });
	addMenu("Close other tabs", 
		function(other, tab) { return other.index != tab.index; });
	addMenu("Close current tab", 
		function(other, tab) { return other.index == tab.index; });
	addMenu("Close tabs from this domain: " + domain,
		function(other, tab) { return getDomain(other.url) === getDomain(tab.url); });
	addMenu("Close tabs from other domain: " + domain, 
		function(other, tab) { return getDomain(other.url) !== getDomain(tab.url); });
    },
};

bg.init();
