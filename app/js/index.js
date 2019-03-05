/*
 * Load everything up!
 */

const { screen, ipcRenderer } = require("electron");
const fs = require("fs-extra");
const path = require("path");
const utils = require(path.resolve(__dirname, "js/utils.js"));

const homedir = require("os").homedir();
const CONFIGDIR = path.resolve(homedir, ".config/tourmaline/");

const log = new utils.log("index");

let event, emitter; // will be imported/defined later in main()
let count = 0;

// Global objects, accessible inside widgets/modules
global.variables = {};
global.widgets = {};
global.plugins = {};

/**
 * Call to refresh the wallpaper.
 */
function spaceChange() {
    // darken menubar
    document
        .getElementsByTagName("body")[0]
        .setAttribute("style", "opacity: 0; transition: none;");
}

function reloadBackground(msg) {
    ipcRenderer.send("wallpaper-change", msg);

    let bgimage = document.getElementById("bgimage");
    bgimage.setAttribute(
        "style",
        `background-image: url(file:///tmp/wallpaper.png?v=${count})`
    );
    count += 1;
    document
        .getElementsByTagName("body")[0]
        .setAttribute("style", "transition: 0.3s; opacity: 1;");

    // Update plugins and things
    utils.updateCurrentSpace(msg);
}

/**
 * Loads the stuff! :)
 */
function main() {
    // populate global.widgets
    global.widgets.leftBarElement = document.getElementById("left");
    global.widgets.rightBar = document.getElementById("right");
    global.widgets.centreBar = document.getElementById("middle");

    // set a bunch of CSS variables
    const display = screen.getPrimaryDisplay();
    utils.addCSSVariables({
        "screen-width": display.size.width + "px",
        "screen-height": display.size.height + "px",
        "window-height": window.outerHeight + "px",
    });

    event = require(__dirname + "/js/events.js");
    emitter = event.startListeners();
    emitter.on("space-change", spaceChange);
    emitter.on("reload-background", reloadBackground);

    // Require all the important modules.
    require(__dirname + "/js/activation.js").init(emitter);

    // Load menubar and infobar
    let plugins = ["menubar", "leftbar"].map(x =>
        require(__dirname + "/js/" + x)
    );

    // Make .config/tourmaline and .config/tourmaline/plugins
    if (!fs.existsSync(CONFIGDIR)) {
        // Make the directory
        fs.mkdirSync(CONFIGDIR, { recursive: true });
    }
    if (!fs.existsSync(path.resolve(CONFIGDIR, "plugins"))) {
        // Copy plugins
        fs.copySync(
            __dirname + "/plugins/",
            path.resolve(CONFIGDIR, "plugins")
        );
    }

    // Symlink app/node_modules ❯ .config/tourmaline/node_modules
    const SYMLINKPATH = path.resolve(CONFIGDIR, "node_modules");
    if (fs.existsSync(SYMLINKPATH)) {
        fs.unlinkSync(SYMLINKPATH);
    }
    fs.symlinkSync(
        path.resolve(utils.getMainFolderPath(), "node_modules"),
        SYMLINKPATH
    );

    // Load plugins from config
    plugins = plugins.concat(
        fs
            .readdirSync(path.resolve(CONFIGDIR, "plugins"))
            .filter(x => x.endsWith(".js")) // Remove non-javascript files

            // Import all the plugins
            .map(x => require(path.resolve(CONFIGDIR, "plugins", x)))
            .sort()
    );

    // Load plugin config & CSS
    for (let plugin of plugins) {
        global.plugins[plugin.name] = plugin;
        utils.addPluginConfig(plugin);

        if (plugin.style) {
            utils.injectCSS(plugin.style);
        }
    }
    utils.loadConfig();

    // init plugins
    for (let plugin of plugins) {
        plugin.init(emitter);
    }
}
window.onload = main;
