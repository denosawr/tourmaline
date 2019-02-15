// swift-tools-version:4.0

import PackageDescription

let package = Package(
    name: "tourmaline-helper",
    dependencies: [
        // Dependencies declare other packages that this package depends on.
        .package(url: "https://github.com/socketio/socket.io-client-swift", .upToNextMinor(from: "13.0.0"))
        // Can't use latest version, as it requires swift-tools-version 4.2 which I don't have
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages which this package depends on.
        .target(
            name: "tourmaline-helper",
            dependencies: ["SocketIO"]),
    ]
)
