//
//  main.swift
//  space-number
//
//  Created by Ollie Cheng on 1/3/19.
//  Copyright © 2019 denosawr. All rights reserved.
//

import Foundation


let con = _CGSDefaultConnection()

let info = CGSCopyManagedDisplaySpaces(con) as! [NSDictionary]
let displayInfo = info[0]
let activeSpaceID = (displayInfo["Current Space"]! as! NSDictionary)["ManagedSpaceID"] as! Int
let spaces = displayInfo["Spaces"] as! NSArray
for (index, space) in spaces.enumerated() {
    let spaceID = (space as! NSDictionary)["ManagedSpaceID"] as! Int
    let spaceNumber = index + 1
    if spaceID == activeSpaceID {
        print(spaceNumber)
        exit(0)
    }
}

// default
print(1)
exit(1)
