swift build -c release -Xswiftc -suppress-warnings

/bin/cp -f .build/release/tourmaline-helper tourmaline-helper.app/Contents/macOS/tourmaline-helper
