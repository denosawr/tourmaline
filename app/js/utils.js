const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const stripJsonComments = require("strip-json-comments");

/**
 * @private
 * Loops through object, given keys.
 * loopThroughObjByKey(o, ["test", "hi"]) = o.test.hi
 * @throws if key is not found
 * @param {object} obj object to recurse through.
 * @param  {string[]} keys the keys to work through.
 * @returns key if found.
 */
function loopThroughObjByKey(obj, keys) {
    for (let key of keys) {
        obj = obj[key];
        if (!obj) {
            return "KeyNotFoundForSureOhNo";
        }
    }
    return obj;
}

/**
 * @private
 * Returns of all items in object, handing nested objects by prepending their path.
 * @param {object} obj Object to recurse through
 * @param {str} prefix Prefix to add to all recursions
 * @returns {obj} all items in obj
 */
function recurseThroughDict(obj, prefix) {
    if (!prefix) prefix = "";

    let items = {};

    for (let item in obj) {
        if (item == "style" || typeof obj[item] != "object") {
            items[prefix + (prefix ? "-" : "") + item] = obj[item];
        } else {
            items = Object.assign(
                {},
                items,
                recurseThroughDict(
                    obj[item],
                    prefix + (prefix ? "-" : "") + item
                )
            );
        }
    }
    return items;
}

// Start with blank module.exports...
module.exports = {};

/*
 * --------------------------------------------------------
 * General helper utilities.
 * --------------------------------------------------------
 */
