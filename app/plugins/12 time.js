const strftime = require("strftime");
const path = require("path");
const utils = require(Object.keys(require.cache).filter(f =>
    f.endsWith("app/js/utils.js")
)[0]);

function getTimeString() {
    return strftime("%a ") + strftime("%l:").trim() + strftime("%M %P");
}

let prevDateString = "";

/**
 * Update global.timeWidget to have the right time.
 */
function setTimeWidget() {
    let dateString =
        '<span style="color: var(--cfg-plugins-time-main)">' +
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
    name: "time",

    config: {
        main: "white",
    },

    init: function() {
        global.widgets.time = utils.makeAttachedElement(
            module.exports,
            "right",
            {
                id: "timeWidget",
                style: {
                    "padding-right": 0,
                },
            }
        );

        setTimeWidget();
    },
};
