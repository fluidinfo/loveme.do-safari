var createOverListener = function(node) {
    // Return a function that will send the innerText of a node to our
    // background page. We'll use the functions returned as mouseover
    // functions on links in (and added to) the document.
    return function() {
        // Send the link text, trimmed of leading/trailing whitespace and
        // also the URL of the page.
        safari.self.tab.dispatchMessage('content', {
            mouseover: true,
            docURL: document.location.toString().toLowerCase(),
            linkURL: node.getAttribute('href'),
            text: node.innerText.replace(/^\s+|\s+$/g, '')
        });
        return true;
    };
};

var createOutListener = function(node) {
    // Return a function that will send a mouseout message to the
    // background page. We'll use the functions returned as mouseout
    // functions on links in (and added to) the document.
    return function() {
        safari.self.tab.dispatchMessage('content', {mouseout: true});
        return true;
    };
};

var addListeners = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.addEventListener('mouseover', createOverListener(node));
        node.addEventListener('mouseout', createOutListener(node));
    }
};

// Add a mouse event listener for all <a> tags in the document once it has
// been loaded.
addListeners(document.getElementsByTagName('a'));

// Arrange to add a mouse event listener to all <a> tags that get added to
// the document.

var body = document.getElementsByTagName('body')[0];
body.addEventListener ('DOMNodeInserted', function(event) {
    if (event.target.getElementsByTagName){
        addListeners(event.target.getElementsByTagName('a'));
    }
});

var checkSelection = function(event) {
    var selection = window.getSelection().toString();
    if (selection) {
        safari.self.tab.dispatchMessage('content', {
            selection: selection.replace(/^\s+|\s+$/g, '')
        });
    } else {
        safari.self.tab.dispatchMessage('content', {selectionCleared: true});
    }
};

document.addEventListener('mouseup', checkSelection, true);
document.addEventListener('keyup', checkSelection, true);

// -----------------------------------------------------------------------
// Context Menu
// -----------------------------------------------------------------------
var handleContextMenu = function(e) {
    console.log(e);
    var userInfo = {};
    switch (e.target.nodeName) {
    case "A":
        userInfo.about = e.target.href;
        userInfo.type = "A";
        break;
    case "IMG":
        userInfo.about = e.target.src;
        userInfo.type = "IMG";
        break;
    default:
        var text = document.getSelection().toString();
        if (text !== "") {
            userInfo.about = valueUtils.lowercaseAboutValue(text);
            userInfo.type = "TEXT";
        } else {
            userInfo.about = document.URL;
            userInfo.type = "PAGE";
        }
    }
    // always add url so we can send the referrer fragment
    userInfo.url = document.URL;
    safari.self.tab.setContextMenuEventUserInfo(e, userInfo);
};
document.addEventListener('contextmenu', handleContextMenu, false);