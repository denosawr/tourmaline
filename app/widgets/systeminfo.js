const cpuStat = require("cpu-stat");
const disk = require("diskusage");
const path = require("path");
const utils = require(path.resolve(__dirname, "../js/utils.js"));

const log = new utils.log("systeminfo");

let infoBar, localizedNameHolder, cpuHolder, memHolder, diskHolder;

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
    setTimeout(
        updateHolders,
        utils.get(["widgetConfigs", "systeminfo", "refreshInterval"], 3000)
    );
}

module.exports.positionBar = function() {
    let r = global.widgets.localizedNameHolder.getBoundingClientRect().right;
    global.widgets.infoBar.setAttribute(
        "style",
        `left: calc(${r}px - var(--left-margin));`
    );
};

module.exports.init = function() {
    // empty, this should be called from windowbar.js
};

module.exports.activateBar = function() {
    global.widgets.infoBar = utils.makeElement("div", {
        class: ["container", "itemDeactivated"],
        id: "macInfoBar",
    });

    global.widgets.diskHolder = utils.makeElement("div", {
        class: ["macInfoBarItem"],
        textContent: "dsk --%",
    });

    global.widgets.cpuHolder = utils.makeElement("div", {
        class: ["macInfoBarItem"],
        textContent: "cpu --%",
    });

    updateHolders();

    global.widgets.infoBar.appendChild(global.widgets.diskHolder);
    global.widgets.infoBar.appendChild(global.widgets.cpuHolder);

    module.exports.positionBar();
    global.widgets.menuBar.appendChild(global.widgets.infoBar);
};

utils.injectCSS(`
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
`);
