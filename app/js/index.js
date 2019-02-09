/*
 * Load everything up!
 */

const { ipcRenderer } = require("electron");
const wallpaper = require("wallpaper");
const fs = require("fs");
const path = require("path");
const utils = require(path.resolve(__dirname, "js/utils.js"));

let event, emitter; // will be imported/defined later in main()

// Global objects, accessible inside widgets/modules
global.variables = {};
global.widgets = {};
global.processes = {};

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
    fs.readdir(__dirname + "/widgets", (err, files) => {
        if (err) {
            console.error("Unable to load modules:", err);
            return;
        }
        files.forEach(loadPlugin);
    });
}

/**
 * Call to refresh the wallpaper.
 */
function changeWallpaper() {
    document
        .getElementsByTagName("body")[0]
        .setAttribute("style", "opacity: 0; transition: none;");

    setTimeout(() => {
        wallpaper.get().then(path => {
            let bgimage = document.getElementById("bgimage");
            bgimage.setAttribute(
                "style",
                `background-image: url(${encodeURI('file://' + path)})`
            );
            setTimeout(() => {
                document
                    .getElementsByTagName("body")[0]
                    .setAttribute("style", "transition: 0.3s; opacity: 1;");
            }, 200);
        });
    }, 1000); // timeout to allow for animation to do its magic
}

/**
 * Loads the stuff! :)
 */
function main() {
    // populate global.widgets
    global.widgets.leftBar = document.getElementById("left");
    global.widgets.rightBar = document.getElementById("right");
    global.widgets.middleBar = document.getElementById("middle");

    // set a bunch of CSS variables
    utils.injectCSSVariables({
        "screen-width": screen.width + "px",
        "screen-height": screen.height + "px",
        "window-height": window.outerHeight + "px",
    });

    // hooks for helper processes
    utils.startHelperHooks();

    event = require(__dirname + "/js/events.js");
    emitter = event.startListeners();
    emitter.on("space-change", changeWallpaper);

    // Require all the important modules.
    require(__dirname + "/js/activation.js").init(emitter);

    findPlugins(); // find & load the plugins
}
window.onload = main;
