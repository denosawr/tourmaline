const path = require("path");

// tourmaline-specific modules
const utils = require(path.resolve(__dirname, "../js/utils.js"));

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
