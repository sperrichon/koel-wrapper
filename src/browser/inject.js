const logger = require('electron-timber');

class __ParentNotification extends window.Notification {
	constructor(title, options) {
		options = Object.assign({silent: true}, options || {});
		super(title, options);
	}
}

window.Notification = __ParentNotification;

require('fs').readFile(
    require('path').resolve(__dirname, './style.css'),
    (err, css) => {
	if (err) {
		logger.error('css inject', err);
	} else {
		const head = document.head || document.getElementsByTagName('head')[0];
		const style = document.createElement('style');

		style.type = 'text/css';
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}

		head.appendChild(style);
		logger.log('css injected');
		document.documentElement.classList.add('injected');
	}
}
);

require('./listeners.js').init();
