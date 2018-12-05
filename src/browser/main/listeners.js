const {ipcRenderer} = require('electron');
const logger = require('electron-timber');
const actions = require('./actions');

function updateState(state) {
	logger.log('[listeners]', 'updateState', state);
	ipcRenderer.send('updateState', state);
}

function whenDomReady(selector, filter) {
	return new Promise(resolve => {
		let interval; // eslint-disable-line prefer-const
		const loop = () => {
			const el = document.querySelector(selector);

			if (typeof (filter) !== 'function') {
				filter = el => Boolean(el);
			}

			if (filter(el)) {
				clearInterval(interval);
				resolve(el);
			}
		};
		interval = setInterval(loop, 200);
	});
}

function onElementAttributeChange(el, attribute, fn) {
	const observer = new MutationObserver(mutations => {
		let i = mutations.length;
		let classMutated = false;
		while (i--) {
			if (mutations[i].attributeName === attribute) {
				classMutated = true;
				break;
			}
		}
		if (!classMutated) {
			return;
		}
		fn(el);
	});
	observer.observe(el, {attributes: true});
}

function onVolumeChange(el) {
	updateState({volume: parseInt(el.value * 10, 10)});
}

function onPlayingChange(el) {
	updateState({playing: el.classList.contains('pause')});
}

function onFavoriteChange(el) {
	updateState({addedToFavorites: el.classList.contains('liked')});
}

function onPlayModeChange(el) {
	let playMode = 0;
	if (el.classList.contains('REPEAT_ALL')) {
		playMode = 1;
	}
	if (el.classList.contains('REPEAT_ONE')) {
		playMode = 2;
	}
	updateState({playMode});
}

function onAudioTimeUpdate(el) {
	updateState({
		timeElapsed: {
			elapsed: parseInt(el.currentTime * 1000, 10),
			time: new Date().getTime()
		},
		duration: parseInt(el.duration * 1000, 10)
	});
}

function onBackgroundImageUpdate(el) {
	let url = '';
	if (el.style && el.style.backgroundImage) {
		if (el.style.backgroundImage.substr(0, 4) === 'url(' && el.style.backgroundImage.substr(-1) === ')') {
			url = el.style.backgroundImage.substr(4, el.style.backgroundImage.length - 5).replace(/^["']/, '').replace(/["']$/, '');
		}
	}
	updateState({albumArt: url});
}
async function init() {
	await whenDomReady('#mainWrapper');

	await whenDomReady('#overlay', el => !el || (el.style && el.style.display === 'none'));

	Promise.all([whenDomReady('#volume'), whenDomReady('#volumeRange')])
		.then(([muteButtonEl, volumeRangeEl]) => {
			muteButtonEl.addEventListener('click', e => {
				if (e.__generated) {
					return;
				}
				onVolumeChange(volumeRangeEl);
			});
			volumeRangeEl.addEventListener('input', e => {
				if (e.__generated) {
					return;
				}
				onVolumeChange(volumeRangeEl);
			});
			onVolumeChange(volumeRangeEl);
		});

	whenDomReady('#playerControls > span.control').then(el => {
		onElementAttributeChange(el, 'class', onPlayingChange);
		onPlayingChange(el);
	});

	whenDomReady('#mainFooter > div.media-info-wrap > div.other-controls > div > span.repeat.control').then(el => {
		onElementAttributeChange(el, 'class', onPlayModeChange);
		onPlayModeChange(el);
	});

	whenDomReady('#mainFooter > div.media-info-wrap > div.other-controls > div > i.like.control.fa.fa-heart').then(el => {
		onElementAttributeChange(el, 'class', onFavoriteChange);
		onFavoriteChange(el);
	});

	whenDomReady('#progressPane > div > audio').then(el => {
		['playing', 'pause', 'seeked'].forEach(k => {
			el.addEventListener(k, () => {
				onAudioTimeUpdate(el);
			});
		});
		onAudioTimeUpdate(el);
	});

	whenDomReady('#mainFooter > div.media-info-wrap > div.middle-pane > span').then(el => {
		onElementAttributeChange(el, 'style', () => {
			onBackgroundImageUpdate(el);
		});
		onBackgroundImageUpdate(el);
	});

	const textStateSelectors = {
		title: '#progressPane > h3',
		artist: '#progressPane > p > a.artist',
		album: '#progressPane > p > a.album'
	};

	Object.keys(textStateSelectors).forEach(k => {
		whenDomReady(textStateSelectors[k]).then(el => {
			const observer = new MutationObserver(() => {
				const newState = {};
				newState[k] = el.textContent;
				updateState(newState);
			});
			observer.observe(el, {
				characterData: true,
				subtree: true
			});
		});
	});

	actions.ready();
}

module.exports = {init};
