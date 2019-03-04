const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(Object.keys(require.cache).filter(f =>
    f.endsWith("app/js/utils.js")
)[0]);

const NAME = "Spotify";
const FORMAT = `♫&nbsp&nbsp{}`;

const SCRIPT = `
if application "Spotify" is running then
	tell application "Spotify"
		if player state is playing then
			set result to (get artist of current track) & " - " & (get name of current track)
		else
			set result to "hide"
		end if
	end tell
else
	set result to "hide"
end if
`;

const log = new utils.log(NAME);

let hidden = false;

function update() {
    let process = cp.spawn("osascript", [], { shell: true });
    process.stdin.end(SCRIPT);

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
