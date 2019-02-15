# Tourmaline

A better menu bar for macOS.

**Tourmaline** aims at making a beautiful, fluid and useful menu bar for macOS. Extensible and customisable, Tourmaline offers different themes based on wallpaper, as well as the ability to add custom widgets.

Please report bugs or issues by creating an issue ticket on GitHub. Make sure you include reproduction steps, as well as basic system information (macOS version, specs, etc.) Please don't abuse the GitHub issue tracker and ask for basic support - bugs and issues only please!

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
    -   `yarn format` formats the entire directory with `prettier`
    -   `yarn rebuild` rebuilds all modules for the Electron version with `electron-packager`

## Limitations

-   Tourmaline requires the macOS menu bar / system theme to be set to dark. When the system is in light mode, there is a drop shadow behind the menubar, which bleeds onto the wallpaper.
-   (not really a limitation but) Tourmaline uses Electron behind the hood. Electron is notorious for using large amounts of memory and CPU _cough_ Slack _cough_. However, Electron is one of the easiest ways to make Tourmaline as extensible as it is (and JS is a language I'm more familiar in).
