const {EventEmitter} = require('events');

const ee = new EventEmitter();

const {TouchBar} = require('electron');

const {TouchBarButton, TouchBarSpacer, TouchBarSlider} = TouchBar;

const SELECTED_BUTTON_COLOR = '#767676';
const NORMAL_BUTTON_COLOR = '#373737';
const REPEAT_LABEL = '🔁';
const REPEAT_ONE_LABEL = '🔂';
const PLAY_LABEL = '▶️';
const PAUSE_LABEL = '⏸️';

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

const volumeSlider = new TouchBarSlider({
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

function updatePlayModeButton(state) {
	playModeButton.backgroundColor = state.playMode === 0 ? NORMAL_BUTTON_COLOR : SELECTED_BUTTON_COLOR;
	playModeButton.label = state.playMode === 2 ? REPEAT_ONE_LABEL : REPEAT_LABEL;
}

function updateAddToFavoritesButton(state) {
	addToFavoritesButton.backgroundColor = state.addedToFavorites ? SELECTED_BUTTON_COLOR : NORMAL_BUTTON_COLOR;
	addToFavoritesButton.enabled = state.enabled && state.favoriteEnabled;
}

function updatePlayPauseButton(state) {
	playPauseButton.label = state.playing ? PAUSE_LABEL : PLAY_LABEL;
}

function updateVolumeSlider(state) {
	volumeSlider.value = state.volume;
}

const electronTouchBar = new TouchBar({items: [
	prevButton,
	playPauseButton,
	nextButton,
	new TouchBarSpacer({size: 'large'}),
	addToFavoritesButton,
	playModeButton,
	new TouchBarSpacer({size: 'large'}),
	volumeSlider
]});

module.exports = Object.assign(ee, {
	mutators: {updateAddToFavoritesButton, updatePlayModeButton, updatePlayPauseButton, updateVolumeSlider},
	electronTouchBar
});

