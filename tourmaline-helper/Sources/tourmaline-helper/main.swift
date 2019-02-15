import Cocoa
import SocketIO
import Foundation
import AppKit
import ImageIO

var firstTime: Bool = true
var detectSelectionChange = false
var detectSelectionChangeSetup = false
var screensaver = false

/*
setbuf(__stdoutp, nil)
setbuf(__stderrp, nil)
 */


/// A SocketManager with a custom error action (to output to NSLog).
class Manager: SocketManager {
    override func engineDidError(reason: String) {
        NSLog("Could not connect to main app socket. Is the port being used?")
    }
}

// must go at the top, as variables are not hoisted
let manager = Manager(socketURL: URL(string:"http://localhost:3000")!)
let socket = manager.defaultSocket

extension NSImage {
    func base64String() -> String? {
        guard
            let bits = self.representations.first as? NSBitmapImageRep,
            let data = bits.representation(using: .png, properties: [:])
            else {
                return nil
        }
        
        return "data:image/png;base64,\(data.base64EncodedString())"
    }
}


/**
 Saves the current desktop wallpaper to /tmp/wallpaper.png.
 - returns: name of image file (just suffix e.g. image.png) on success, nil on failure.
 */
func updateWallpaper() -> String? {
    guard let screen = NSScreen.main else {
        NSLog("No active screen. No idea why.")
        return nil
    }
    guard let desktopImageURL = NSWorkspace.shared.desktopImageURL(for: screen) else {
        NSLog("No desktop image.")
        return nil
    }
    let desktopImageName = desktopImageURL.path.components(separatedBy: "/").last!
    
    let windowInfoList = CGWindowListCopyWindowInfo(.optionAll, kCGNullWindowID)!
        as NSArray
    let apps = NSRunningApplication.runningApplications(withBundleIdentifier:
        /* Bundle ID of the application, e.g.: */ "com.apple.dock")
    if apps.isEmpty {
        // Application is not currently running
        print("The application is not running")
        return nil
    }
    let appPID = apps[0].processIdentifier
    
    var appWindowInfo: NSDictionary = NSDictionary()
    for info_ in windowInfoList {
        let info = info_ as! NSDictionary
        if (info[kCGWindowOwnerPID as NSString] as! NSNumber).intValue == appPID {
            if let windowName = info[kCGWindowName as NSString] {
                if (windowName as! String).hasPrefix("Desktop Picture") &&
                    (windowName as! String).hasSuffix(desktopImageName) {
                    appWindowInfo = info
                }
            }
        }
    }
    let windowID: CGWindowID = (appWindowInfo[kCGWindowNumber as NSString] as! NSNumber).uint32Value
    
    guard let windowImageNoColorSpace =
        CGWindowListCreateImage(.infinite, .optionIncludingWindow, windowID,
                                [.boundsIgnoreFraming, .nominalResolution]) else {
        NSLog("Failed to capture image.")
        return nil
    }
    
    guard let windowImageColorSpace = windowImageNoColorSpace.copy(colorSpace: screen.colorSpace!.cgColorSpace!) else {
        NSLog("Could not copy. Rip.")
        return nil
    }
    
    let url: CFURL = NSURL(fileURLWithPath: "/tmp/wallpaper.png")
    guard let destination: CGImageDestination = CGImageDestinationCreateWithURL(url, kUTTypePNG, 1, nil) else {
        NSLog("Failed to create CGImageDestination.")
        return nil
    }
    
    CGImageDestinationAddImage(destination, windowImageColorSpace, nil)
    
    if (!CGImageDestinationFinalize(destination)) {
        NSLog("Failed to write image")
        return nil
    }
    return desktopImageName
}


/**
 Gets the menu bar items of the foreground application.
 - attention: If the function fails for some reason, it returns an empty array.
 - returns: [AXUIElement] - each AXUIElement is a representation of a menu bar item.
 */
func getMenuItems() -> [AXUIElement] {
    // get NSRunningApplication
    guard let application = NSWorkspace.shared.menuBarOwningApplication else {
        return []
    }
    
    let processIdentifier = application.processIdentifier
    if processIdentifier == -1 {
        // Application does not have PID; uhhhh if this happens, you should probably get your computer fixed :P
        NSLog("NSWorkspace.shared.frontmostApplication has no PID.")
        return []
    }
    
    let AXRunningApplication = AXUIElementCreateApplication(application.processIdentifier)
    
    
    // progress down the hierarchy
    var AXMenuReference: AnyObject?
    AXUIElementCopyAttributeValue(AXRunningApplication, "AXMenuBar" as CFString, &AXMenuReference)
    guard let AXMenu = AXMenuReference else {
        // NSLog("AXRunningApplication has no AXMenuBar") // some apps are like this so we don't want spam
        return []
    }
    
    // get children - these are the menu bar items
    var AXMenuItemsReference: AnyObject?
    AXUIElementCopyAttributeValue(AXMenu as! AXUIElement, kAXChildrenAttribute as CFString, &AXMenuItemsReference)
    guard let AXMenuItems = AXMenuItemsReference else {
        NSLog("AXMenuBar has no children (AXMenuItems)")
        return []
    }
    
    return AXMenuItems as! [AXUIElement]
}


/**
 Gets the titles (names/text shown on menubar) of menu bar items.
 - attention: if the function fails for some reason, it returns an empty array.
 - returns: [String] - each String is the name of a menu bar item. Index 0 is the leftmost on the menubar, including
            "Apple" (representing the Apple logo).
 */
