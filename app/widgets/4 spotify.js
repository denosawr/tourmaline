const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const NAME = "Spotify";
const FORMAT = `♫&nbsp&nbsp{}`;

const log = new utils.log(NAME);

let hidden = false;

function update() {
    let process = cp.spawn(
        "osascript",
        [utils.locateFile("scripts/spotify.scpt")],
        { shell: true }
    );

    process.stdout.on("data", data => {
        data = data.toString().trim();
        hidden = data == "hide";
        global.widgets[NAME].style.display = hidden ? "none" : "block";

        global.widgets[NAME].innerHTML = FORMAT.replace("{}", data);
    });

    process.on("close", () => {
        setTimeout(update, utils.get("plugins", NAME, "refreshRate"));
    });

    utils.errorHandler(process, NAME);
}

module.exports = {
    name: NAME,

    description: "Spotify status.",

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

    update() {
        global.widgets[NAME].style.display = hidden ? "none" : "block";
    },
};
