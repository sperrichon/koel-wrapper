require('default-passive-events'); // eslint-disable-line import/no-unassigned-import

const MIN_INTERVAL_TIME = 100;

function init() {
	class __ParentNotification extends window.Notification {
		constructor(title, options) {
			options = Object.assign({silent: true}, options || {});
			super(title, options);
		}
	}
	window.Notification = __ParentNotification;

	const __setTimeout = window.setTimeout;
	window.setTimeout = (func, time) => __setTimeout(func, Math.min(time, MIN_INTERVAL_TIME));

	const __setInterval = window.setInterval;
	window.setInterval = (func, time) => __setInterval(func, Math.min(time, MIN_INTERVAL_TIME));
}

module.exports = {init};
