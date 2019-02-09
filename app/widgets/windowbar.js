const cp = require("child_process");
const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));

let menuBar, childMenuBar, localizedNameHolder, child, selectionChangeProcess;
let globalEmitter;
let systemInfoWidget;

/**
 * The items in the menubar have changed, reload them.
 * @param {string} data
 */
function refreshMenuBarItems(data) {
    // called when active window
    console.log("Menu Bar Refresh!");

    console.log("On data", data);
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
    console.log("selection Change");
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

function activate() {
    // Start selectionChangeHandler
    /*selectionChangeProcess = cp.spawn(utils.pathToHelper(), [
        "menuBarSelection",
    ]);
    // Error handling
    utils.errorHandler(selectionChangeProcess, "selectionChangeProcess");

    selectionChangeProcess.stdout.on("data", menuItemSelectionChange);*/
    /*selectionChangeProcess = utils.createHelper(
        "selectionChangeHandler",
        menuItemSelectionChange,
        ["menuBarSelection"]
    );*/
}

function deactivate() {
    //utils.killHelper(selectionChangeProcess);
}

module.exports.init = function(emitter) {
    //let child = cp.fork(__dirname + "/menuBar-child");
    globalEmitter = emitter;

    globalEmitter.on("activate", activate);
    globalEmitter.on("deactivate", deactivate);
    globalEmitter.on("window-change", refreshMenuBarItems);
    globalEmitter.on("selection-change", menuItemSelectionChange);

    changeWallpaper();

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

    systemInfoWidget = require(__dirname + "/systeminfo.js");
    systemInfoWidget.activateBar();
};

utils.injectCSS(`
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
`);
