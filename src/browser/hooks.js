require('default-passive-events'); // eslint-disable-line import/no-unassigned-import
const settings = require('electron-settings');

const MIN_INTERVAL_TIME = 100;

function init() {
	class Notification extends window.Notification {
		constructor(title, options) {
			options = Object.assign({silent: true}, options || {});
			super(title, options);
		}
	}

	Object.defineProperty(window, 'Notification', {
		get() {
			if (settings.get('notificationsEnabled', true)) {
				return Notification;
			}
			return undefined;
		}
	});

	const __setTimeout = window.setTimeout;
	window.setTimeout = (func, time) => {
		if (time < MIN_INTERVAL_TIME) {
			time = MIN_INTERVAL_TIME;
		}
		return __setTimeout(func, time);
	};

	const __setInterval = window.setInterval;
	window.setInterval = (func, time) => {
		if (time < MIN_INTERVAL_TIME) {
			time = MIN_INTERVAL_TIME;
		}
		return __setInterval(func, time);
	};
}

module.exports = {init};
