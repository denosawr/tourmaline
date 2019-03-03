const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const log = new utils.log("systeminfo");

module.exports = {
    // Name. Is used for the config setting
    name: "leftbar",

    // Description. Not used, but nice to have.
    description: "Leftbar items, to be shown on *no* hover.",

    // The default config. This must feature all available config settings.
    config: {},

    /// To be run after menubar has loaded.
    init: function() {
        global.widgets.leftBar = utils.makeElement("div", {
            class: ["container", "itemDeactivated"],
            id: "leftBar",
        });

        module.exports.positionBar();
        global.widgets.menuBar.appendChild(global.widgets.leftBar);
    },

    /// To be run when the menubar items have changed.
    positionBar: function() {
        let r = global.widgets.localizedNameHolder.getBoundingClientRect()
            .right;
        global.widgets.leftBar.setAttribute("style", `left: calc(${r}px);`);
    },

    style: `
        #leftBar {
            position: absolute;
            z-index: 100;
            /* color: rgba(255, 255, 255, 0.7); */
        }

        .leftBarItem {
            padding-left: 9.5px;
            padding-right: 9.5px;
            transition: margin-top 0.15s;
        }

        #leftBar.itemActivated {
            margin-top: 22px;
        }

        #leftBar.itemDeactivated {
            transition: margin-top 0.15s;
            margin-top: 0px;
        }
    `,
};
