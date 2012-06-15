// // --------------------------- Page --------------------------

// chrome.contextMenus.create({
//     'title' : 'This page in the sidebar',
//     'type' : 'normal',
//     'contexts' : ['page'],
//     'onclick' : function(info, tab){
//         openInSidebar(info.pageUrl, info, tab);
//     }
// });

// chrome.contextMenus.create({
//     'title' : 'This page on fluidinfo.com',
//     'type' : 'normal',
//     'contexts' : ['page'],
//     'onclick' : function(info, tab){
//         openNewTab(info.pageUrl, info, tab);
//     }
// });

// // --------------------------- Image --------------------------

// chrome.contextMenus.create({
//     'title' : 'This image in the sidebar',
//     'type' : 'normal',
//     'contexts' : ['image'],
//     'onclick' : function(info, tab){
//         openInSidebar(info.srcUrl, info, tab);
//     }
// });

// chrome.contextMenus.create({
//     'title' : 'This image on fluidinfo.com',
//     'type' : 'normal',
//     'contexts' : ['image'],
//     'onclick' : function(info, tab){
//         openNewTab(info.srcUrl, info, tab);
//     }
// });


function handleContextMenu(e) {
    switch (e.userInfo.type) {
    case "A":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This link in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This link on fluidinfo.com');
        break;
    case "IMG":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This image in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This image on fluidinfo.com');
        break;
    case "PAGE":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This page in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This page on fluidinfo.com');
        break;
    case "TEXT":
        e.contextMenu.appendContextMenuItem('open-sidebar', 'This text in the sidebar');
        e.contextMenu.appendContextMenuItem('open-tab', 'This text on fluidinfo.com');
        break;
    default:
        // can't happen
        e.preventDefault();
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
        action: 'show sidebar'
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
// 'sidebarMenuItem', the menu item indices returned by
// chrome.contextMenus.create.

var contextMenuItems = {};

var addContextMenuItem = function(text, context){
    // Add (possibly truncated) 'text' to the context menu, if not already present.
    text = (text.length < 50 ? text : text.slice(0, 47) + '...').replace(/\n+/g, ' ');

    if (typeof contextMenuItems[text] === 'undefined'){
        var sidebarMenuItem = chrome.contextMenus.create({
            'title' : text + ' in the sidebar',
            'type' : 'normal',
            'contexts' : [context],
            'onclick' : function(info, tab){
                openInSidebar(text, info, tab);
            }
        });
        var gotoMenuItem = chrome.contextMenus.create({
            'title' : text + ' on fluidinfo.com',
            'type' : 'normal',
            'contexts' : [context],
            'onclick' : function(info, tab){
                openNewTab(text, info, tab);
            }
        });
        contextMenuItems[text] = {
            context: context,
            gotoMenuItem: gotoMenuItem,
            sidebarMenuItem: sidebarMenuItem
        };
    }
};

var removeContextMenuItemsByContext = function(context){
    var text;
    for (text in contextMenuItems){
        if (typeof contextMenuItems[text] !== 'undefined' &&
            contextMenuItems[text].context === context){
            chrome.contextMenus.remove(contextMenuItems[text].gotoMenuItem);
            chrome.contextMenus.remove(contextMenuItems[text].sidebarMenuItem);
            delete contextMenuItems[text];
        }
    }
};
