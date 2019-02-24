const cpuStat = require("cpu-stat");
const disk = require("diskusage");
const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));
const cp = require("child_process");

const log = new utils.log("systeminfo");

function updateHolders() {
    cpuStat.usagePercent((err, percent, _) => {
        if (err) {
            log.error("Error getting CPU usage:", err);
        }
        global.widgets.cpuHolder.textContent = `cpu ${Math.round(percent)}%`;
    }, 3000);
    disk.check("/", (err, info) => {
        if (err) {
            log.error("Error getting disk usage:", err);
        }
        global.widgets.diskHolder.textContent = `dsk ${(
            (info.total - info.free) /
            1073741824
        ).toFixed(1)}GB`;
    });
    // setTimeout(
    //     updateHolders,
    //     utils.get(["widgets", "infobar", "refreshInterval"])
    // );
}

function pluginRefreshHandler(plugin, element) {
    let refreshInterval = plugin.refreshInterval;

    if (plugin.type == "command") {
        let process = cp.spawn(plugin.command, [], { shell: true });

        process.stdout.on("data", data => {
            data = data.toString().trim();

            element.style.display =
                plugin.hideValue && data == plugin.hideValue ? "none" : "block";

            if (plugin.toFixed) {
                // implies data is a number
                data = parseFloat(data).toFixed(plugin.toFixed);
            }
            element.innerHTML = (plugin.formatter
                ? plugin.formatter
                : "{}"
            ).replace("{}", data);
        });
        process.on("close", () => {
            setTimeout(() => {
                pluginRefreshHandler(plugin, element);
            }, refreshInterval);
        });
        process.stderr.on("data", d => {
            log.error(`Error in plugin ${plugin.name}:`, d.toString, plugin);
        });
    } else if (plugin.type == "module") {
    } else {
        // welp, you made a mistake.
        log.error(
            `Error loading plugin ${plugin.name} - invalid plugin type.\n`,
            plugin
        );
    }
}

function createPlugins() {
    let plugins = utils.get("widgets", "infobar", "plugins");

    for (let plugin of plugins) {
        let element = utils.makeElement("div", {
            class: ["macInfoBarItem"],
            innerHTML: "",
        });

        global.widgets.infoBar.appendChild(element);
        log.log(element);

        pluginRefreshHandler(plugin, element);
    }
}

module.exports = {
    // Name. Is used for the config setting
    name: "infobar",

    // Description. Not used, but nice to have.
    description: "Infobar items, to be shown on *no* hover.",

    // The default config. This must feature all available config settings.
    config: {
        plugins: [
            {
                name: "diskusage",
                type: "command",
                formatter: `<i class="fas fa-hdd"></i>
                            &nbsp{}GB`,
                toFixed: 1, // can be ignored if command outputs string, not number
                command: 'df -h | grep -m 1 "/" | awk -F" " \'{print $3+0}\'',
                refreshInterval: 2000,
            },
            {
                name: "memory",
                type: "command",
                formatter: `<i class="fas fa-memory"></i>
                            &nbsp{}GB`,
                toFixed: 1,
                command: "sh scripts/mem.sh", // use `sh` for if script isn't chmod +x
                refreshInterval: 2000,
            },
            {
                name: "processor",
                type: "command",
                formatter: `<i class="fas fa-laptop"></i>
                            &nbsp{}%`,
                toFixed: 1,
                command: "ps -A -o %cpu | awk '{s+=$1} END {print s}'",
                refreshInterval: 2000,
            },
            {
                name: "spotify",
                type: "command",
                hideValue: "hide", // hide the element if the script returns this value
                formatter: "♫&nbsp&nbsp{}",
                command: "osascript scripts/spotify.scpt",
                refreshInterval: 2000,
            },
        ],
    },

    init: function() {
        // empty, this should be called from menubar.js
    },

    /// To be run after menubar has loaded.
    activateBar: function() {
        global.widgets.infoBar = utils.makeElement("div", {
            class: ["container", "itemDeactivated"],
            id: "macInfoBar",
        });

        // global.widgets.diskHolder = utils.makeElement("div", {
        //     class: ["macInfoBarItem"],
        //     textContent: "dsk --%",
        // });

        // global.widgets.cpuHolder = utils.makeElement("div", {
        //     class: ["macInfoBarItem"],
        //     textContent: "cpu --%",
        // });

        //updateHolders();

        // global.widgets.infoBar.appendChild(global.widgets.diskHolder);
        // global.widgets.infoBar.appendChild(global.widgets.cpuHolder);

        module.exports.positionBar();
        global.widgets.menuBar.appendChild(global.widgets.infoBar);

        createPlugins();
    },

    /// To be run when the menubar items have changed.
    positionBar: function() {
        let r = global.widgets.localizedNameHolder.getBoundingClientRect()
            .right;
        global.widgets.infoBar.setAttribute(
            "style",
            `left: calc(${r}px - var(--left-margin));`
        );
    },

    /// CSS to inject.
    style: `
        #macInfoBar {
            position: absolute;
            z-index: 100;
            opacity: 0.7;
        }

        .macInfoBarItem {
            padding-left: 9.5px;
            padding-right: 9.5px;
            transition: margin-top 0.15s;
        }

        #macInfoBar.itemActivated {
            margin-top: 22px;
        }

        #macInfoBar.itemDeactivated {
            transition: margin-top 0.15s;
            margin-top: 0px;
        }
        `,
};
