# sleep

![screenshot](https://cloud.githubusercontent.com/assets/1661310/6768116/df5ce18e-d02e-11e4-9332-99717bd20294.png)

A little node-webkit / nw.js application that attempts to answer the infamous question of "Whoa... when did I fall asleep?" by telling you when you last closed your Macbook lid or when your Mac last fell asleep after being idle for a while.  

Actually, I lied.  It's not that little.  Because it relies on the nw.js runtime, it's like 98MB.  Sigh.

# Getting started

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