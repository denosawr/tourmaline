#!/bin/sh

if [ ! -f tourmaline-helper/space-number-app ]; then
    printf "\e[31mThere is no space-number executable! Please build it yourself (\e[37mtourmaline-helper/space-number\e[31m) and then move the compiled binary to \e[37mtourmaline-helper/space-number-app\e[31m.\e[90m\n"
    exit
fi

printf "\e[36mPackaging Electron app...\e[90m\n"

# electron-packager - build Electron app to build/
node_modules/.bin/electron-packager . tourmaline --ignore='tourmaline-helper|build'  --platform=darwin --overwrite

# move app bundle and clean up (we don't care about license and stuff)
echo Post-packaging work
rm -r build/tourmaline.app
mv tourmaline-darwin-x64/tourmaline.app build/tourmaline.app
rm -r tourmaline-darwin-x64

# make diskusage work - copy over build folder
cp -r node_modules/diskusage/build build/tourmaline.app/Contents/Resources/app/node_modules/diskusage/build

printf "\e[36mCompiling Tourmaline Helper app...\e[90m\n"
# compile tourmaline-helper
cd tourmaline-helper
./package.sh

# move tourmaline-helper to main app

echo Post-building helper work
cd ../
cp -r tourmaline-helper/tourmaline-helper.app build/tourmaline.app/Contents/Frameworks/tourmaline-helper.app
cp tourmaline-helper/space-number-app build/tourmaline.app/Contents/Frameworks/space-number-app

# cp app/tourmaline-helper/tourmaline-helper-app tourmaline-darwin-x64/tourmaline.app/Contents/Frameworks/tourmaline-helper-app

printf "\e[95mDone! File in build/tourmaline.app.\n"
printf "\e[90mHope you're having a lovely day there! Thanks for checking my app out <3 \e[0m\n"
