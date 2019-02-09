/*
 * This class listens for both menubar and system
 * events and emits signals.
 */

const { EventEmitter } = require("events");
const cp = require("child_process");
const path = require("path");
const utils = require(__dirname + "/utils.js");
const { ipcRenderer } = require("electron");
const process = require("electron").remote.process;

const expressApp = require("express")();
const http = require("http").Server(expressApp);
const io = require("socket.io")(http);

const psList = require("ps-list");

// defining some important global variables
let windowChangeProcess;
let socket;

/**
 * @event window-change When currently active window changes, this is emitted.
 * @event space-change When current space changes, this is emitted.
 * @event activate Focus gained. Squad, assemble.
 * @event deactivate Focus lost. Squad... uh... deassemble.
 * @event selection-change Selected item in menu bar changed. Will only be called during when activated.
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
    console.log("mouseover");
    global.variables.activated = true;
    if (global.variables.selected) {
        return;
    }

    socket.emit("startSelectionListener");

    utils.switchClassNames("itemDeactivated", "itemActivated");
    emit("activate")();
}

function mouseout() {
    if (global.variables.selected) {
        setTimeout(mouseout, 200);
        return;
    }
    global.variables.activated = false;

    socket.emit("stopSelectionListener");

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

        io.on("connection", function(socket_) {
            try {
                socket.emit("shutdown"); // kill existing socket
            } catch {}

            socket = socket_;

            console.log("connected to a new socket.");
            socket.on("disconnect", function() {
                console.warn("user disconnected");
            });

            socket.on("windowChange", function(msg) {
                console.log("message", msg, typeof msg);
                emit("window-change", msg)();
            });

            socket.on("selectionChange", function(msg) {
                console.log("selection change", msg);
                global.variables.selected = !(msg == "////");
                emit("selection-change", msg)();
            });

            socket.on("spaceChange", function() {
                emit("space-change")();
            });
        });

        http.listen(3000, function() {
            console.log("Listening on *:3000");
        });

        // Start tourmaline helper, if not already started.
        let arguments_ = Array.from(process.argv);
        if (!arguments_ || !arguments_.includes("--no-launch-helper")) {
            let objectList = psList().then(options => {
                let alreadyRunning = false;
                for (let process of options) {
                    if (process.name == "tourmaline-helper") {
                        alreadyRunning = true;
                    }
                }

                if (!alreadyRunning) {
                    console.log(
                        "No existing tourmaline-helper running, will spawn another."
                    );
                    cp.spawn("open", [
                        "-a",
                        "/Users/denosawr/Documents/Programming/tourmaline/tourmaline-helper/tourmaline-helper.app",
                    ]);
                }
            });
        }

        return globalEvent;
    },

    /**
     * Stops all the listeners.
     */
    stopListeners: function() {
        document.body.onmouseout = null;
        document.body.onmouseover = null;
        // windowChangeProcess.kill();
        utils.killHelper(windowChangeProcess);
    },
};

ipcRenderer.on("will-quit", event => {
    socket.emit("shutdown");
});
