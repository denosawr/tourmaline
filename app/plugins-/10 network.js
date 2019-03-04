const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(Object.keys(require.cache).filter(f =>
    f.endsWith("app/js/utils.js")
)[0]);

const NAME = "networkusage";
const SCRIPT = `
#!/usr/bin/env bash

exists () {
    type "$1" &> /dev/null ;
}

if exists /usr/local/bin/ifstat ; then
    NETWORKUSAGE=$(/usr/local/bin/ifstat -n -z -S 2 1)
	echo "↓ $(echo "$NETWORKUSAGE" | awk 'FNR == 3 {for(x=1;x<=NF;++x)if(x % 2 == 0)sum+=$x} END {print sum}') ↑ $(echo "$NETWORKUSAGE" | awk 'FNR == 3 {for(x=1;x<=NF;++x)if(x % 2 == 1)sum+=$x} END {print sum}')"
else
    echo "Please install ifstat: \`brew install ifstat\`."
fi
`;

const log = new utils.log(NAME);

function update() {
    let process = cp.spawn("sh", [], {
        shell: true,
    });
    process.stdin.end(SCRIPT);

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
