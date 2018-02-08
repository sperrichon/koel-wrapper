const {EventEmitter} = require('events');
const MediaService = require('electron-media-service');

const mediaService = new MediaService();
const ee = new EventEmitter();

let lastID = 0;
const lastMetaDataObject = {};
const lastMetaDataElapsed = {};

function updateMetaData(state) {
	if (mediaService.isStarted()) {
		const newObject = {};
		let updateNeeded = false;

		['title', 'artist', 'album', 'duration', 'albumArt'].forEach(k => {
			if (state[k] !== lastMetaDataObject[k]) {
				newObject[k] = state[k];
				updateNeeded = true;
			}
		});

		if (updateNeeded) {
			lastID++;
		}
		newObject.id = lastID;

		let metaDataPlaying = MediaService.STATES.STOPPED;
		if (state.duration && state.title) {
			metaDataPlaying = state.playing ? MediaService.STATES.PLAYING : MediaService.STATES.PAUSED;
		}
		if (lastMetaDataObject.state !== metaDataPlaying) {
			newObject.state = metaDataPlaying;
			updateNeeded = true;
		}

		if (lastMetaDataElapsed.elapsed !== state.timeElapsed.elapsed || lastMetaDataElapsed.time !== state.timeElapsed.time) {
			updateNeeded = true;
			Object.assign(lastMetaDataElapsed, state.timeElapsed);
		}

		if (updateNeeded) {
			const currentTime = Math.min(state.duration, parseInt((new Date().getTime() - state.timeElapsed.time) / 1000, 10) + state.timeElapsed.elapsed);
			newObject.currentTime = currentTime;

			Object.assign(lastMetaDataObject, newObject);
			mediaService.setMetaData(lastMetaDataObject);
		}
	}
}

['play', 'pause', 'playPause'].forEach(k => {
	mediaService.on(k, () => ee.emit('playPause'));
});
mediaService.on('next', () => ee.emit('next'));
mediaService.on('previous', () => ee.emit('prev'));
mediaService.on('seek', percentage => {
	ee.emit('seek', percentage);
});

module.exports = Object.assign(ee, {
	mutators: {
		updateMetaData
	},
	start: () => {
		if (!mediaService.isStarted()) {
			mediaService.startService();
		}
	}
});
