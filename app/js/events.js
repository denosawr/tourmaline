/*
 * This class listens for both menubar and system
 * events and emits signals.
 */

const { EventEmitter } = require("events");
const cp = require("child_process");
const utils = require(__dirname + "/utils.js");

// Electron things
const { ipcRenderer } = require("electron");
const { dialog, process } = require("electron").remote;

// Sockets and webserver
const expressApp = require("express")();
const http = require("http").Server(expressApp);
const io = require("socket.io")(http);

// process listening
const psList = require("ps-list");

const log = new utils.log("events");

// defining some important global variables
let socket;
let server;

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

/**
 * @private
 * Called when mouse is moved into the bar (hovering over)
 */
function mouseover() {
    global.variables.activated = true;
    if (global.variables.selected) {
        return;
    }

    socket.emit("start-selection-listener");

    // Activate everything
    utils.switchClassNames("itemDeactivated", "itemActivated");
    emit("activate")();
}

/**
 * @private
 * Called when mouse is moved out of the bar (no longer hovering over)
 * Note that this function will not be called if a menu bar item is active.
 */
function mouseout() {
    // If a menu bar item is selected, just postpone the mouseout
    if (global.variables.selected) {
        setTimeout(mouseout, 200);
        return;
    }
    global.variables.activated = false;

    socket.emit("stop-selection-listener");

    // Deactivate everything
    utils.switchClassNames("itemActivated", "itemDeactivated");
    emit("deactivate")();
}

/**
 * @private
 * Adds listeners to the newly connected socket.
 * @param {socket} socket_ new SocketIO socket
 */
function onConnection(socket_) {
    log.info("Connected to a new socket with tourmaline-helper.");
    try {
        socket.emit("shutdown"); // kill existing socket
    } catch {}

    socket = socket_;
    socket.emit("get-wallpaper");

    // Handlers
    socket.on("disconnect", function() {
        log.warn("User disconnected");
    });

    for (let event of ["window-change", "space-change", "reload-background"]) {
        socket.on(event, msg => {
            emit(event, msg)();
        });
    }

    socket.on("selection-change", msg => {
        global.variables.selected = !(msg == "////");
        emit("selection-change", msg)();
    });

    socket.on("no-accessibility", function() {
        // We don't have accessibility. This... isn't a great situation.
        log.error("No Accessibility.");
        dialog.showMessageBox(null, {
            type: "error",
            title: "Enable Accessibility permissions!",
            message:
                "Please give tourmaline-helper permissions to use the Accessibility APIs in order to function. " +
                "When you've done that, just relaunch Tourmaline.",
        });
        ipcRenderer.send("quit");
    });
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

        io.on("connection", onConnection);

        // Start server
        server = http.listen(3000, function() {
            log.info("Server listening on *:3000");
        });

        // Start tourmaline helper, if not already started.
        let arguments_ = Array.from(process.argv);
        let helperPath = utils.getHelperPath("tourmaline-helper.app");

        if (!arguments_ || !arguments_.includes("--no-launch-helper")) {
            // Check if helper is already loaded
            let objectList = psList().then(options => {
                let alreadyRunning = false;
                for (let process of options) {
                    if (process.name == "tourmaline-helper") {
                        alreadyRunning = true;
                    }
                }

                if (!alreadyRunning) {
                    log.info(
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
        server.close();
        socket.emit("shutdown");
    },
};

// Stop tourmaline-helper on app quit
ipcRenderer.on("will-quit", () => {
    socket.emit("shutdown");
});
