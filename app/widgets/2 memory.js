const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const NAME = "memoryusage";
const COMMAND = "sh scripts/mem.sh";
const FORMAT = `<i class="fas fa-memory"></i>&nbsp&nbsp{}GB`;

const log = new utils.log(NAME);

function update() {
    let process = cp.spawn(COMMAND, [], { shell: true });

    process.stdout.on("data", data => {
        data = parseFloat(data.toString()).toFixed(1);

        global.widgets[NAME].innerHTML = FORMAT.replace("{}", data);
    });

    process.on("close", () => {
        setTimeout(update, utils.get("plugins", NAME, "refreshRate"));
    });

    utils.errorHandler(process, NAME);
}

module.exports = {
    name: NAME,

    description: "Shows used RAM.",

    config: {
        refreshRate: 2000,
    },

    init: function(emitter) {
        global.widgets[NAME] = utils.makeAttachedElement(
            module.exports,
            "left"
        );
        update();
    },
};