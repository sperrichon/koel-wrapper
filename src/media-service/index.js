
const {EventEmitter} = require('events');

const state = {};
const ee = new EventEmitter();

const touchBar = require('./touch-bar');
const globalShortcuts = require('./global-shortcuts');
const darwinMediaService = require('./darwin-media-service');
const discordPresenceService = require('./discord-presence-service');

function normalizeState(s) {
	const o = {};
	['playing', 'addedToFavorites', 'playMode']
	.forEach(k => {
		if (typeof (s[k]) !== 'undefined') {
			o[k] = Boolean(s[k]);
		}
	});
	if (typeof (s.playMode) !== 'undefined') {
		o.playMode = parseInt(s.playMode, 10);
		if (isNaN(o.playMode) || o.playMode > 2 || o.playMode < 0) {
			o.playMode = 0;
		}
	}
	if (typeof (s.volume) !== 'undefined') {
		o.volume = parseInt(s.volume, 10);
		if (isNaN(o.volume) || o.volume > 100 || o.playMode < 0) {
			o.volume = 0;
		}
	}
	if (typeof (s.duration) !== 'undefined') {
		o.duration = parseInt(s.duration, 10);
		if (isNaN(o.duration) || o.duration < 0) {
			o.duration = 0;
		}
	}

	if (typeof (s.timeElapsed) !== 'undefined') {
		if (typeof (s.timeElapsed) === 'object') {
			o.timeElapsed = s.timeElapsed;
			['elapsed', 'time'].forEach(k => {
				o.timeElapsed[k] = parseInt(o.timeElapsed[k], 10);
				if (isNaN(o.timeElapsed[k]) || o.timeElapsed[k] < 0) {
					o.timeElapsed[k] = 0;
				}
			});
		} else {
			o.timeElapsed = {elapsed: 0, time: 0};
		}
	}

	['title', 'artist', 'albumArt', 'album']
	.forEach(k => {
		if (typeof (s[k]) !== 'undefined') {
			if (typeof (s[k]) === 'string') {
				o[k] = s[k];
			} else {
				o[k] = '';
			}
		}
	});

	return o;
}

const mutators = {
	playing: [touchBar.mutators.updatePlayPauseButton, darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity],
	addedToFavorites: [touchBar.mutators.updateAddToFavoritesButton],
	playMode: [touchBar.mutators.updatePlayModeButton],
	volume: [touchBar.mutators.updateVolumeSlider],
	title: [darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity],
	artist: [darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity],
	album: [darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity],
	albumArt: [darwinMediaService.mutators.updateMetaData],
	timeElapsed: [darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity],
	duration: [darwinMediaService.mutators.updateMetaData, discordPresenceService.mutators.setActivity]
};

function updateState(newState) {
	if (typeof (newState) !== 'object') {
		throw new TypeError('newState is not a valid object');
	}
	newState = normalizeState(newState);

	const mutations = new Set();
	for (const i in newState) {
		if (newState[i] !== state[i]) {
			state[i] = newState[i];
			mutators[i].forEach(mutation => mutations.add(mutation));
		}
	}
	mutations.forEach(mutation => mutation(state));
}

['playPause', 'next', 'prev'].forEach(event => {
	darwinMediaService.on(event, () => ee.emit(event));
	touchBar.on(event, () => ee.emit(event));
});
darwinMediaService.on('seek', to => {
	if (state.duration > 0) {
		ee.emit('seek', to / state.duration * 100);
	}
});
touchBar.on('favorite', () => ee.emit('favorite'));
touchBar.on('playMode', () => ee.emit('playMode'));
touchBar.on('volume', v => ee.emit('volume', v));

updateState({
	playing: false,
	addedToFavorites: false,
	playMode: 0,
	volume: 100,
	duration: 0,
	timeElapsed: {elapsed: 0, time: 0},
	title: '',
	artist: '',
	album: '',
	albumArt: ''
});

module.exports = Object.assign(ee, {
	updateState,
	electronTouchBar: touchBar.electronTouchBar,
	shortcuts: globalShortcuts.actions,
	darwinMedia: darwinMediaService.actions,
	discordPresence: discordPresenceService.actions
});
