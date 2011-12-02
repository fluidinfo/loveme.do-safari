document.addEventListener("contextmenu", handleContextMenu, false);

function handleContextMenu(event) {
    var userInfo = {};
    switch (event.target.nodeName) {
    case "A":
        userInfo.about = event.target.href;
        userInfo.type = "A";
        break;
    case "IMG":
        userInfo.about = event.target.src;
        userInfo.type = "IMG";
        break;
    default:
        var text = document.getSelection().toString();
        if (text !== "") {
            userInfo.about = text;
            userInfo.type = "TEXT";
        } else {
            userInfo.about = document.URL;
            userInfo.type = "PAGE";
        }
    }
    // always add url so we can send the referrer fragment
    userInfo.url = document.URL;
    safari.self.tab.setContextMenuEventUserInfo(event, userInfo);
}