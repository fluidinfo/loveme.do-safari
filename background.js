var base = "http://fluidinfo.com/about/";
var product = "Fluidinfo";
var defaultAbout = "fluidinfo";

// --------------------------- Page action --------------------------

safari.application.addEventListener("contextmenu", handleContextMenu, false);

function handleContextMenu(event) {
    var msg = product + " for ";
    switch (event.userInfo.type) {
    case "A":
        msg += "this link";
        break;
    case "IMG":
        msg += "this image";
        break;
    case "PAGE":
        msg += "this page";
        break;
    case "TEXT":
        msg += event.userInfo.about;
        break;
    default:
        // can't happen
        event.preventDefault();
    }
    event.contextMenu.appendContextMenuItem("fluidinfo", msg);
}

safari.application.addEventListener("command", handleCommand, false);

function handleCommand(event) {
    if (event.command === "fluidinfo") {
        var tab = safari.application.activeBrowserWindow.openTab("foreground");
        tab.url = makeURL(event.userInfo.about, event.userInfo.url);
        tab.activate();
    }
}

// ----------------- Utility functions for context menus -----------------

function makeURL(about, info){
  /*
   * Generate an object browser URL given an about value and an info
   * object containing information about the user event.
   */
  var fragment = refererFragment(info);
  if (fragment === ""){
    return base + encodeURIComponent(about);
  }
  else {
    return base + encodeURIComponent(about) + "?" + fragment;
  }
}

function refererFragment(info){
  /*
   * A utility function to produce a url=xxx refering page URL fragment for a
   * request to the object browser.
   */
  return info.pageUrl ? "url=" + encodeURIComponent(info.pageUrl) : "";
}
