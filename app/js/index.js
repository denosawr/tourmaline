/*
 * Load everything up!
 */

const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const utils = require(path.resolve(__dirname, "js/utils.js"));

const log = new utils.log("main");

let event, emitter; // will be imported/defined later in main()
let count = 0;

// Global objects, accessible inside widgets/modules
global.variables = {};
global.widgets = {};
global.plugins = {};

/**
 * Loads a plugin and passes in emitter
 * @param {string} pluginName
 */
function loadPlugin(pluginName) {
    if (!pluginName.endsWith(".js")) {
        return;
    }
    const plugin = require(__dirname + "/widgets/" + pluginName);
    plugin.init(emitter);
}

/**
 * Finds all the plugins and loads them
 */
function findPlugins() {
    fs.readdirSync(__dirname + "/widgets", (err, files) => {
        if (err) {
            log.error("Unable to load modules:", err);
            return;
        }
        files.forEach(loadPlugin);
    });
}

/**
 * Call to refresh the wallpaper.
 */
function darkenMenubar() {
    document
        .getElementsByTagName("body")[0]
        .setAttribute("style", "opacity: 0; transition: none;");
}

function reloadBackground() {
    log.log("reloadBackground");
    let bgimage = document.getElementById("bgimage");
    bgimage.setAttribute(
        "style",
        `background-image: url(file:///tmp/wallpaper.png?v=${count})`
    );
    count += 1;
    document
        .getElementsByTagName("body")[0]
        .setAttribute("style", "transition: 0.3s; opacity: 1;");
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
    utils.addCSSVariables({
        "screen-width": screen.width + "px",
        "screen-height": screen.height + "px",
        "window-height": window.outerHeight + "px",
    });

    // hooks for helper processes
    // utils.startHelperHooks();

    event = require(__dirname + "/js/events.js");
    emitter = event.startListeners();
    emitter.on("space-change", darkenMenubar);
    emitter.on("reload-background", reloadBackground);

    // Require all the important modules.
    require(__dirname + "/js/activation.js").init(emitter);

    // Load menubar and infobar
    let requiredPlugins = ["menubar", "leftbar"].map(x =>
        require(__dirname + "/js/" + x)
    );

    // Find all plugins from dir
    let plugins = requiredPlugins.concat(
        // first load the requiredPlugins in that order
        fs
            .readdirSync(__dirname + "/widgets")
            .filter(x => x.endsWith(".js")) // Remove non-javascript files

            // Import all the plugins
            .map(x => require(__dirname + "/widgets/" + x))
            .sort()
    );

    // Load plugin config & CSS
    for (let plugin of plugins) {
        utils.addPluginConfig(plugin);

        if (plugin.style) {
            utils.injectCSS(plugin.style);
        }
    }
    utils.loadConfig();

    // init plugins
    for (let plugin of plugins) {
        global.plugins[plugin.name] = plugin;
        plugin.init(emitter);
    }
}
window.onload = main;
