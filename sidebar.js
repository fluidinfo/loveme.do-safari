var hideSidebar = function(sidebar) {
    $(sidebar).remove();
};

var showSidebar = function(sidebar) {
    $(sidebar).css('display', 'block');
};

var getSidebar = function() {
    return document.getElementById('fi_sidebar');
};

var updateSidebar = function(sidebar, about) {
    sidebar.src = 'http://' + fluidinfoHost + '/infomaniac/' + encodeURIComponent(about);
};

var toggleSidebar = function(settings, about) {
    var sidebar = getSidebar();
    if (sidebar) {
        hideSidebar(sidebar);
    }
    else {
        // There is no sidebar. Create one showing the Fluidinfo object for
        // the current document url, and display it.
        createSidebar(settings, function(sidebar) {
            updateSidebar(sidebar, about);
            showSidebar(sidebar);
        });
    }
};

var createSidebar = function(settings, callback) {
    var parent = (document.getElementsByTagName('body')[0] ||
                  document.getElementsByTagName('html')[0]);
    if (parent) {
        var sidebar = document.createElement('iframe');
        sidebar.id = 'fi_sidebar';
        sidebar.classList.add('fluidinfo_sidebar');
        sidebar.classList.add('fluidinfo_sidebar_' + settings.sidebarSide);
        sidebar.setAttribute('width', settings.sidebarWidth + 'px');
        sidebar.title = 'Fluidinfo sidebar';
        parent.appendChild(sidebar);
        callback(sidebar);
    }
    else {
        console.log('Could not find body or html element on page!');
        callback(null);
    }
};


// Listen for instructions from notification pop-ups or from the background page.
var handleMessage = function(e) {
    if (e.name !== 'background') {
        return;
    }
    var sidebar, msg = e.message, settings = msg.settings;
    if (msg.action === 'show sidebar') {
        sidebar = getSidebar();
        if (sidebar) {
            updateSidebar(sidebar, valueUtils.lowercaseAboutValue(e.message.about));
        }
        else {
            createSidebar(settings, function(sidebar) {
                updateSidebar(sidebar, valueUtils.lowercaseAboutValue(e.message.about));
                showSidebar(sidebar);
            });
        }
    }
    else if (msg.action === 'hide sidebar') {
        sidebar = getSidebar();
        if (sidebar) {
            hideSidebar(sidebar);
        }
    }
    else if (msg.action === 'toggle sidebar') {
        toggleSidebar(settings, valueUtils.lowercaseAboutValue(e.message.about));
    }
    else {
        console.log('got unknown msg from background:');
        console.log(e.message);
    }
};
safari.self.addEventListener('message', handleMessage, false);

if (navigator.platform.indexOf("Mac") != -1) {
    // Allow toggling the display of the sidebar via Cmd-Shift-F
    shortcut.add('Meta+Shift+F', function() {
        console.log('Received Cmd+Shift+F');
        safari.self.tab.dispatchMessage('content', {toggleSidebar: true});
    });
} else {
    // Allow toggling the display of the sidebar via Ctrl-Shift-F
    shortcut.add('Ctrl+Shift+F', function() {
        console.log('Received Ctrl+Shift+F');
        safari.self.tab.dispatchMessage('content', {toggleSidebar: true});
    });
}