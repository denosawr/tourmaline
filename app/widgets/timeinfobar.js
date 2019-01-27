const strftime = require("strftime");
const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));

function getTimeString() {
    return strftime("%a ") + strftime("%l:").trim() + strftime("%M %P");
}

let prevDateString = "";

/**
 * Update global.timeWidget to have the right time.
 */
function setTimeWidget() {
    let dateString =
        getTimeString() +
        "&nbsp&nbsp&nbsp" +
        '<span style="opacity:0.7;">' +
        strftime("%o of %b") +
        "</span>";
    if (dateString != prevDateString) {
        global.widgets.timeWidget.innerHTML = dateString;
        prevDateString = dateString;
    }
    setTimeout(setTimeWidget, 200);
}

let timewidget;

module.exports.init = function() {
    rightBar = document.getElementById("right");

    global.widgets.timeWidget = utils.makeElement("div", {
        class: ["rightBarItem", "itemDeactivated"],
        id: "timeWidget",
    });

    setTimeWidget();

    rightBar.appendChild(global.widgets.timeWidget);
};

utils.injectCSS(`
#timeWidget {
    margin-right: -25px;
    padding-right: 0;
}

.rightBarItem {
    padding-left: 9.25px;
    padding-right: 9.25px;
    transition: opacity 0.5s;
}

.rightBarItem.itemActivated {
    opacity: 0;
}
`);
