function handleContextMenu(e) {
    switch (e.userInfo.type) {
    case "IMG":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This image in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This image on fluidinfo.com');
        break;
    case "PAGE":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This page in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This page on fluidinfo.com');
        break;
    default:
        for (var text in contextMenuItems) {
            if (typeof contextMenuItems[text] !== 'undefined') {
                var sidebar = contextMenuItems[text].sidebarMenuItem;
                var tab = contextMenuItems[text].gotoMenuItem;
                e.contextMenu.appendContextMenuItem(sidebar.command, sidebar.title);
                e.contextMenu.appendContextMenuItem(tab.command, tab.title);
            }
        }
    }
}
safari.application.addEventListener('contextmenu', handleContextMenu, false);

// --------------------------- Openers --------------------------

function openInSidebar(about) {
    /*
     * Open the sidebar, looking at the given about value.
     */
    var tab = safari.application.activeBrowserWindow.activeTab;
    tab.page.dispatchMessage('background', {
        about: about,
        action: 'show sidebar',
        settings: {
            sidebarSide: safari.extension.settings.sidebarSide,
            sidebarWidth: safari.extension.settings.sidebarWidth
        }
    });
}

function openNewTab(about) {
    /*
     * Create a new tab with the object browser looking at the given about value.
     */
    var tab = safari.application.activeBrowserWindow.openTab();
    tab.url = 'http://' + fluidinfoHost + '/about/' + encodeURIComponent(about);
}


// ---------------------- Dynamic context menu items ------------

// contextMenuItems has attributes that are the text of current
// context menu items. Its values are objects with three attributes,
// 'context' (either 'link' or 'selection'), 'gotoMenuItem' and
// 'sidebarMenuItem', holding parameters for
// event.contextMenu.appendContextMenuItem.
var contextMenuItems = {};

var addContextMenuItem = function(text, context) {
    // Add (possibly truncated) 'text' to the context menu, if not already present.
    var title = (text.length < 50 ? text : text.slice(0, 47) + '...').replace(/\n+/g, ' ');

    if (typeof contextMenuItems[text] === 'undefined') {
        var sidebarMenuItem = {
            title: title + ' in the sidebar',
            command: 'open-sidebar:' + text
        };
        var gotoMenuItem = {
            title: title + ' on fluidinfo.com',
            command: 'open-tab:' + text
        };
        contextMenuItems[text] = {
            context: context,
            gotoMenuItem: gotoMenuItem,
            sidebarMenuItem: sidebarMenuItem
        };
    }
};

var removeContextMenuItemsByContext = function(context) {
    for (var text in contextMenuItems) {
        if (typeof contextMenuItems[text] !== 'undefined' &&
            contextMenuItems[text].context === context) {
            delete contextMenuItems[text];
        }
    }
};
