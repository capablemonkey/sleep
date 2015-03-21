'use strict';

var async = require('async');
var moment = require('moment');
var exec = require('child_process').exec;
var child;
var util = require('util');

var sleepEvents = [];
var wakeEvents = [];

// gui elements
var gui = require('nw.gui');
var tray;
var trayMenu;
var waitingTrayMenu;
var trayMenuItems = {};

function getSleepEvents(callback) {
	exec('pmset -g log | grep "Entering Sleep"',
	  function (error, stdout, stderr) {
	  	if (stderr) { console.log('stderr' + stderr); }
		  if (error !== null) { console.log('exec error: ' + error); }

		  sleepEvents = parsePMSETOutput(stdout);
		  callback();
	});
}

function getWakeEvents(callback) {
	child = exec('pmset -g log | grep "Wake .* due to"', 
		function(error, stdout, stderr) {
			if (stderr) { console.log('stderr' + stderr); }
		  if (error !== null) { console.log('exec error: ' + error); }

		  wakeEvents = parsePMSETOutput(stdout);
		  callback();
	});
}

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

		trayMenuItems.lastSlept.label = util.format("last slept: %s", lastSlept.timestamp.format('LT'));
		trayMenuItems.lastWoke.label = util.format("awoke: %s", lastWake.timestamp.format('LT'));
		trayMenuItems.duration.label = util.format("slept %s mins.", lastWake.timestamp.diff(lastSlept.timestamp, 'minutes'));
		trayMenuItems.reason.label = reason;

		tray.menu = trayMenu;
	});
}

// TODO: refresh this periodically, make a button to refresh this.

function main() {
	// Set up UI elements
	initTray();
	refreshMenu();

	// refresh every 5 mins
	// TODO: only refresh once we come out of sleep...
	setInterval(refreshMenu, 5 * 60 * 1000);
}

function initTray() {

	// TODO: maybe have a giant display for the time that spans 5 menu items

	tray = new gui.Tray({ icon: 'assets/icon2.png'});

	// init TrayMenu:
	trayMenu = new gui.Menu();
	trayMenuItems.lastSlept = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.lastWoke = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.duration = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.sep1 = new gui.MenuItem({type: 'separator'});
	trayMenuItems.reasonLabel = new gui.MenuItem({type: 'normal', label: 'reason for sleep:', enabled: false})
	trayMenuItems.reason = new gui.MenuItem({ type: 'normal', label: 'ugh', enabled: false });
	trayMenuItems.sep2 = new gui.MenuItem({type: 'separator'});
	trayMenuItems.startup = new gui.MenuItem({type: 'checkbox', label: 'run on startup?'});
	trayMenuItems.about = new gui.MenuItem({type: 'normal', label: 'about'});
	trayMenuItems.about.click = function() {
		// TODO: some popup here
	};
	trayMenuItems.quit = new gui.MenuItem({ type: 'normal', label: 'quit', enabled: true });
	trayMenuItems.quit.click = function() { gui.App.quit(); }

	Object.keys(trayMenuItems).forEach(function(key) {
		trayMenu.append(trayMenuItems[key]);
	});

	// init Waiting Tray menu, which is displayed as we fetch data
	waitingTrayMenu = new gui.Menu();
	waitingTrayMenu.append(new gui.MenuItem({type: 'normal', label: 'fetching...', enabled: false}));
	var quit = new gui.MenuItem({ type: 'normal', label: 'quit', enabled: true });
	quit.click = function() { gui.App.quit(); }
	waitingTrayMenu.append(quit);

	// initial menu is waiting menu:
	tray.menu = waitingTrayMenu;
}

function parsePMSETOutput(stdout) {
	var lineBuffer;
	var timestampBuffer;
	return stdout.split('\n').map(function(line) {
		lineBuffer = line.split('\t');		// TODO: figure out how expensive it is to keep delcaring var for each line
		timestampBuffer = line.split(' ');
		return {
			timestamp: moment(new Date(timestampBuffer.slice(0, 3).join(' '))),
			description: lineBuffer[1],
			timeToSleep: lineBuffer[2]
		};
	});
}

main();

// TODO: figure out how to make this run on login
// TODO: provide a checkbox menuitem to run on login