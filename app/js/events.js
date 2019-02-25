/* This class listens for both menubar and system
 * events and emits signals.
 */

const { EventEmitter } = require("events");
const cp = require("child_process");
const path = require("path");
const utils = require(__dirname + "/utils.js");
const { ipcRenderer } = require("electron");
const { dialog, process } = require("electron").remote;

const expressApp = require("express")();
const http = require("http").Server(expressApp);
const io = require("socket.io")(http);

const psList = require("ps-list");

const log = new utils.log("events");

// defining some important global variables
let windowChangeProcess;
let socket;

/**
 * @event window-change When currently active window changes, this is emitted.
 * @event space-change When current space changes, this is emitted.
 * @event reload-background Reload the background image of the bar.
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
    log.debug("mouseover");
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

            socket.emit("getWallpaper");
            log.log("connected to a new socket.");
            socket.on("disconnect", function() {
                log.warn("user disconnected");
            });

            socket.on("windowChange", function(msg) {
                emit("window-change", msg)();
            });

            socket.on("selectionChange", function(msg) {
                global.variables.selected = !(msg == "////");
                emit("selection-change", msg)();
            });

            socket.on("spaceChange", function(m) {
                emit("space-change")();
            });

            socket.on("reloadBackground", function(msg) {
                emit("reload-background", msg)();
            });

            socket.on("noAccessibility", function() {
                // We don't have accessibility. This... isn't a great situation.
                log.log("No Accessibility.");
                socket.emit("shutdown");
                dialog.showMessageBox(null, {
                    type: "error",
                    title: "Enable Accessibility permissions!",
                    message:
                        "Please give tourmaline-helper permissions to use the Accessibility APIs in order to function. " +
                        "When you've done that, just relaunch Tourmaline.",
                });
                ipcRenderer.send("quit");
            });
        });

        http.listen(3000, function() {
            log.log("Listening on *:3000");
        });

        // Start tourmaline helper, if not already started.
        let arguments_ = Array.from(process.argv);
        log.log(path.join(__dirname, "../../../../Frameworks/helper.app"));
        let helperPath = path.join(
            __dirname,
            "../../../../Frameworks/helper.app"
        );
        if (!fs.existsSync(helperPath)) {
            helperPath = path.join(
                __dirname,
                "../../tourmaline-helper/tourmaline-helper.app"
            );
        }
        log.log(helperPath);
        if (!arguments_ || !arguments_.includes("--no-launch-helper")) {
            let objectList = psList().then(options => {
                let alreadyRunning = false;
                for (let process of options) {
                    if (process.name == "tourmaline-helper") {
                        alreadyRunning = true;
                    }
                }

                if (!alreadyRunning) {
                    log.log(
                        "No existing tourmaline-helper running, will spawn another."
                    );
                    cp.spawn("open", ["-a", helperPath]);
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
        // utils.killHelper(windowChangeProcess);
    },
};

ipcRenderer.on("will-quit", event => {
    socket.emit("shutdown");
});
