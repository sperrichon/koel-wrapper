const logger = require('electron-timber');

function injectCSS(css) {
	if (!document.head) {
		setTimeout(() => injectCSS(css), 200);
		return;
	}

	const style = document.createElement('style');

	style.type = 'text/css';
	if (style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}

	document.head.appendChild(style);

	logger.log('css injected');
	document.documentElement.classList.add('injected');
}

require('fs').readFile(
	require('path').resolve(__dirname, './style.css'),
	(error, css) => {
		if (error) {
			logger.error('css inject', error);
		} else {
			injectCSS(css);
		}
	}
);

require('./hooks.js').init();
require('./listeners.js').init();
