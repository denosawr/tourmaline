const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const { ipcRenderer } = require("electron");
const stripJsonComments = require("strip-json-comments");

const CONFIG_PATH = path.join(process.env.HOME, ".config/tourmaline.json");

let currentDesktopWallpaper = "default";
let processHandlers = {};
let config = {};
defaultConfig = JSON.parse(
    stripJsonComments(
        fs.readFileSync(
            path.join(__dirname, "../../default-config.json"),
            "utf8"
        )
    )
);

let generalCSSVariables = {};
let pluginCSSVariables = {};

function recurseThroughDict(obj, prefix) {
    if (!prefix) prefix = "";

    let items = {};

    for (let item in obj) {
        if (typeof obj[item] == "object") {
            items = Object.assign(
                {},
                items,
                recurseThroughDict(
                    obj[item],
                    prefix + (prefix ? "-" : "") + item
                )
            );
        } else {
            items[prefix + (prefix ? "-" : "") + item] = obj[item];
        }
    }
    return items;
}

module.exports = {
    /**
     * Logging class. Has the same output functions as console, but
     * prepends moduleName.
     * @constructor
     * @param {string} moduleName name of module. Will be prepended to all output
     */
    log: function(moduleName) {
        this.outputString = "%c" + moduleName + ":";

        this.debug = (...args) => {
            console.debug(this.outputString, "background: #CCC", ...args);
        };
        this.log = (...args) => {
            console.log(this.outputString, "background: #CCC", ...args);
        };
        this.info = (...args) => {
            console.info(this.outputString, "background: #00B600", ...args);
        };
        this.warn = (...args) => {
            console.warn(
                this.outputString,
                "color: black, background: #FBCEB1",
                ...args
            );
        };
        this.error = (...args) => {
            console.error(
                this.outputString,
                "color: gray, background: #DC143C",
                ...args
            );
        };
    },

    /**
     * Loads the config file.
     * Note: access config file data with module.exports.get()
     */
    loadConfig: function() {
        if (!fs.existsSync(CONFIG_PATH)) {
            fs.copyFileSync(
                path.resolve(__dirname, "../../default-config.json"),
                CONFIG_PATH
            );
        }
        config = JSON.parse(
            stripJsonComments(fs.readFileSync(CONFIG_PATH, "utf8"))
        );

        // // Inject variables
        // let configVariables = recurseThroughDict(config);

        // // Remove space-specific config - just clogs up the CSS var space
        // configVariables = Object.keys(configVariables)
        //     .filter(key => !key.startsWith("spaces-"))
        //     .reduce((obj, key) => {
        //         obj["cfg-" + key] = configVariables[key];
        //         return obj;
        //     }, {});

        // module.exports.addCSSVariables(configVariables);
        module.exports.updateCurrentSpace("default");
    },

    /**
     * Function to be called internally when current space changes.
     * Will update CSS and config variables.
     * @param {string} desktopWallpaper desktop wallpaper name, passed from helper
     */
    updateCurrentSpace(desktopWallpaper) {
        if (!(desktopWallpaper in config.spaces)) {
            // There is no entry for this wallpaper, revert to default
            desktopWallpaper = "default";
        }
        currentDesktopWallpaper = desktopWallpaper;

        let configVariables = recurseThroughDict(
            config.spaces[desktopWallpaper]
        );

        let defaultConfigVariables = recurseThroughDict(
            defaultConfig.spaces[desktopWallpaper]
        );

        let pluginCSSVariables = {};
        for (let key of Object.keys(defaultConfigVariables)) {
            pluginCSSVariables["cfg-" + key] =
                key in configVariables
                    ? configVariables[key] // if key has user defined value, use that
                    : defaultConfigVariables[key]; // else use default
        }

        // pluginCSSVariables = Object.keys(defaultConfigVariables).reduce(
        //     (obj, key) => {
        //         log.log(obj, key);
        //         obj["cfg-" + key] =
        //             key in configVariables
        //                 ? configVariables[key]
        //                 : defaultConfigVariables[key];
        //         return obj;
        //     },
        //     {}
        // );

        log.log(pluginCSSVariables);
    },

    /**
     * Loops through object, given keys.
     * loopThroughObjByKey(o, ["test", "hi"]) = o.test.hi
     * @throws if key is not found
     * @param {object} obj object to recurse through.
     * @param  {string[]} keys the keys to work through.
     * @returns key if found.
     */
    loopThroughObjByKey(obj, keys) {
        for (let key of keys) {
            obj = obj[key];
            if (!obj) {
                return "KeyNotFoundForSureOhNo";
            }
        }
        return obj;
    },

    /**
     * Retrieves config option from the loaded config. Will fallback to default.
     * @param {...string} keys the path to the config value, relative to space.
     * @returns {any} the value, will fallback to defaultConfig.
     */
    get: function(...keys) {
        let cfgValue = module.exports.loopThroughObjByKey(
            config.spaces[currentDesktopWallpaper],
            keys
        );
        if (cfgValue == "KeyNotFoundForSureOhNo") {
            return module.exports.loopThroughObjByKey(
                defaultConfig.spaces[currentDesktopWallpaper],
                keys
            );
        }
        return cfgValue;
    },

    /**
     * Creates a handler to log childprocess errors to console.
     * @param {EventEmitter} cp
     * @param {string} name
     */
    errorHandler: function(cp, name) {
        cp.on("error", err => {
            log.error(`Error in child process ${name}: ${err}`);
        });
        cp.stderr.on("data", data => {
            log.error(`stderr in child process ${name}: ${data.toString()}`);
        });
    },

    /**
     * Switch two class names around, for all elements with that class name.
     * @param {string} oldClass
     * @param {string} newClass
     */
    switchClassNames: function(oldClass, newClass) {
        let elements = Array.from(document.getElementsByClassName(oldClass));
        for (let element of elements) {
            element.classList.remove(oldClass);
            element.classList.add(newClass);
        }
    },

    /**
     * Remove class.
     * @param {string} class_ Class to remove.
     */
    removeClassName: function(class_) {
        let elements = Array.from(document.getElementsByClassName(class_));
        for (let element of elements) {
            element.classList.remove(class_);
        }
    },

    /**
     * Injects custom CSS to the application.
     * @param {string} cssToInject
     */
    injectCSS: function(cssToInject) {
        let customCSS = document.createElement("style");
        customCSS.innerHTML = cssToInject;
        document.getElementsByTagName("head")[0].appendChild(customCSS);
    },

    /**
     * Change root CSS variables. Adds it to a global store.
     * @param {Object} cssVariables variables to set with CSS.
     */
    addCSSVariables: function(cssVariables) {
        for (let variable in cssVariables) {
            generalCSSVariables[variable] = cssVariables[variable];
        }

        module.exports.injectCSSVariables();
    },

    addPluginConfig: function(plugin) {
        defaultConfig.spaces.default.plugins[plugin.name] = plugin.config;
    },

    /**
     * Inject CSS variables to the document.
     * You shouldn't need to use this function.
     */
    injectCSSVariables: function() {
        document.documentElement.removeAttribute("style"); // clear all styles first

        // Inject all styles; include both general and plugin-specific CSS vars
        for (let variableList of [generalCSSVariables, pluginCSSVariables]) {
            for (let varName in variableList) {
                document.documentElement.style.setProperty(
                    "--" + varName,
                    variableList[varName]
                );
            }
        }
    },

    /**
     * Make a DOM element with the specified attributes.
     * @param {string} tag
     * @param {Object} params
     * @returns {Element}
     */
    makeElement: function(tag, attrs) {
        let element = document.createElement(tag);
        for (let key in attrs) {
            if (key == "class") {
                element.classList.add(...attrs[key]);
            } else if (key == "style") {
                for (let styleName in attrs[key]) {
                    element.style[styleName] = attrs[key][styleName];
                }
            } else {
                element[key] = attrs[key];
            }
        }
        return element;
    },

    /**
     * Makes a div with given classes, and adds it to the global widget.
     * @param {str} side Side: one of {left, center/centre, right}
     * @param {obj} args Args. Will be passed through to makeElement.
     */
    makeAttachedElement: function(side, args) {
        if (!["right", "center", "centre", "left"].includes(side)) {
            throw "Invalid side: " +
                side +
                ". Please choose from right, centre/center, left";
        }

        side = side == "center" ? "centre" : side; // I speak *proper* English, thank you very much.

        if (!args) args = {};
        if (!args.class) args.class = [];
        args.class.push(
            ...(side == "left"
                ? ["leftBarItem"]
                : ["widgetBarItem", "itemDeactivated"])
        );

        let element = module.exports.makeElement("div", args);
        global.widgets[side + "Bar"].appendChild(element);
        return element;
    },

    /**
     * Get height of macOS default menu bar.
     * I think the menu bar height is constant.
     * @returns {number}
     */
    menuBarHeight: function() {
        return 22;
    },
};

// so utils can also log.
const log = new module.exports.log("utils");
