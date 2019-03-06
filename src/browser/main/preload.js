const fs = require('fs');
const path = require('path');
const logger = require('electron-timber');

function injectCSS(css) {
	if (!document.head || !window.BASE_URL) {
		requestAnimationFrame(() => injectCSS(css));
		return;
	}

	css = String(css).replace(/__BASE_URL__/g, window.BASE_URL);
	const style = document.createElement('style');

	style.type = 'text/css';
	if (style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		style.append(document.createTextNode(css));
	}

	document.head.append(style);

	logger.log('css injected');
	document.documentElement.classList.add('injected');
}

function injectCSSFile(cssPath) {
	fs.readFile(
		path.resolve(__dirname, cssPath),
		(error, css) => {
			if (error) {
				logger.error('css inject', error);
			} else {
				injectCSS(css);
			}
		}
	);
}

injectCSSFile('./style.css');
injectCSSFile('./style.theme.css');

require('./hooks.js').init();
require('./listeners.js').init();
