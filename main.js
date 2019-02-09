const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const utils = require(__dirname + "/app/js/utils.js");
const cp = require("child_process");

let lastProcessCount = 0;
let processes = {};

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true; // disables CSP/unsafe-eval warning
let arguments_ = Array.from(process.argv);

let win;
function createWindow() {
    // Create the browser window.
    const screen = require("electron").screen; // cannot use until app.ready emitted
    const display = screen.getPrimaryDisplay();

    win = new BrowserWindow({
        width: display.workArea.width,
        height: 22,
        enableLargerThanScreen: true,
        //height: 50,

        frame: false,
        transparent: true,
        hasShadow: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    if (arguments_ && arguments_.includes("--dev")) {
        win.openDevTools({ mode: "detach" });
    }

    app.dock.hide();

    win.setVisibleOnAllWorkspaces(true);
    win.setFullScreenable(false);
    win.setIgnoreMouseEvents(true);

    win.setAlwaysOnTop(true, "screen-saver");
    win.setPosition(-6, -1, false);

    const menuBarHeight = utils.menuBarHeight();
    win.setSize(display.workArea.width + 12, menuBarHeight + 2);

    // and load the index.html of the app.
    win.loadFile(__dirname + "/app/index.html");

    return win;
}

app.on("ready", createWindow);
app.on("will-quit", event => {
    console.log("Will quit.");
    win.webContents.send("will-quit");
});
