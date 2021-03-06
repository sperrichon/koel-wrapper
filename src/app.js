const path = require('path');
const {app, ipcMain, session} = require('electron');
const settings = require('electron-settings');

const windowManager = require('./window');
const mediaService = require('./media-service');
const logging = require('./logging.js');

const SIMPLE_ACTIONS = ['play', 'pause', 'playPause', 'prev', 'next', 'playMode', 'favorite'];
const ARG_ACTIONS = ['volume', 'seek'];

function processCommandLine(argv) {
	const [type] = argv.slice(process.defaultApp ? 2 : 1);
	if (type && SIMPLE_ACTIONS.includes(SIMPLE_ACTIONS)) {
		windowManager.send('action', {type});
	}
}

const shouldQuit = !app.requestSingleInstanceLock();

if (shouldQuit) {
	app.quit();
}

app.on('second-instance', (commandLine, workingDirectory) => {
	windowManager.show();
	processCommandLine(commandLine, workingDirectory);
});

function navigate() {
	const defaultUrl = require('url').format({
		protocol: 'file',
		slashes: true,
		pathname: path.join(__dirname, 'browser', 'default.html')
	});

	windowManager.create(window => window.loadURL(settings.get('url', '') || defaultUrl));
}

function clearCache() {
	session.defaultSession.clearCache(() => windowManager.messageBox({
		title: 'Koel - Clear cache',
		message: 'Cache cleared'
	}));
}

function clearStorageData() {
	session.defaultSession.clearStorageData(() => windowManager.messageBox({
		title: 'Koel - Clear storage data',
		message: 'Storage data cleared'
	}));
}

function openSetUrlDialog() {
	const promptTitle = 'Koel - Preferences - Set URL';

	windowManager.prompt({
		inputAttrs: {
			type: 'url'
		},
		title: promptTitle,
		label: 'Koel URL:',
		value: settings.get('url', '')
	})
		.then(r => {
			if (r) {
				settings.set('url', r);
				navigate();
			}
		}).catch(error => {
			windowManager.messageBox({
				type: 'error',
				title: promptTitle,
				message: error.message
			});
		});
}

function applyDiscordPresenceStatus(enabled) {
	if (enabled) {
		mediaService.discordPresence.enable();
	} else {
		mediaService.discordPresence.disable();
	}
}

function setDiscordPresenceEnabled(enabled) {
	settings.set('discordPresenceEnabled', enabled);
	applyDiscordPresenceStatus(enabled);
}

function setNotificationsEnabled(enabled) {
	settings.set('notificationsEnabled', enabled);
}

function openRemoteWindow(alwaysOnTop) {
	windowManager.send('action', {type: 'openRemote', args: [alwaysOnTop]});
}

settings.watch('url', () => {
	if (windowManager.isRunning()) {
		navigate();
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('will-quit', () => {
	mediaService.shortcuts.unregister();
});

app.on('activate', () => {
	windowManager.create(win => win.show());
});

windowManager.on('enter-full-screen', mainWindow => {
	mainWindow.webContents.executeJavaScript('document.documentElement.classList.add("fullscreen")');
});

windowManager.on('leave-full-screen', mainWindow => {
	mainWindow.webContents.executeJavaScript('document.documentElement.classList.remove("fullscreen")');
});

logging.register();

const initialValues = {
	discordPresenceEnabled: settings.get('discordPresenceEnabled', false),
	notificationsEnabled: settings.get('notificationsEnabled', true)
};
applyDiscordPresenceStatus(initialValues.discordPresenceEnabled);

windowManager.setMenuTemplate(require('./menu.js')({
	openSetUrlDialog, setDiscordPresenceEnabled, clearStorageData, clearCache, setNotificationsEnabled, openRemoteWindow
}, initialValues));

windowManager.setTouchBar(mediaService.electronTouchBar);

windowManager.ready(() => {
	processCommandLine(process.argv, process.cwd());

	mediaService.shortcuts.register();

	mediaService.darwinMedia.init();

	SIMPLE_ACTIONS.forEach(type => {
		mediaService.on(type, () => windowManager.send('action', {type}));
	});

	ARG_ACTIONS.forEach(type => {
		mediaService.on(type, arg => windowManager.send('action', {type, args: [arg]}));
	});

	ipcMain.on('updateState', (_, newState) => mediaService.updateState(newState));
});

navigate();
