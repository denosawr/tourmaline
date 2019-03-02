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
            class: ["menuBarItem"],
            textContent: item,
        });
        global.widgets.childMenuBar.appendChild(element);
    }

    global.plugins.leftbar.positionBar();
}

/**
 * The selected menu bar item has changed.
 * @param {UIntArray} data
 */
function menuItemSelectionChange(data) {
    let selectedElement = data.toString().trim();
    if (selectedElement == "////") {
        // nothing selected

        utils.removeClassName("menuBarItemSelected");
        global.variablesselected = false;
    } else {
        // something selected!
        log.debug(selectedElement);

        let elements = document.getElementsByClassName("menuBarItem");
        for (let element of elements) {
            if (element.textContent == selectedElement) {
                element.classList.add("menuBarItemSelected");
            } else {
                element.classList.remove("menuBarItemSelected");
            }
        }
        global.variablesselected = true;
    }
    global.widgets.appleMenuItem.classList[
        selectedElement == "Apple" ? "add" : "remove" // if "Apple" is selected, we add; otherwise, we remove
    ]("menuBarItemSelected");
}

function updateIndicator() {
    let indicator = utils.get("plugins", "menubar", "applemenu", "indicator");
    if (indicator == "indicator") {
        // show the current space number
        let spaceNumberPath = utils.getHelperPath("space-number-app");
        let process = cp.spawn(spaceNumberPath, []);

        process.stdout.on("data", data => {
            global.widgets.appleMenuItem.textContent = data.toString();
        });

        utils.errorHandler(process, "MenubarIndicator");
    } else {
        global.widgets.appleMenuItem.textContent = indicator;
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

        applemenu: {
            // default: "indicator", can use 
            indicator: "indicator",
            // default: "14px", can use "18px" for 
            fontsize: "14px",
            align: "center",
            background: "transparent",
            color: "rgba(255, 255, 255, 0.7)",
        },
    },

    /// To be run when the function starts.
    init: function(emitter) {
        //let child = cp.fork(__dirname + "/menuBar-child");
        globalEmitter = emitter;

        globalEmitter.on("window-change", refreshMenuBarItems);
        globalEmitter.on("selection-change", menuItemSelectionChange);

        global.widgets.menuBar = utils.makeElement("div", {
            class: ["container"],
            id: "menuBar",
        });

        global.widgets.appleMenuItem = utils.makeElement("div", {
            class: ["menuBarItem"],
            id: "appleMenuItem",
        });
        updateIndicator();

        global.widgets.localizedNameHolder = utils.makeElement("div", {
            class: ["menuBarItem"],
            id: "localizedNameHolder",
            style: {
                fontWeight: "bold",
            },
            textContent: "Tourmaline is loading...",
        });

        global.widgets.childMenuBar = utils.makeElement("div", {
            id: "macChildMenuBar",
            class: ["container", "menuBarChild", "itemDeactivated"],
        });

        global.widgets.menuBar.appendChild(global.widgets.appleMenuItem);
        global.widgets.menuBar.appendChild(global.widgets.localizedNameHolder);
        global.widgets.menuBar.appendChild(global.widgets.childMenuBar);

        global.widgets.leftBarElement.appendChild(global.widgets.menuBar);
    },

    update: function() {
        updateIndicator();
    },

    /// CSS to inject.
    style: `
        .menuBarItemSelected {
            background: var(--cfg-plugins-menubar-selectedBackground) !important;
        }

        #localizedNameContainer {
            font-weight: bold;
        }
        
        #appleMenuItem {
            min-width: 16.5px;
            max-width: 16.5px;
            font-size: var(--cfg-plugins-menubar-applemenu-fontsize, 14px);
            text-align: var(--cfg-plugins-menubar-applemenu-align, center); 
            background: var(--cfg-plugins-menubar-applemenu-background, transparent);
            color: var(--cfg-plugins-menubar-applemenu-color, white);
        }

        .menuBarItem {
            font-family: BlinkMacSystemFont;
            padding-left: 9.25px;
            padding-right: 9.25px;
            color: white;
            color: var(--cfg-foreground);
        }

        .menuBarChild {
            margin-top: -22px;
            transition: margin-top 0.15s;
            white-space: nowrap;
        }

        .menuBarChild.itemActivated {
            margin-top: 0;
        }

        .bold {
            font-weight: bold;
        }
    `,
};