Object.assign(module.exports, {
    /**
     * Logging class. Has the same output functions as console except debug,
     * but prepends moduleName.
     * @constructor
     * @param {string} moduleName name of module. Will be prepended to all output
     */
    log: function(name) {
        this.log = console.log.bind(console, `%c${name}:`, "background: #CCC");
        this.info = console.info.bind(
            console,
            `%c${name}:`,
            "background: #C8A7D9"
        );
        this.warn = console.warn.bind(console, `${name}:`);
        this.error = console.error.bind(console, `${name}:`);
    },

    /**
     * Get height of macOS default menu bar.
     * I think the menu bar height is constant.
     * @returns {number}
     */
    menuBarHeight: function() {
        return 22;
    },

    /**
     * Searches both Frameworks and the raw file path for the helper app.
     * @param {str} filename the name of the executable
     * @returns path of the found application.
     */
    getHelperPath: function(filename) {
        let helperPath = path.join(
            __dirname,
            `../../../../Frameworks/${filename}`
        );
        if (!fs.existsSync(helperPath)) {
            helperPath = path.join(
                __dirname,
                `../../tourmaline-helper/${filename}`
            );
        }
        return helperPath;
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
});

/*
 * --------------------------------------------------------
 * Deals with everything config.
 * --------------------------------------------------------
 */

const CONFIG_PATH = path.join(process.env.HOME, ".config/tourmaline.json");
let currentDesktopWallpaper = "default";

let config = {}; // for the loaded config file
defaultConfig = JSON.parse(
    stripJsonComments(
        fs.readFileSync(
            path.join(__dirname, "../../default-config.json"),
            "utf8"
        )
    )
); // for the default config file

Object.assign(module.exports, {
    /**
     * @private
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
    },

    /**
     * @private
     * Function to be called internally when current space changes.
     * Will update CSS and config variables.
     * @param {string} desktopWallpaper desktop wallpaper name, passed from helper
     * @param {bool} skipUpdate skip updating plugins. Called on first run.
     */
    updateCurrentSpace(desktopWallpaper, skipUpdate) {
        log.info("Current desktop wallpaper:", desktopWallpaper);
        if (!(desktopWallpaper in config.spaces)) {
            // There is no entry for this wallpaper, revert to default
            desktopWallpaper = "default";
        }
        currentDesktopWallpaper = desktopWallpaper;

        // set CSS variables to match current space config
        let configVariables = recurseThroughDict(
            config.spaces[desktopWallpaper]
        );

        let defaultSpaceVariables = recurseThroughDict(config.spaces.default);

        let defaultConfigVariables = recurseThroughDict(
            desktopWallpaper in defaultConfig
                ? defaultConfig.spaces[desktopWallpaper]
                : defaultConfig.spaces.default
        );

        pluginCSSVariables = {};
        for (let key of Object.keys(defaultConfigVariables)) {
            let value;
            if (key in configVariables) {
                value = configVariables[key];
            } else if (key in defaultSpaceVariables) {
                value = defaultSpaceVariables[key];
            } else {
                value = defaultConfigVariables[key];
            }
            pluginCSSVariables["cfg-" + key] = value;
        }
        module.exports.injectCSSVariables();

        if (skipUpdate) return;

        // Update widget styling
        for (let key in global.plugins) {
            let plugin = global.plugins[key];
            let elementStyle = module.exports.get(
                "plugins",
                plugin.name,
                "style"
            );
            let style =
                elementStyle != "KeyNotFoundForSureOhNo"
                    ? elementStyle
                    : module.exports.get("style");

            if (pluginElements[plugin.name]) {
                module.exports.setStyleOfElement(
                    pluginElements[plugin.name],
                    style
                );
            }

            if (plugin.update) plugin.update();
        }
    },

    /**
     * Retrieves config option from the loaded config. Will fallback to default.
     * @param {...string} keys the path to the config value, relative to space.
     * @returns {any} the value, will fallback to defaultConfig.
     */
    get: function(...keys) {
        let cfgValue = loopThroughObjByKey(
            config.spaces[currentDesktopWallpaper],
            keys
        );
        if (cfgValue == "KeyNotFoundForSureOhNo") {
            cfgValue = loopThroughObjByKey(config.spaces.default, keys);
            if (cfgValue != "KeyNotFoundForSureOhNo") {
                return cfgValue;
            }

            if (currentDesktopWallpaper in defaultConfig.spaces) {
                return loopThroughObjByKey(
                    defaultConfig.spaces[currentDesktopWallpaper],
                    keys
                );
            } else {
                return loopThroughObjByKey(defaultConfig.spaces.default, keys);
            }
        }
        return cfgValue;
    },

    /**
     * @private
     * Loads plugin config.
     * @param {module} plugin Plugin (require'd) to add the config of.
     */
    addPluginConfig: function(plugin) {
        defaultConfig.spaces.default.plugins[plugin.name] = plugin.config;
    },
});

/*
 * --------------------------------------------------------
 * Everything to do with the DOM.
 * --------------------------------------------------------
 */

// CSS variables
let generalCSSVariables = {};
let pluginCSSVariables = {};

// All the plugin-created attached elements.
let pluginElements = {};

Object.assign(module.exports, {
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
     * @private
     * Injects custom CSS to the application.
     * @param {string} cssToInject
     */
    injectCSS: function(cssToInject) {
        let customCSS = document.createElement("style");
        customCSS.innerHTML = cssToInject;
        document.getElementsByTagName("head")[0].appendChild(customCSS);
    },

    /**
     * @private
     * Change root CSS variables. Adds it to a global store.
     * @param {Object} cssVariables variables to set with CSS.
     */
    addCSSVariables: function(cssVariables) {
        for (let variable in cssVariables) {
            generalCSSVariables[variable] = cssVariables[variable];
        }

        module.exports.injectCSSVariables();
    },

    /**
     * @private
     * Inject CSS attributes to the document.
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
     * Sets the style of an element. First deletes all existing styles.
     * @param {HTMLElement} element
     * @param {obj} style dict with all the CSS styles
     */
    setStyleOfElement: function(element, style) {
        if (typeof style == "string") {
            element.setAttribute("style", style);
            return;
        }
        element.setAttribute("style", ""); // delete existing style
        for (let styleName in style) {
            element.style[styleName] = style[styleName];
        }
    },

    /**
     * Make a DOM element with the specified attributes.
     * @param {str} tag
     * @param {Object} params
     * @returns {Element}
     */
    makeElement: function(tag, attrs) {
        let element = document.createElement(tag);
        for (let key in attrs) {
            if (key == "class") {
                element.classList.add(...attrs[key]);
            } else if (key == "style") {
                module.exports.setStyleOfElement(element, attrs[key]);
            } else {
                element[key] = attrs[key];
            }
        }
        return element;
    },

    /**
     * Makes a div with given classes, and adds it to the global widget.
     * IMPORTANT: only call it once from a plugin!
     * @param {obj} plugin the plugin itself. Should be module.exports.
     * @param {str} side Side: one of {left, center/centre, right}
     * @param {obj} args Args. Will be passed through to makeElement.
     */
    makeAttachedElement: function(plugin, side, args) {
        if (plugin.name in pluginElements) {
            throw `A plugin with the name ${plugin.name} is already loaded.`;
        }

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

        let elementStyle = module.exports.get("plugins", plugin.name, "style");
        args.style =
            elementStyle != "KeyNotFoundForSureOhNo"
                ? elementStyle
                : module.exports.get("style");

        let element = module.exports.makeElement("div", args);
        global.widgets[side + "Bar"].appendChild(element);
        pluginElements[plugin.name] = element;
        return element;
    },
});

// so utils can log.
const log = new module.exports.log("utils");
