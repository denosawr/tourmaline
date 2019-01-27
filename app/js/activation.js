const bgImage = document.getElementById("bgimage-bar");

let timeouts = [];
let menuBarRightLocation;
let currentStop = 0;

/**
 * Clears existing timeouts from previous animation.
 */
function clearTimeouts() {
    for (let timeout of timeouts) {
        clearTimeout(timeout);
    }
    timeouts = [];
}

/**
 * Sets a timeout to set the maskimage. Occurs after a delay.
 * @param {number} stop
 * @param {boolean} inverted for deactivate
 */
function setMaskTimeout(stop, inverted) {
    let opacity = 1 - stop / 60;
    let stopcount = inverted ? 60 - stop : stop;
    let t = setTimeout(() => {
        bgImage.setAttribute(
            "style",
            `-webkit-mask-image: linear-gradient(to right,` +
                `black ${menuBarRightLocation + 100}px,` +
                `rgba(0, 0, 0, ${opacity}) ${menuBarRightLocation + 200}px);`
        );
        currentStop = stop;
    }, stopcount * 3);
    timeouts.push(t);
}

/**
 * The thing is activated! Someone must have hovered over the bar.
 */
function activate() {
    menuBarRightLocation = Math.max(
        Math.round(
            document.getElementById("macChildMenuBar").getBoundingClientRect()
                .right
        ),
        700
    );
    clearTimeouts();

    for (let i = currentStop; i <= 60; i++) {
        setMaskTimeout(i);
    }
}

/**
 * It's deactivated :(((((
 */
function deactivate() {
    clearTimeouts();

    for (let i = currentStop; i >= 0; i--) {
        setMaskTimeout(i, true);
    }
}

module.exports.init = function(emitter) {
    emitter.on("activate", activate);
    emitter.on("deactivate", deactivate);
};
