var settings = {
    sidebarSide: 'right',
    sidebarWidth: 300
};

var hideSidebar = function(sidebar) {
    var options = {};
    options[settings.sidebarSide] = -1 * settings.sidebarWidth;
    $(sidebar).animate(options, 500, function() {
        $(sidebar).css('display', 'none');
    });
};

var showSidebar = function(sidebar) {
    var options = {};
    options[settings.sidebarSide] = 0;
    $(sidebar).css(settings.sidebarSide, '-' + settings.sidebarWidth + 'px')
        .css('display', 'block')
        .animate(options, 500);
};

var getSidebar = function() {
    return document.getElementById('fi_sidebar');
};

var updateSidebar = function(sidebar, about) {
    sidebar.src = 'http://' + fluidinfoHost + '/infomaniac/' + encodeURIComponent(about);
};

var toggleSidebar = function(about) {
    var sidebar = getSidebar();
    if (sidebar) {
        if (sidebar.style.display === 'none') {
            updateSidebar(sidebar, about);
            showSidebar(sidebar);
        }
        else {
            hideSidebar(sidebar);
        }
    }
    else {
        // There is no sidebar. Create one showing the Fluidinfo object for
        // the current document url, and display it.
        createSidebar(function(sidebar) {
            updateSidebar(sidebar, about);
            showSidebar(sidebar);
        });
    }
};

var createSidebar = function(callback) {
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
        // Get the current settings so we know what style & size to use.
        // chrome.extension.sendRequest(
        //     {action: 'get-settings'},
        //     function(result){
        //         settings = result;
        //         var sidebar = document.createElement('iframe');
        //         sidebar.id = 'fi_sidebar';
        //         sidebar.classList.add('fluidinfo_sidebar');
        //         sidebar.classList.add('fluidinfo_sidebar_' + settings.sidebarSide);
        //         sidebar.setAttribute('width', settings.sidebarWidth + 'px');
        //         sidebar.title = 'Fluidinfo sidebar';
        //         parent.appendChild(sidebar);
        //         callback(sidebar);
        //     }
        // );
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
    var sidebar, msg = e.message;
    if (msg.action === 'show sidebar') {
        sidebar = getSidebar();
        if (sidebar) {
            updateSidebar(sidebar, valueUtils.lowercaseAboutValue(e.message.about));
            if (sidebar.style.display === 'none') {
                showSidebar(sidebar);
            }
        }
        else {
            createSidebar(function(sidebar) {
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
        toggleSidebar(valueUtils.lowercaseAboutValue(e.message.about));
    }
    else {
        console.log('got unknown msg from background:');
        console.log(e.message);
    }
};
safari.self.addEventListener('message', handleMessage, false);

// Allow toggling the display of the sidebar via Control-Shift-f
shortcut.add('Ctrl+Shift+F', function() {
    console.log('Received Ctrl+Shift+F');
    toggleSidebar(document.location.toString());
});

// Allow toggling the display of the sidebar via Control-Shift-f
shortcut.add('Ctrl+Shift+Z', function(){
    console.log('Received Ctrl+Shift+Z');
    toggleSidebar(document.location.toString());
});
