// Set fluidDBHost to 'localhost:9000' if testing against a local FluidDB.
var fluidDBHost = 'fluiddb.fluidinfo.com';

var twitterUserURLRegex = new RegExp('^https?://twitter.com/#!/(\\w+)$');
var linkRegex = /^\w+:\/\//;

var currentSelection = null;
var tabThatCreatedCurrentSelection = null;
var maxSelectionLengthToLookup = 200;

// Tabs that were created as a part of the OAuth login process and which
// are candidates for auto-deletion (when OAuth authorization is granted).
var oauthAutoCloseTabs = {};

// Things we consider as possibly being an about value that corresponds to
// something that's being followed, e.g., '@username' or 'wordnik.com'.
var followeeRegex = /^@?([\w\.]+)$/;

var anonFluidinfoAPI = fluidinfo({instance: 'https://' + fluidDBHost + '/'});

var absoluteHref = function(linkURL, docURL) {
    /*
     * Turn a possibly relative linkURL (the href="" part of an <a> tag)
     * into something absolute. If linkURL does not specify a host, use
     * the one in the document's URL (given in docURL).
     */
    var url;
    if (linkRegex.test(linkURL)) {
        // The link looks absolute (i.e., http:// or https:// or ftp://).
        url = linkURL;
    }
    else if (linkURL.slice(0, 7).toLowerCase() === 'mailto:') {
        url = linkURL.split(':')[1].toLowerCase();
    }
    else {
        // A relative link. Prepend the current document protocol & host+port.
        var parts = docURL.split('/');
        if (linkURL.charAt(0) === '/') {
            url = parts[0] + '//' + parts[2] + linkURL;
        }
        else {
            url = parts[0] + '//' + parts[2] + '/' + linkURL;
        }
    }

    return url;
};

// Listen for incoming messages from the tab content script or the sidebar
// iframe script with events (link mouseover, link mouseout, selection
// set/cleared, etc).
var handleMessage = function(e) {
    var msg = e.message;
    if (e.name === 'content') {
        if (typeof msg.selection !== 'undefined') {
            if (currentSelection === null || msg.selection !== currentSelection) {
                tabThatCreatedCurrentSelection = safari.application.activeBrowserWindow.activeTab;
                currentSelection = msg.selection;
                removeContextMenuItemsByContext('selection');
                addContextMenuItem(currentSelection, 'selection');
            }
        }
        else if (msg.selectionCleared) {
            if (currentSelection !== null) {
                currentSelection = null;
                removeContextMenuItemsByContext('selection');
            }
        }
        else if (msg.mouseout) {
            // The mouse moved off a link so clear all link-related context
            // menu items.
            removeContextMenuItemsByContext('link');
        }
        else if (msg.mouseover) {
            // The mouse moved over a new link. Remove existing link-related
            // context menu items.
            removeContextMenuItemsByContext('link');

            var url;

            // There are <a> tags with no href in them.
            if (msg.linkURL){
                url = absoluteHref(msg.linkURL, msg.docURL);
                addContextMenuItem(url, 'link');
            }

            // And there are <a> tags with no text in them.
            if (msg.text) {
                if (msg.linkURL) {
                    url = absoluteHref(msg.linkURL, msg.docURL);
                    var match = twitterUserURLRegex.exec(url);
                    if (match !== null) {
                        // We can test against match[1] as the regexp captures the username,
                        // so if it matched, match[1] will always be defined.
                        var name = match[1];
                        var lower = name.toLowerCase();
                        if (lower !== 'following' && lower !== 'followers') {
                            // Update with @name
                            addContextMenuItem('@' + name, 'link');

                            // Look for "fullname @username" text.
                            var spaceAt = msg.text.indexOf(' @');
                            if (spaceAt !== -1){
                                // Note that Twitter now put U-200F (RIGHT-TO-LEFT MARK) after
                                // people's names, and we need to zap it. You'll know if this
                                // creeps back in, as clicking on the link in the context menu
                                // will take you to something ending in %E2%80%8F (the UTF-8
                                // for that codepoint).
                                var fullname = msg.text.slice(0, spaceAt).replace(/^\s+|[\s\u200F]+$/g, '');
                                addContextMenuItem(fullname, 'link');
                            }
                        }

                        return;
                    }
                }
                addContextMenuItem(msg.text, 'link');
            }
        } else if (msg.toggleSidebar) {
            var tab = safari.application.activeBrowserWindow.activeTab;
            tab.page.dispatchMessage('background', {
                action: 'toggle sidebar',
                about: currentSelection || tab.url,
                settings: {
                    sidebarSide: safari.extension.settings.sidebarSide,
                    sidebarWidth: safari.extension.settings.sidebarWidth
                }
            });
        } else {
            console.log('Unrecognized message sent by content script:');
            console.log(msg);
        }
    }
    else if (e.name === 'iframe') {
        // Process messages coming from the sidebar iframe.
        if (msg.action === 'hide sidebar') {
            e.target.page.dispatchMessage('background', {
                action: 'hide sidebar'
            });
        }
        else if (msg.action === 'oauth login') {
            var createdTab = safari.application.activeBrowserWindow.openTab();
            createdTab.url = 'http://' + fluidinfoHost + '/login/fluidinfo/';
            // Mark the tab as something we want to close automatically.
            oauthAutoCloseTabs[createdTab] = e.target;
        }
        else if (msg.action === 'open') {
            var tab = safari.application.activeBrowserWindow.activeTab;
            tab.url = absoluteHref(msg.linkURL, msg.docURL);
        }
        else {
            console.log('Unrecognized message sent by sidebar iframe:');
            console.log(msg);
        }
    }
    else {
        console.log('Got an unknown event.');
        console.log(e);
    }
};
safari.application.addEventListener('message', handleMessage, false);

