const logger = require('electron-timber');

const windowManager = require('./window');
const discordPresenceService = require('./media-service/discord-presence-service');

function loggingRegister() {
	['close', 'enter-full-screen', 'leave-full-screen', 'navigate', 'navigated', 'dom-ready', 'ready'].forEach(event => {
		windowManager.on(event, () => logger.log('[window]', event));
	});

	discordPresenceService.on('error', error => logger.error('[discord]', 'error', error));
	discordPresenceService.on('ready', () => logger.log('[discord]', 'ready'));
	discordPresenceService.on('toggle', enabled => logger.log('[discord]', 'toggle', enabled ? 'enabled' : 'disabled'));
	discordPresenceService.on('activity', data => logger.log('[discord]', 'activity', data));
}

module.exports = {
	register: loggingRegister
};
