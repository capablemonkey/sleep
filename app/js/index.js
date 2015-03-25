'use strict';

var async = require('async');
var moment = require('moment');
var exec = require('child_process').exec;
var util = require('util');

var sleepEvents = [];
var wakeEvents = [];

// gui elements
var gui = require('nw.gui');
var tray;
var trayMenu;
var waitingTrayMenu;
var trayMenuItems = {};

function main() {
	// Set up UI elements
	initTray();
	refreshMenu();

	// refresh every 5 mins
	// TODO: only refresh once we come out of sleep...
	setInterval(refreshMenu, 5 * 60 * 1000);
}

// TODO: try instead: defaults write loginwindow AutoLaunchedApplicationDictionary -array-add '{Path="/Applications/sleep.app";}'

function setWaitingMenu(callback) {
	tray.menu = waitingTrayMenu;
	callback();
}

function refreshMenu() {
	// once data is collected, populate the main window with results:
	async.parallel([setWaitingMenu, getSleepEvents, getWakeEvents], function() {
		// get rid of last event, which is always invalid:
		sleepEvents.pop();
		wakeEvents.pop();

		// 'Maintenance Sleep' events are useless... get rid of them:
		sleepEvents = sleepEvents.filter(function(k) {
			if (/Maintenance/.test(k.description)) { return false; }
			return true;
		});
		
		var lastSlept = sleepEvents[sleepEvents.length - 1];
		var lastWake = wakeEvents[wakeEvents.length - 1];

		/*
			reasons:

			Entering Sleep state due to 'Software Sleep pid=68': Using AC (Charge:100%)
		*/

		// figure out reason for sleep:

		var reasons = {
			'you closed the lid': /Clamshell Sleep/,
			'your Mac was idle for a while': /Idle Sleep/,
			'you made it sleep': /Software Sleep/
		};

		var reason = "uh, cause it was tired?";

		Object.keys(reasons).forEach(function(r) {
			if (reasons[r].test(lastSlept.description)) {
				reason = r;
			}
		});	

		trayMenuItems.lastSlept.label = util.format("fell asleep: %s", lastSlept.timestamp.format('LT'));
		trayMenuItems.lastWoke.label = util.format("awoke: %s", lastWake.timestamp.format('LT'));
		trayMenuItems.duration.label = util.format("slept %s mins.", lastWake.timestamp.diff(lastSlept.timestamp, 'minutes'));
		trayMenuItems.reason.label = reason;

		tray.menu = trayMenu;
	});
}

// initializes main UI
function initTray() {
	// TODO: maybe have a giant display for the time that spans 5 menu items; make the time more prominent

	// add tray icon to statusbar:
	tray = new gui.Tray({ icon: 'assets/icon2.png'});

	/*
	 *	create the main tray menu and its items
	 */

	trayMenu = new gui.Menu();
	trayMenuItems.lastSlept = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.lastWoke = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.duration = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.sep1 = new gui.MenuItem({type: 'separator'});
	trayMenuItems.reasonLabel = new gui.MenuItem({type: 'normal', label: 'reason for sleep:', enabled: false});
	trayMenuItems.reason = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.sep2 = new gui.MenuItem({type: 'separator'});
	trayMenuItems.startup = new gui.MenuItem({type: 'checkbox', label: 'run on login?', checked: false});
	trayMenuItems.refresh = new gui.MenuItem({type: 'normal', label: 'refresh'});
	trayMenuItems.about = new gui.MenuItem({type: 'normal', label: 'about'});
	trayMenuItems.quit = new gui.MenuItem({ type: 'normal', label: 'quit', enabled: true });
	
	/*
	 *	Logic + Event handling for MenuItems
	 */

	trayMenuItems.about.click = function() {
		var win = gui.Window.get();
		win.show();
		win.focus();
	};
	
	trayMenuItems.quit.click = function() { gui.App.quit(); }

	// check if runonlogin enabled set startup checkbox:
	checkIfRunOnLoginEnabled(function(err, enabled) {
		if (err) { console.error('exec error, ', err); }
		trayMenuItems.startup.checked = enabled; 
	});

	trayMenuItems.startup.click = function() {
		// TODO: tell user to move the app to /Applications if they want it to run on login
		// or, modify the plist file to point to the pwd
		checkIfRunOnLoginEnabled(function(error, enabled) {
			if (enabled) {
				disableRunOnLogin(function(err) {
					if (err === null) { trayMenuItems.startup.checked = false; }
				});
			} else {
				enableRunOnLogin(function(err) {
					if (err === null) { trayMenuItems.startup.checked = true; }
				});
			}
		});
	};

	trayMenuItems.refresh.click = function() { refreshMenu(); }

	// add all MenuItems to the trayMenu
	Object.keys(trayMenuItems).forEach(function(key) {
		trayMenu.append(trayMenuItems[key]);
	});

	/*
	 *	Create Waiting Tray menu, which is displayed as we fetch data
	 */

	waitingTrayMenu = new gui.Menu();
	waitingTrayMenu.append(new gui.MenuItem({type: 'normal', label: 'fetching...', enabled: false}));
	
	var quit = new gui.MenuItem({ type: 'normal', label: 'quit', enabled: true });
	quit.click = function() { gui.App.quit(); }
	waitingTrayMenu.append(quit);

	// initial menu is waiting menu:
	tray.menu = waitingTrayMenu;
}

