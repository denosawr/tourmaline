// swift-tools-version:4.0

import PackageDescription

let package = Package(
    name: "tourmaline-helper",
    dependencies: [
        // Dependencies declare other packages that this package depends on.
        // .package(url: /* package url */, from: "1.0.0"),
        // .package(url: "https://github.com/socketio/socket.io-client-swift", from: "1.0.0")
        .package(url: "https://github.com/socketio/socket.io-client-swift", .upToNextMinor(from: "13.0.0"))
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages which this package depends on.
        .target(
            name: "tourmaline-helper",
            dependencies: ["SocketIO"]),
    ]
)
