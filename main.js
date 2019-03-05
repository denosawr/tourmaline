const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const utils = require(__dirname + "/app/js/utils.js");
const opn = require("opn");
const clipboardy = require("clipboardy");
const path = require("path");

const homedir = require("os").homedir();

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true; // disables CSP/unsafe-eval warning
let arguments_ = Array.from(process.argv);
let win;

let tray;
let wallpaperName = "default";

function createWindow() {
    // Create the browser window.
    const screen = require("electron").screen; // cannot use until app.ready emitted
    const display = screen.getPrimaryDisplay();

    win = new BrowserWindow({
        width: display.workArea.width,
        height: 22, // 22: menu bar height

        // Windows have rounded corners, so we draw the window out of screen bounds
        // so you don't see the rounded corners.
        enableLargerThanScreen: true,

        frame: false,
        transparent: true,
        hasShadow: false,
        resizable: false,

        // Suppresses security message
        webPreferences: {
            nodeIntegration: true,
        },

        // https://github.com/electron/electron/issues/10420
        // Issue: Closing detach devtools disables browser window transparency/vibrancy
        backgroundColor: "#00000000",
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

    tray = new Tray(utils.locateFile("app/assets/iconTrayTemplate.png"));

    return win;
}

ipcMain.on("quit", () => {
    console.log("Got quit event.");
    app.quit();
});

function updateTrayMenu(_, wallpaper) {
    wallpaperName = wallpaper;

    let template = menuItemsTemplate;
    template[0].label = `Wallpaper name: ${wallpaper}`;

    const contextMenu = Menu.buildFromTemplate(menuItemsTemplate);
    tray.setContextMenu(contextMenu);
}

ipcMain.on("wallpaper-change", updateTrayMenu);

app.on("ready", createWindow);
app.on("will-quit", event => {
    console.log("Will quit.");
    win.webContents.send("will-quit");
});

let menuItemsTemplate = [
    {
        id: "desktopName",
        label: "Wallpaper name: default",
        enabled: false,
    },
    {
        label: "    Copy to Clipboard",
        click: () => {
            clipboardy.write(wallpaperName);
        },
    },

    { type: "separator" },

    {
        label: "Show Configuration File",
        click: () => {
            opn(path.join(homedir, ".config/tourmaline/config.json"), {
                wait: false,
            });
        },
    },
    {
        label: "Open Configuration Folder",
        click: () => {
            opn(path.join(homedir, ".config/tourmaline/"), {
                wait: false,
            });
        },
    },

    { type: "separator" },

    {
        label: "About Tourmaline",
        click: () => {
            opn("https://github.com/denosawr/tourmaline", { wait: false });
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
];
