const {EventEmitter} = require('events');
const debounce = require('debounce-promise');
const DiscordRichPresence = require('./lib/discord-rich-presence');

const ee = new EventEmitter();

let presenceClient = null;
let lastState = null;

async function updateActivity(state) {
	if (presenceClient && state) {
		const activity = {
			details: state.title && state.artist ? `🎵  ${state.title}` : '--',
			state: state.title && state.artist ? `👤  ${state.artist}` : 'Not playing',
			startTimestamp: state.timeElapsed && state.duration ? Math.floor(state.timeElapsed.time / 1000) : null,
			endTimestamp: state.timeElapsed && state.duration ? Math.floor((state.timeElapsed.time + state.duration - state.timeElapsed.elapsed) / 1000) : null,
			largeImageKey: 'koel_large',
			smallImageKey: state.playing ? 'play_icon_small' : 'pause_icon_small',
			largeImageText: state.album ? `💿  ${state.album}` : '--',
			smallImageText: state.playing ? 'Playing' : 'Paused',
			instance: false
		};

		let ok = true;
		try {
			await presenceClient.setActivity(activity);
		} catch (err) {
			ok = false;
		}

		ee.emit('activity', {activity, ok});
	}
}
const flushActivityUpdate = debounce(() => updateActivity(lastState), 500);

function enablePresence() {
	if (!presenceClient) {
		presenceClient = new DiscordRichPresence('411436834439299072');
		presenceClient.on('ready', () => ee.emit('connected'));
		presenceClient.on('error', err => ee.emit('error', err));
		flushActivityUpdate();
		ee.emit('toggle', true);
	}
}

function disablePresence() {
	if (presenceClient) {
		presenceClient.destroy();
		presenceClient = null;
		ee.emit('toggle', false);
	}
}

setInterval(flushActivityUpdate, 5000);

module.exports = Object.assign(ee, {
	mutators: {
		setActivity(state) {
			lastState = state;
			flushActivityUpdate();
		}
	},
	actions: {
		enable: enablePresence,
		disable: disablePresence
	}
});
