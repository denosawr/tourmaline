const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const utils = require(__dirname + "/app/js/utils.js");
const cp = require("child_process");

// temporary
let a = cp.spawn(
    "/Users/denosawr/Documents/Programming/tourmaline/app/tourmaline-helper/tourmaline-helper-app",
    [],
    { detached: true, shell: true }
);

a.stdout.on("data", d => {
    console.log(d.toString());
    fs.appendFile(
        "/Users/denosawr/Downloads/General/test.txt",
        d.toString(),
        e => {
            if (e) throw e;
        }
    );
});

/*
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true; // disables CSP/unsafe-eval warning
let arguments_ = Array.from(process.argv);

fs.readdir("./", console.log);

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
        win.openDevTools();
    }

    // make window always show on top
    app.dock.hide();

    win.setVisibleOnAllWorkspaces(true);
    win.setFullScreenable(false);
    win.setIgnoreMouseEvents(true);

    win.setAlwaysOnTop(true, "screen-saver");
    win.setPosition(-6, 0, false);

    const menuBarHeight = utils.menuBarHeight();
    win.setSize(display.workArea.width + 12, menuBarHeight);

    // and load the index.html of the app.
    win.loadFile(__dirname + "/app/index.html");

    return win;
}

app.on("ready", createWindow);
*/
