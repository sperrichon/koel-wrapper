const path = require('path');
const {ipcRenderer, remote: {BrowserWindow}} = require('electron');
const logger = require('electron-timber');

function _withEl(selector, fn) {
	const el = document.querySelector(selector);
	if (el) {
		fn(el);
		return true;
	}

	return false;
}

function dispatchEvent(el, type) {
	const ev = new Event(type);
	ev.__generated = true;
	el.dispatchEvent(ev);
}

function next() {
	_withEl('#playerControls > i.next.control', el => el.click());
}

function prev() {
	_withEl('#playerControls > i.prev.control', el => el.click());
}

function play() {
	_withEl('#playerControls > span.play.control', el => el.click());
}

function pause() {
	_withEl('#playerControls > span.pause.control', el => el.click());
}

function playPause() {
	play();
	pause();
}

function playMode() {
	_withEl('#mainFooter > div.media-info-wrap > div.other-controls > div > span.repeat.control', el => el.click());
}

function favorite() {
	_withEl('#mainFooter > div.media-info-wrap > div.other-controls > div > i.like.control.fa.fa-heart', el => el.click());
}

function seek(percent) {
	_withEl(
		'#progressPane > div.plyr > div.plyr__controls > div.plyr__progress > input.plyr__progress--seek',
		el => {
			el.value = percent;
			dispatchEvent(el, 'input');
		}
	);
}

function volume(percent) {
	_withEl(
		'#volumeRange',
		el => {
			el.value = percent / 10;
			dispatchEvent(el, 'input');
		}
	);
}

function stop() {
	pause();
	seek(0);
}

function openRemote(alwaysOnTop) {
	if (!window.BASE_URL) {
		return;
	}

	const browserWindow = new BrowserWindow({
		width: 300,
		height: 450,
		minWidth: 50,
		minHeight: 50,
		darkTheme: true,
		backgroundColor: '#181818',
		titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, '../remote/preload.js')
		},
		alwaysOnTop: Boolean(alwaysOnTop)
	});
	browserWindow.loadURL(window.BASE_URL + 'remote');
}

const actions = {
	next, prev, play, pause, playPause, playMode, seek, stop, volume, favorite, openRemote
};

let isReady = false;
let onReadyActions = [];

function handleAction(obj) {
	if (obj.type && actions[obj.type]) {
		if (obj.args) {
			if (Array.isArray(obj.args)) {
				actions[obj.type].apply(actions[obj.type], obj.args);
			} else {
				actions[obj.type].call(actions[obj.type], obj.args);
			}
		} else {
			actions[obj.type].call(actions[obj.type]);
		}
	}
}

ipcRenderer.on('action', (event, obj) => {
	logger.log('[actions]', 'from-main', obj, {isReady});

	if (isReady) {
		handleAction(obj);
	} else {
		onReadyActions.push(obj);
	}
});

function ready() {
	if (!isReady) {
		logger.log('[actions]', 'ready');

		isReady = true;
		const readyActions = onReadyActions;
		onReadyActions = [];
		readyActions.forEach(handleAction);
	}
}

module.exports = {
	actions,
	ready
};
