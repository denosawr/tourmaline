const path = require("path");
const cp = require("child_process");

// tourmaline-specific modules
const utils = require(Object.keys(require.cache).filter(f =>
    f.endsWith("app/js/utils.js")
)[0]);

const NAME = "memoryusage";
const FORMAT = `<i class="fas fa-memory"></i>&nbsp&nbsp{}GB`;

const SCRIPT = String.raw`
#!/bin/bash

FREE_BLOCKS=$(vm_stat | grep free | awk '{ print $3 }' | sed 's/\.//')
INACTIVE_BLOCKS=$(vm_stat | grep inactive | awk '{ print $3 }' | sed 's/\.//')
SPECULATIVE_BLOCKS=$(vm_stat | grep speculative | awk '{ print $3 }' | sed 's/\.//')

TOTAL_MEMSIZE=$(($(sysctl -a | sed 's/hw.memsize: \([0-9]*\)/\1/; s/^[a-zA-Z].*//g' | tr -d "\n")/1048576))

FREE=$((($FREE_BLOCKS+SPECULATIVE_BLOCKS)*4096/1048576))
INACTIVE=$(($INACTIVE_BLOCKS*4096/1048576))
TOTAL=$((($FREE+$INACTIVE)))
# not required
# echo Free:       $FREE MB
# echo Inactive:   $INACTIVE MB
# echo Total free: $TOTAL MB

# just output the total used mem in GB
echo "$(($TOTAL_MEMSIZE-$TOTAL))/1024" | bc -l
`;

const log = new utils.log(NAME);

function update() {
    let process = cp.spawn("sh", [], {
        shell: true,
    });
    process.stdin.end(SCRIPT);

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
