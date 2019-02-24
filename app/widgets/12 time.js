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
        '<span style="color: white;">' +
        getTimeString() +
        "</span>" +
        "&nbsp&nbsp&nbsp" +
        strftime("%o of %b");
    if (dateString != prevDateString) {
        global.widgets.time.innerHTML = dateString;
        prevDateString = dateString;
    }
    setTimeout(setTimeWidget, 200);
}

module.exports = {
    init: function() {
        global.widgets.time = utils.makeAttachedElement("right", {
            id: "timeWidget",
            style: {
                "padding-right": 0,
            },
        });

        setTimeWidget();
    },
};
