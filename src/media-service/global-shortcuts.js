const {globalShortcut} = require('electron');

const {EventEmitter} = require('events');

const ee = new EventEmitter();

const SHORTCUTS = {
	MediaNextTrack: 'next',
	MediaPreviousTrack: 'previous',
	MediaStop: 'stop',
	MediaPlayPause: 'playPause'
};

const globalShortcutEnabled = process.platform !== 'darwin';

module.exports = {
	actions: {
		register() {
			if (globalShortcutEnabled) {
				Object.keys(SHORTCUTS).forEach(k => {
					globalShortcut.register(k, () => {
						ee.send('action', {type: SHORTCUTS[k]});
					});
				});
			}
		},
		unregister() {
			if (globalShortcutEnabled) {
				Object.keys(SHORTCUTS).forEach(k => {
					globalShortcut.unregister(k);
				});
			}
		}
	}
};
