const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const NAME = "diskusage";
const COMMAND = 'df -h | grep -m 1 "/" | awk -F" " \'{print $3+0}\'';
const FORMAT = `<i class="fas fa-hdd"></i>&nbsp&nbsp{}GB`;

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

    description: "Shows disk usage in leftbar",

    config: {
        refreshRate: 2000,
    },

    init: function(emitter) {
        global.widgets[NAME] = utils.makeAttachedElement("left");
        update();
    },
};
