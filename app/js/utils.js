const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const { ipcRenderer } = require("electron");
const stripJsonComments = require("strip-json-comments");

const CONFIG_PATH = path.join(process.env.HOME, ".config/tourmaline.json");

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
    log: function(moduleName) {
        function outputString(args) {
            return "%c" + moduleName + ":";
        }

        this.debug = (...args) => {
            console.debug(outputString(args), "background: #CCC", ...args);
        };
        this.log = (...args) => {
            console.log(outputString(args), "background: #CCC", ...args);
        };
        this.info = (...args) => {
            console.info(outputString(args), "background: #00B600", ...args);
        };
        this.warn = (...args) => {
            console.warn(
                outputString(args),
                "color: black, background: #FBCEB1",
                ...args
            );
        };
        this.error = (...args) => {
            console.error(
                outputString(args),
                "color: gray, background: #DC143C",
                ...args
            );
        };
    },

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

    updateCurrentSpace(desktopWallpaper) {
        if (!(desktopWallpaper in config.spaces)) {
            // There is no entry for this wallpaper, revert to default
            desktopWallpaper = "default";
        }

        let configVariables = recurseThroughDict(
            config.spaces[desktopWallpaper]
        );
        configVariables = Object.keys(configVariables)
            .filter(key => !key.startsWith("spaces-"))
            .reduce((obj, key) => {
                obj["cfg-" + key] = configVariables[key];
                return obj;
            }, {});

        log.log(configVariables);
    },

    get: function(path, default_) {
        let o = config;
        for (let name of path) {
            o = config[name];
            if (!o) {
                return default_;
            }
        }
        return o;
    },

    createHelper: function(name, handler, args) {
        let processValue = ipcRenderer.sendSync("create-helper-process", [
            name,
            args,
        ]);
        processHandlers[processValue] = handler;
        log.log(processValue, name);

        return processValue;
    },

    killHelper: function(processValue) {
        ipcRenderer.send("kill-helper-process", processValue);
        delete processHandlers[processValue];
    },

    pathToHelper: function() {
        return "/Users/denosawr/Documents/Programming/tourmaline/app/tourmaline-helper/tourmaline-helper-app";
        const productionAppPath = path.join(
            __dirname,
            "../tourmaline-helper/tourmaline-helper-app"
        );
        const productionBinPath = path.join(
            process.cwd(),
            "../Frameworks/tourmaline-helper-app"
        );
        return fs.existsSync(productionAppPath)
            ? productionAppPath
            : productionBinPath;
    },

    startHelperHooks: function() {
        ipcRenderer.on("helper-process-message", (event, arg) => {
            let processValue = arg[0],
                data = arg[1];
            processHandlers[processValue](data);
        });

        ipcRenderer.on("helper-process-exit", (event, arg) => {
            delete processHandlers[arg];
            // delete the handler, because the process is now dead
        });
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

    addPluginConfig: function() {},

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
     * Get height of macOS default menu bar.
     * Just a constant; I think the menu bar height is constant.
     * @returns {number}
     */
    menuBarHeight: function() {
        return 22;
        /*
        const application = $.NSApplication("sharedApplication");
        return application("mainMenu")("menuBarHeight");
        */
    },
};

const log = new module.exports.log("utils");
