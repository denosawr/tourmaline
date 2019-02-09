const fs = require("fs");
const cp = require("child_process");
const { ipcRenderer } = require("electron");

let processHandlers = {};

module.exports = {
    createHelper: function(name, handler, args) {
        let processValue = ipcRenderer.sendSync("create-helper-process", [
            name,
            args,
        ]);
        processHandlers[processValue] = handler;
        console.log(processValue, name);

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
            console.error(`Error in child process ${name}: ${err}`);
        });
        cp.stderr.on("data", data => {
            console.error(
                `stderr in child process ${name}: ${data.toString()}`
            );
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
     * Injects custom CSS to the webpage.
     * @param {string} cssToInject
     */
    injectCSS: function(cssToInject) {
        let customCSS = document.createElement("style");
        customCSS.innerHTML = cssToInject;
        document.getElementsByTagName("head")[0].appendChild(customCSS);
    },

    /**
     * Change root CSS variables.
     * @param {Object} cssVariables variables to set with CSS.
     */
    injectCSSVariables: function(cssVariables) {
        for (let varName in cssVariables) {
            document.documentElement.style.setProperty(
                "--" + varName,
                cssVariables[varName]
            );
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
     * For some weird reason, this function when called from the renderer.
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
