const path = require("path");

// tourmaline-specific modules
const utils = require(Object.keys(require.cache).filter(f =>
    f.endsWith("app/js/utils.js")
)[0]);

const NAME = "Spacer";

module.exports = {
    name: NAME,

    description: "Spacer.",

    config: {},

    init: function(emitter) {
        global.widgets[NAME] = utils.makeAttachedElement(
            module.exports,
            "right",
            {
                style: { "padding-right": "10px", "padding-left": "10px" },
            }
        );
    },
};
