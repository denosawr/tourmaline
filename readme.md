# Tourmaline

A better menu bar for macOS.

**Tourmaline** aims at making a beautiful, fluid and useful menu bar for macOS. It was built to be configurable, perfect to complement any setup.

## Why Tourmaline?
There are already many excellent alternatives, most of them being [Übersicht](https://github.com/felixhageloh/uebersicht) widgets. Some standout bars which come to mind are [Pecan](https://github.com/zzzeyez/Pecan) and [Chunkbar](https://github.com/apierz/chunkbar.widget).

However, these all have one fundamental limitation: they're *bars*, not *menubars*. To hide the menubar, you'd use macOS's menu bar autohide functionality. This may be sufficient for most people, especially developers who don't make use of the menubar. However, the (unchangeable) delay on the menubar autohide animation makes work with any menubar-heavy app painstakingly slow.

Tourmaline is an attempt at a cross between the extensible functionality of existing bar programs and the defunct [Flavours 2](http://flavours.interacto.net/), providing a beautiful menubar with the customisability and power of bars and the aesthetic appeal of a custom themed menubar.

## Building / Running

-   **Running**: `yarn start` or `electron .` (after running `yarn install && yarn rebuild`)

    Supports the following arguments:

    -   `--dev` - open the (Electron) Developer Tools on startup automatically.
    -   `--no-launch-helper` - don't launch the Tourmaline Helper application. Useful if you are developing the Helper and don't want it to autoquit on application crash.

-   **Building**: `yarn build` or `./build.sh`

    This will use `electron-packager` and `spm` to build the application into the `build` directory.

-   Other Yarn commands:
    -   `yarn killall` kills all Tourmaline processes
    -   `yarn rundev` runs [Tourmaline.app](http://tourmaline.app) (the packaged application) with `--dev` and `--no-launch-helper`.
    -   `yarn format` formats the entire directory with `prettier`.
    -   `yarn rebuild` rebuilds all modules for the Electron version with `electron-packager`

## Limitations

-   Tourmaline requires the macOS menu bar / system theme to be set to dark. When the system is in light mode, there is a drop shadow behind the menubar, which bleeds onto the wallpaper. (will eventually be fixed later).
-   (not really a limitation but) Tourmaline uses Electron behind the hood. Electron is notorious for using large amounts of memory and CPU _cough_ Slack _cough_. However, Electron is one of the easiest ways to make Tourmaline as extensible as it is (and JS is a language I'm more familiar in).
