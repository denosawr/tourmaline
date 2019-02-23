const cp = require("child_process");
const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));

// set up logger
const log = new utils.log("menubar");

// let menuBar, childMenuBar, localizedNameHolder, child, selectionChangeProcess;
let globalEmitter;
let systemInfoWidget;

/**
 * The items in the menubar have changed, reload them.
 * @param {string} data
 */
function refreshMenuBarItems(data) {
    // called when active window
    let menubarObjects = data.splice(1); // remove "Apple" element

    global.widgets.localizedNameHolder.textContent = menubarObjects[0];

    // clear menuBar
    while (global.widgets.childMenuBar.firstChild) {
        global.widgets.childMenuBar.removeChild(
            global.widgets.childMenuBar.firstChild
        );
    }

    for (let item of menubarObjects.splice(1)) {
        let element = utils.makeElement("div", {
            class: ["macMenuBarItem"],
            textContent: item,
        });
        global.widgets.childMenuBar.appendChild(element);
    }

    systemInfoWidget.positionBar();
}

/**
 * The selected menu bar item has changed.
 * @param {UIntArray} data
 */
function menuItemSelectionChange(data) {
    let selectedElement = data.toString().trim();
    if (selectedElement == "////") {
        // nothing selected

        utils.removeClassName("macMenuBarItemSelected");
        global.variablesselected = false;
    } else {
        // something selected!

        let elements = document.getElementsByClassName("macMenuBarItem");
        for (let element of elements) {
            if (element.textContent == selectedElement) {
                element.classList.add("macMenuBarItemSelected");
            } else {
                element.classList.remove("macMenuBarItemSelected");
            }
        }
        global.variablesselected = true;
    }
}

module.exports = {
    // Name. Is used for the config setting
    name: "menubar",

    // Description. Not used, but nice to have.
    description: "Shows the menubar items on mouse hover.",

    // The default config. This must feature all available config settings.
    config: {
        selectedBackground: "rgba(138, 55, 173, 0.6)",
    },

    /// To be run when the function starts.
    init: function(emitter) {
        //let child = cp.fork(__dirname + "/menuBar-child");
        globalEmitter = emitter;

        globalEmitter.on("window-change", refreshMenuBarItems);
        globalEmitter.on("selection-change", menuItemSelectionChange);

        global.widgets.menuBar = utils.makeElement("div", {
            class: ["container"],
            id: "macMenuBar",
        });

        global.widgets.localizedNameHolder = utils.makeElement("div", {
            class: ["macMenuBarItem"],
            id: "localizedNameHolder",
            style: {
                fontWeight: "bold",
            },
            textContent: "Tourmaline",
        });

        global.widgets.childMenuBar = utils.makeElement("div", {
            id: "macChildMenuBar",
            class: ["container", "macMenuBarChild", "itemDeactivated"],
        });

        global.widgets.menuBar.appendChild(global.widgets.localizedNameHolder);
        global.widgets.menuBar.appendChild(global.widgets.childMenuBar);

        global.widgets.leftBar.appendChild(global.widgets.menuBar);

        systemInfoWidget = require(__dirname + "/infobar.js");
        systemInfoWidget.activateBar();
    },

    /// CSS to inject.
    style: `
        #localizedNameContainer {
            font-weight: bold;
        }

        .macMenuBarItem {
            padding-left: 9.25px;
            padding-right: 9.25px;
        }

        .macMenuBarItemSelected {
            background: rgba(138, 55, 173, 0.6);
        }

        .macMenuBarChild {
            margin-top: -22px;
            transition: margin-top 0.15s;
            white-space: nowrap;
        }

        .macMenuBarChild.itemActivated {
            margin-top: 0;
        }

        .bold {
            font-weight: bold;
        }
    `,
};
