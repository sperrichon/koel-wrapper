const {globalShortcut} = require('electron');

const {EventEmitter} = require('events');

const ee = new EventEmitter();

const SHORTCUTS = {
	MediaNextTrack: 'next',
	MediaPreviousTrack: 'previous',
	MediaStop: 'stop',
	MediaPlayPause: 'playPause'
};

module.exports = {
	actions: {
		register() {
			Object.keys(SHORTCUTS).forEach(k => {
				globalShortcut.register(k, () => {
					ee.send('action', {type: SHORTCUTS[k]});
				});
			});
		},
		unregister() {
			Object.keys(SHORTCUTS).forEach(k => {
				globalShortcut.unregister(k);
			});
		}
	}
};
