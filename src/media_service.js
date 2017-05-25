const {TouchBar, NativeImage} = require('electron');
const MediaService = require('electron-media-service');
const {EventEmitter} = require('events');
const {TouchBarButton, TouchBarSpacer, TouchBarGroup, TouchBarSlider} = TouchBar;
const crypto = require('crypto');

const SELECTED_BUTTON_COLOR = '#767676';
const NORMAL_BUTTON_COLOR = '#373737';
const REPEAT_LABEL = '🔁';
const REPEAT_ONE_LABEL = '🔂';
const PLAY_LABEL = '▶️';
const PAUSE_LABEL = '⏸️';

const state = {};
const mediaService = new MediaService();
const ee = new EventEmitter();

let debounceSeek = {value: 0, time: 0};

const playPauseButton = new TouchBarButton({
	label: PLAY_LABEL,
	click() {
		ee.emit('playPause');
	}
});

const prevButton = new TouchBarButton({
	label: '⏮️',
	click() {
		ee.emit('prev');
	}
});

const nextButton = new TouchBarButton({
	label: '⏭️',
	click() {
		ee.emit('next');
	}
});

const volumeSlider =  new TouchBarSlider({
	value: 100,
	minValue: 0,
	maxValue: 100,
	label: '🔊',
	change(newValue) {
		ee.emit('volume', newValue);
	}
});

const addToFavoritesButton = new TouchBarButton({
	label: '❤️',
	click() {
		ee.emit('favorite');
	}
});

const playModeButton = new TouchBarButton({
	label: REPEAT_LABEL,
	click() {
		ee.emit('playMode');
	}
});

function updatePlayModeButton() {
	playModeButton.backgroundColor = state.playMode === 0 ? NORMAL_BUTTON_COLOR : SELECTED_BUTTON_COLOR;
	playModeButton.label = state.playMode === 2 ? REPEAT_ONE_LABEL : REPEAT_LABEL;
}

function updateAddToFavoritesButton() {
	addToFavoritesButton.backgroundColor = state.addedToFavorites ? SELECTED_BUTTON_COLOR : NORMAL_BUTTON_COLOR;
	addToFavoritesButton.enabled = state.enabled && state.favoriteEnabled;
}

function updatePlayPauseButton() {
	playPauseButton.label = state.playing ? PAUSE_LABEL : PLAY_LABEL;
}

function updateVolumeSlider() {
	volumeSlider.value = state.volume;
}

function normalizeState(s) {
	const o = {};
	['playing', 'addedToFavorites', 'playMode']
	.forEach((k) => {
		if(typeof(s[k]) !== 'undefined') {
			o[k] = !!s[k];
		}
	});
	if(typeof(s.playMode) !== 'undefined') {
		o.playMode = parseInt(s.playMode, 10);
		if(isNaN(o.playMode) || o.playMode > 2 || o.playMode < 0) {
			o.playMode = 0;
		}
	}
	if(typeof(s.volume) !== 'undefined') {
		o.volume = parseInt(s.volume, 10);
		if(isNaN(o.volume) || o.volume > 100 || o.playMode < 0) {
			o.volume = 0;
		}
	}
	if(typeof(s.duration) !== 'undefined') {
		o.duration = parseInt(s.duration, 10);
		if(isNaN(o.duration) || o.duration < 0) {
			o.duration = 0;
		}
	}

	if(typeof(s.timeElapsed) !== 'undefined') {
		if(typeof(s.timeElapsed) === 'object') {
			o.timeElapsed = s.timeElapsed;
			['elapsed','time'].forEach((k) => {
				o.timeElapsed[k] = parseInt(o.timeElapsed[k], 10);
				if(isNaN(o.timeElapsed[k]) || o.timeElapsed[k] < 0) {
					o.timeElapsed[k] = 0;
				}
			});
		} else {
			o.timeElapsed = {elapsed: 0, time: 0};
		}
	}

	['title', 'artist', 'albumArt', 'album']
	.forEach((k) => {
		if(typeof(s[k]) !== 'undefined') {
			if(typeof(s[k]) === 'string') {
				o[k] = s[k];
			} else {
				o[k] = '';
			}
		}
	});

	return o;
}
let lastID = 0;
let lastMetaDataObject = {};
let lastMetaDataElapsed = {};

function updateMetaData() {
	if(mediaService.isStarted()) {
		let newObject = {};
		let updateNeeded = false;
		let updateElapsedNeeded = false;

		['title', 'artist', 'album', 'duration', 'albumArt'].forEach((k) => {
			if(state[k] !== lastMetaDataObject[k]) {
				newObject[k] = state[k];
				updateNeeded = true;
			}
		});

		if(updateNeeded) {
			lastID++;
		}
		newObject.id = lastID;

		let metaDataPlaying = MediaService.STATES.STOPPED;
		if(state.duration && state.title) {
			metaDataPlaying = state.playing ? MediaService.STATES.PLAYING : MediaService.STATES.PAUSED; 
		}
		if(lastMetaDataObject.state !== metaDataPlaying) {
			newObject.state = metaDataPlaying;
			updateNeeded = true;
		}

		if(lastMetaDataElapsed.elapsed !== state.timeElapsed.elapsed || lastMetaDataElapsed.time !== state.timeElapsed.time) {
			 updateNeeded = true;
			 Object.assign(lastMetaDataElapsed, state.timeElapsed);
		}

		if(updateNeeded) {
			let currentTime = Math.min(state.duration, parseInt((new Date().getTime() - state.timeElapsed.time) / 1000, 10) + state.timeElapsed.elapsed);
			newObject.currentTime = currentTime;

			Object.assign(lastMetaDataObject, newObject);
			mediaService.setMetaData(lastMetaDataObject);
		}
	}
}

const mutators = {
	playing: [updatePlayPauseButton, updateMetaData],
	addedToFavorites: [updateAddToFavoritesButton],
	playMode: [updatePlayModeButton],
	volume: [updateVolumeSlider],
	title: [updateMetaData],
	artist: [updateMetaData],
	album: [updateMetaData],
	albumArt: [updateMetaData],
	timeElapsed: [updateMetaData],
	duration: [updateMetaData]
}

function updateState(newState) {
	if(typeof(newState) !== 'object') {
		throw new TypeError('newState is not a valid object');
	}
	newState = normalizeState(newState);

	const mutations = new Set();
	for(let i in newState) {
		if(newState[i] !== state[i]) {
			state[i] = newState[i];
			mutators[i].forEach((mutation) => mutations.add(mutation));
		}
	}
	mutations.forEach((mutation) => mutation());
}

const electronTouchBar = new TouchBar([
	prevButton, playPauseButton, nextButton,
	new TouchBarSpacer({size: 'large'}),
	addToFavoritesButton,
	playModeButton,
	new TouchBarSpacer({size: 'large'}),
	volumeSlider
]);


['play', 'pause', 'playPause'].forEach((k) => {
	mediaService.on(k, () => ee.emit('playPause'));
});
mediaService.on('next', () => ee.emit('next'));
mediaService.on('previous', () => ee.emit('prev'));
mediaService.on('seek', (to) => {
	if(state.duration > 0) {
		ee.emit('seek', to / state.duration * 100);
	}
});

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
	serviceStart: () => {
		if(!mediaService.isStarted()) {
			mediaService.startService();
		}
	},
	electronTouchBar
});