const settings = require('electron-settings');

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
}

module.exports = {init};
