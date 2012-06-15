/*
 * This script is injected into all windows.
 *
 *  It should only do things if it's in the sidebar frame, not
 * in the main tab code.
 */
var close = document.getElementById('fluidinfo-sidebar-close');

if (close) {
    // Listen for requests from the background page.
    var handleMessage = function(e) {
        var msg = e.message;
        if (e.name === 'background' && msg.action === 'reload') {
            window.location.reload();
        }
    };
    safari.self.addEventListener('message', handleMessage, false);

    close.addEventListener(
        'click',
        function(evt) {
            safari.self.tab.dispatchMessage('iframe', {
                action: 'hide sidebar'
            });
            return false;
        },
        false
    );

    document.getElementsByTagName('body')[0].addEventListener(
        'click',
        function(evt) {
            // Intercept click events on links and send a message to the
            // background page so they can be displayed in the current tab.
            var url = null;
            if (evt.target.nodeName === 'A') {
                url = evt.target.getAttribute('href');
            }
            else if (evt.target.nodeName === 'IMG') {
                url = evt.target.parentNode.getAttribute('href');
                console.log(evt);
                if (url && url.slice(0, 17) === '/login/fluidinfo/') {
                    // The user is trying to log in. Ask the background
                    // page to start that process (we can't do it here as
                    // we're just a lowly iframe).
                    safari.self.tab.dispatchMessage('iframe', {
                        action: 'oauth login'
                    });
                    evt.preventDefault();
                    evt.stopPropagation();
                    return false;
                }
            }
            if (url) {
                // Ask the background page to open the link in the tab that
                // created us.
                safari.self.tab.dispatchMessage('iframe', {
                    action: 'open',
                    docURL: document.location.toString(),
                    linkURL: url
                });
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
            else {
                return true;
            }
        },
        true
    );
}
