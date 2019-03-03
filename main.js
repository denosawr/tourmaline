const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const utils = require(__dirname + "/app/js/utils.js");
const opn = require("opn");
const path = require("path");

const homedir = require("os").homedir();

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

    // and load the index.html of the app.
    win.loadFile(__dirname + "/app/index.html");
    win.setSize(display.size.width + 12, menuBarHeight + 2);

    tray = new Tray("app/assets/iconTrayTemplate.png");
    const contextMenu = Menu.buildFromTemplate([
        { id: "desktopName", label: "Current wallpaper name:", enabled: false },

        { type: "separator" },

        {
            label: "Show Configuration File",
            click: () => {
                opn(path.join(homedir, ".config/tourmaline.json"));
            },
        },
        {
            label: "Open Plugins Folder",
            click: () => {
                opn(homedir);
            },
        },

        { type: "separator" },

        {
            label: "About Tourmaline",
            click: () => {
                opn("https://github.com/denosawr/tourmaline");
            },
        },
        {
            label: "Open Developer Tools",
            click: () => {
                win.openDevTools({ mode: "detach" });
            },
        },
        {
            label: "Quit Tourmaline",
            click: () => {
                app.quit();
            },
        },
    ]);
    tray.setToolTip("This is my application.");
    tray.setContextMenu(contextMenu);

    return win;
}

ipcMain.on("quit", () => {
    console.log("Got quit event.");
    app.quit();
});

app.on("ready", createWindow);
app.on("will-quit", event => {
    console.log("Will quit.");
    win.webContents.send("will-quit");
});