func getMenuItemTitles() -> [String] {
    let AXMenuItems = getMenuItems()
    
    if AXMenuItems.isEmpty {
        return []
    }
    
    
    var titles: [String] = []
    for item in AXMenuItems {
        var title: AnyObject?
        AXUIElementCopyAttributeValue(item, "AXTitle" as CFString, &title)
        
        if let title = title {
            titles.append(title as! String)
        }
    }
    
    return titles
}



class AppDelegate: NSObject, NSApplicationDelegate {
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        initObservers()
        
        // required for notif observation
        RunLoop.main.run()
    }
    
    /// Initalises the foreground change and space change observers.
    func initObservers() {
        NSWorkspace.shared.notificationCenter.addObserver(self, selector: #selector(self.appActivated), name:
            NSWorkspace.didActivateApplicationNotification, object: nil);
        NSWorkspace.shared.notificationCenter.addObserver(self, selector: #selector(self.spaceChanged), name:
            NSWorkspace.activeSpaceDidChangeNotification, object: nil);
        
        DistributedNotificationCenter.default().addObserver(self, selector: #selector(self.screenSaverStarted), name:
            NSNotification.Name(rawValue: "com.apple.screensaver.didlaunch"), object: nil);
        DistributedNotificationCenter.default().addObserver(self, selector: #selector(self.screenSaverStopped), name:
            NSNotification.Name(rawValue: "com.apple.screensaver.didstop"), object: nil);
        
    }
    
    @objc func screenSaverStarted(notif: NSNotification!) {
        NSLog("Screensaver true.")
        screensaver = true
    }
    
    @objc func screenSaverStopped(notif: NSNotification!) {
        NSLog("Screensaver false.")
        screensaver = false
    }
    
    /// An observer called when the foreground window is changed.
    @objc func appActivated(notif: NSNotification!) {
        if screensaver {
            return
        }
        
        guard let userInfo = notif.userInfo else {
            return
        }; guard let currentApplicationReference = userInfo["NSWorkspaceApplicationKey"] else {
            return
        }; guard let applicationName = (currentApplicationReference as! NSRunningApplication).localizedName else {
            return
        }
    
        detectSelectionChangeSetup = false
        
        socket.emit("windowChange", ["Apple", applicationName])
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {  // this delay may need to be changed
            let menuBarItems = getMenuItemTitles()
            if !menuBarItems.isEmpty {
                socket.emit("windowChange", menuBarItems)
            }
        }
    }
    
    
    /// An observer called when the active space is changed.
    @objc func spaceChanged(notif: NSNotification!) {
        // To implement: https://github.com/gechr/WhichSpace/blob/master/WhichSpace/Classes/AppDelegate.swift
        
        socket.emit("spaceChange")
        guard let wallpaperName = updateWallpaper() else {
            socket.emit("reloadBackground", "default")
            return
        }
        socket.emit("reloadBackground", wallpaperName)
    }
}


/// Polls for change in selected menu bar item. Change the detectSelectionChangeSetup and detectSelectionChange
/// variables to affect the functionality of this function.
func selectionChangePoller() {
    var AXMenuItems: [AXUIElement] = []
    
    var prevActivatedItemTitle = "////"  // the "////" means nothing was activated
    
    while true {
        if screensaver {
            usleep(100000)  // 100ms
            continue
        }
        if detectSelectionChangeSetup == false {
            AXMenuItems = getMenuItems()
            if AXMenuItems.isEmpty {
                usleep(500000)  // 500ms
                continue
            }
            detectSelectionChangeSetup = true
        }
        
        if detectSelectionChange {
            var activatedItemTitle = "////"
            
            for item in AXMenuItems {
                var selected, title: AnyObject?
                
                AXUIElementCopyAttributeValue(item, "AXSelected" as CFString, &selected)
                
                if selected == nil || (selected as! Int) == 0 {
                    continue
                }
                
                AXUIElementCopyAttributeValue(item, "AXTitle" as CFString, &title)
                if title != nil {
                    activatedItemTitle = title as! String
                }
            }
            if (activatedItemTitle != prevActivatedItemTitle) {
                socket.emit("selectionChange", activatedItemTitle)
                prevActivatedItemTitle = activatedItemTitle
            }
        }
        usleep(50000)
    }
}


// run the selectionChangePoller in the background (GCD)
DispatchQueue.global(qos: .background).async {
    selectionChangePoller()
}


func createSocket() {
    socket.connect()
    // when the socket disconnects. this shouldn't happen; instead, on a disconnection, `shutdown` should first be called.
    socket.on(clientEvent: .disconnect) { (dataArray, ack) in
        NSLog("Disconnected.")
    }
    socket.on("startSelectionListener") { (dataArray, ack) in
        detectSelectionChange = true
        detectSelectionChangeSetup = false
    }
    socket.on("stopSelectionListener") { (dataArray, ack) in
        detectSelectionChange = false
        detectSelectionChangeSetup = false
    }
    socket.on("getWallpaper") { (dataArray, ack) in
        updateWallpaper()
    }
    // shutdown. called on main app exit
    socket.on("shutdown") { (dataArray, ack) in
        NSLog("Shutting down...")
        exit(0)
    }
}


/**
 check if user has enabled the Accessibility API for tourmaline in System Preferences.
 - attention: If the check fails, the application will emit a signal via the socket and then exit.
 */
func checkForPermissions() {
    let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeRetainedValue() as NSString: true]
    if !AXIsProcessTrustedWithOptions(options) {
        NSLog("No accessibility API permissions, exiting")
        socket.emit("no-accessibility")
        exit(0)
    }
}

updateWallpaper()

// create application delegate - required to use notification centre
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate

createSocket()

checkForPermissions()

app.run()
