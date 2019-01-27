/*
 * This class listens for both menubar and system
 * events and emits signals.
 */

const { EventEmitter } = require("events");
const cp = require("child_process");
const path = require("path");
const utils = require(__dirname + "/utils.js");

// defining some important global variables
let windowChangeProcess;

/**
 * @event window-change When currently active window changes, this is emitted.
 * @event space-change When current space changes, this is emitted.
 * @event activate Focus gained. Squad, assemble.
 * @event deactivate Focus lost. Squad... uh... deassemble.
 */
let globalEvent = new EventEmitter();

/**
 * Syntactic sugar to emit.
 * @param {string} eventName
 * @param {string} arg1 etc etc.
 * @returns {function}
 */
function emit() {
    return () => {
        globalEvent.emit(...arguments);
    };
}

function mouseover() {
    global.variablesactivated = true;
    if (global.variablesselected) {
        return;
    }

    utils.switchClassNames("itemDeactivated", "itemActivated");
    emit("activate")();
}

function mouseout() {
    if (global.variablesselected) {
        setTimeout(mouseout, 200);
        return;
    }
    global.variablesactivated = false;

    utils.switchClassNames("itemActivated", "itemDeactivated");
    emit("deactivate")();
}

module.exports = {
    /**
     * Starts all the listeners.
     *
     * @returns {EventEmitter}
     */
    startListeners: function() {
        document.body.onmouseout = mouseout;
        document.body.onmouseover = mouseover;

        windowChangeProcess = cp.spawn(
            utils.pathToHelper(),
            ["activeWindowChange"],
            { detached: true }
        );
        // Error handling
        utils.errorHandler(windowChangeProcess);

        windowChangeProcess.stdout.on("data", dataRaw => {
            let data = dataRaw.toString().trim();
            if (data == "/space changed/") {
                emit("space-change")();
            } else {
                emit("window-change", data)();
            }
        });
        return globalEvent;
    },

    /**
     * Stops all the listeners.
     */
    stopListeners: function() {
        document.body.onmouseout = null;
        document.body.onmouseover = null;
        windowChangeProcess.kill();
    },
};
