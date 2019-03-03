const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const NAME = "networkusage";

const log = new utils.log(NAME);

function update() {
    let process = cp.spawn("sh", [utils.locateFile("scripts/network.sh")], {
        shell: true,
    });

    process.stdout.on("data", data => {
        data = data.toString();

        global.widgets[NAME].textContent = data;
    });

    process.on("close", () => {
        setTimeout(update, utils.get("plugins", NAME, "refreshRate"));
    });

    utils.errorHandler(process, NAME);
}

module.exports = {
    name: NAME,

    description: "Shows network usage.",

    config: {
        refreshRate: 0,
    },

    init: function(emitter) {
        global.widgets[NAME] = utils.makeAttachedElement(
            module.exports,
            "right",
            {
                textContent: "↓ -- ↑ --",
            }
        );
        update();
    },
};