/*
 * pmset methods; used to fetch sleep data
 */

// TODO: wrap exec call to reduce code re-use involved with handling stderr, etc

function getSleepEvents(callback) {
	exec('pmset -g log | grep "Entering Sleep"',
	  function (error, stdout, stderr) {
	  	if (stderr) { console.error('stderr' + stderr); }
		  if (error !== null) { console.error('exec error: ' + error); }

		  sleepEvents = parsePMSETOutput(stdout);
		  callback();
	});
}

function getWakeEvents(callback) {
	exec('pmset -g log | grep "Wake .* due to"', 
		function(error, stdout, stderr) {
			if (stderr) { console.error('stderr' + stderr); }
		  if (error !== null) { console.error('exec error: ' + error); }

		  wakeEvents = parsePMSETOutput(stdout);
		  callback();
	});
}

// utility function used to parse output from pmset
function parsePMSETOutput(stdout) {
	var lineBuffer;
	var timestampBuffer;
	return stdout.split('\n').map(function(line) {
		lineBuffer = line.split('\t');	
		timestampBuffer = line.split(' ');
		return {
			timestamp: moment(new Date(timestampBuffer.slice(0, 3).join(' '))),
			description: lineBuffer[1],
			timeToSleep: lineBuffer[2]
		};
	});
}

/*
 * Launch at login logic:
 */

function checkIfRunOnLoginEnabled(callback) {
	// launchctl list | grep com.capablemonkey.sleepApp
	exec('launchctl list | grep com.capablemonkey.sleepApp', 
		function(error, stdout, stderr) {
			if (stderr) { callback(stderr); }
		  if (error !== null) { 
		  	// if grep returns return code 1, our launchd job is unloaded
		  	if (error.code === 1) { return callback(null, false); } 	
		  	else { return callback(error); }
		  }

		  // if stdout not empty, launchd job is loaded; else it's unloaded
		  return callback(null, stdout.length !== 0); 
		}
	);
}

function enableRunOnLogin(callback) {
	// cp com.capablemonkey.sleepApp.plist ~/Library/LaunchAgents/
	// launchctl load ~/Library/LaunchAgents/com.capablemonkey.sleepApp.plist
	async.waterfall([
		function(callback) {
			exec('cp ./com.capablemonkey.sleepApp.plist ~/Library/LaunchAgents/', 
				function(error, stdout, stderr) {
					if (stderr) { callback(stderr); }
				  if (error !== null) { callback(error); }

				  return callback(null); 
				}
			);
		},
		function(callback) {
			exec('launchctl load ~/Library/LaunchAgents/com.capablemonkey.sleepApp.plist', 
				function(error, stdout, stderr) {
					if (stderr) { callback(stderr); }
				  if (error !== null) { callback(error); }

				  return callback(null); 
				}
			);
		}

	], function(err, result) {
		if (err) {
			console.error("Exec error", err);
			return callback(err);
		}

		return callback(null);
	});
}

function disableRunOnLogin(callback) {
	// launchctl unload ~/Library/LaunchAgents/com.capablemonkey.sleepApp
	exec('launchctl unload ~/Library/LaunchAgents/com.capablemonkey.sleepApp.plist', 
		function(error, stdout, stderr) {
			if (stderr) { callback(stderr); }
		  if (error !== null) { callback(error); }

		  // if stdout empty, successfully unloaded
		  return callback(stdout.length === 0 ? null : true); 
		}
	);
}

// used by about page to close/hide itself:
function hideWindow() {
	var win = gui.Window.get();
	win.hide();
}

main();
