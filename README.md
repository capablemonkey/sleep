# sleep

[![Join the chat at https://gitter.im/capablemonkey/sleep](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/capablemonkey/sleep?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![screenshot](https://cloud.githubusercontent.com/assets/1661310/6768116/df5ce18e-d02e-11e4-9332-99717bd20294.png)

A little node-webkit / nw.js application that attempts to answer the infamous question of "Whoa... when did I fall asleep?" by telling you when you last closed your Macbook lid or when your Mac last fell asleep after being idle for a while.  

Actually, I lied.  It's not that little.  Because it relies on the nw.js runtime, it's like 98MB.  Sigh.

Sleep has its own [project page](http://capablemonkey.github.io/sleep/)!

# Download it

[Download the Mac OS X DMG](https://github.com/capablemonkey/sleep/raw/build/webkitbuilds/sleep.dmg).  Only available for 64-bit Macs.

# Playing with the source

### Installing dependencies
You'll need to make sure you have nw.js installed.

`npm install nw -g`

The actual nw.js / node-webkit app is located in the `/app` directory.  The root directory encapsulates the `/app` directory to provide build tools to actually compile the app.  

You'll want to make sure you do `npm install` in both the root directory and the `/app` directory.

### Running
From the root directory:

`nw app`

### Building
To build, do from the *root* directory of the repo:

`grunt nodewebkit`

It'll build sleep.app, targeting OS X 32-bit and 64-bit.  You'll find the resulting .app files in `/webkitbuilds/sleep/`.

#### Building the DMG
Once the app's been packaged, we'll want to build the DMG.  Make sure you have `appdmg` installed:

`npm install -g appdmg`

Then, do:

`appdmg dmgConfig.json webkitbuilds/sleep.dmg`

And your DMG will end up in webkitbuilds/.  In the future, consider adding this as a grunt task in the gruntfile.

## todo

- create dmg to prompt user to drag .app to applications.