// Listen for tab-closed events.
var handleClose = function(e) {
    var tab = e.target;
    // An OAuth login tab that's being closed should no longer be marked
    // for auto deletion.
    if (oauthAutoCloseTabs.hasOwnProperty(tab)) {
        delete oauthAutoCloseTabs[tab];
    }
};
// We have to capture the `close' event.
safari.application.addEventListener('close', handleClose, true);

// Listen for navigation events. These are sent when a page has finished loading.
var handleNavigate = function(e) {
    var tab = e.target;
    if (oauthAutoCloseTabs.hasOwnProperty(tab)) {
        // This tab is a candidate for automatic closing after successful
        // OAuth login.
        var dashboardURLPrefix = 'http://' + fluidinfoHost;
        if (tab.url.slice(0, 39) === 'https://api.twitter.com/oauth/authorize') {
            // We're in the intermediate state, the fate of the OAuth login
            // attempt is still unknown. Do nothing.
        }
        else if (tab.url.slice(0, dashboardURLPrefix.length) === dashboardURLPrefix) {
            // We're loading a valid Fluidinfo URL, so the OAuth
            // approval was granted. Remove the OAuth tab. Tell the tab
            // that made it to reload its sidebar now that login has
            // succeeded, and make it the active tab so the user is
            // returned to what they were originally looking at.
            var tabOpener = oauthAutoCloseTabs[tab];
            tabOpener.page.dispatchMessage('background', {action: 'reload'});
            delete oauthAutoCloseTabs[tab];
            tab.close();
            tabOpener.activate();
        }
        else {
            // The tab has gone on to do something else (i.e., it is no
            // longer doing oauth stuff). Unmark it as a candidate for
            // automatic deletion.
            delete oauthAutoCloseTabs[tab];
        }
    }
};
// We have to capture the `navigate' event.
safari.application.addEventListener('navigate', handleNavigate, true);


// Set up the click listener on the extension icon.
var handleCommand = function(e) {
    if (e.command === 'toggle-sidebar') {
        var tab = safari.application.activeBrowserWindow.activeTab;
        tab.page.dispatchMessage('background', {
            action: 'toggle sidebar',
            about: currentSelection || tab.url,
            settings: {
                sidebarSide: safari.extension.settings.sidebarSide,
                sidebarWidth: safari.extension.settings.sidebarWidth
            }
        });
    } else if (e.command === 'open-sidebar') {
        openInSidebar(e.userInfo.about);
    } else if (e.command === 'open-tab') {
        openNewTab(e.userInfo.about);
    } else if (e.command.slice(0, 13) === 'open-sidebar:') {
        openInSidebar(e.command.slice(13));
    } else if (e.command.slice(0, 9) === 'open-tab:') {
        openNewTab(e.command.slice(9));
    } else {
        console.log('Got an unknown command:');
        console.log(e.command);
    }
};
safari.application.addEventListener('command', handleCommand, false);
