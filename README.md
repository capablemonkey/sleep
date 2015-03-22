# sleep

Attempts to answer the infamous question of "Whoa... when did I fall asleep?" by telling you when you last closed your Macbook lid or when your Mac last fell asleep after being idle for a while.

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