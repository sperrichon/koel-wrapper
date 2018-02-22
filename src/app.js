const path = require('path');
const {app, ipcMain} = require('electron');
const settings = require('electron-settings');

const windowManager = require('./window');
const mediaService = require('./media-service');

const SIMPLE_ACTIONS = ['playPause', 'prev', 'next', 'playMode', 'favorite'];
const ARG_ACTIONS = ['volume', 'seek'];

function processCommandLine(argv) {
	const [type] = argv.slice(process.defaultApp ? 2 : 1);
	if (type && SIMPLE_ACTIONS.includes(SIMPLE_ACTIONS)) {
		windowManager.send('action', {type});
	}
}

function navigate() {
	const defaultUrl = require('url').format({
		protocol: 'file',
		slashes: true,
		pathname: path.join(app.getAppPath(), 'browser', 'default.html')
	});

	windowManager.create(window => window.loadURL(settings.get('url', '') || defaultUrl));
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
	}).catch(err => {
		windowManager.messageBox({
			type: 'error',
			title: promptTitle,
			message: err.message
		});
	});
}

windowManager.setMenuTemplate(require('./menu.js')({openSetUrlDialog}));

windowManager.setTouchBar(mediaService.electronTouchBar);

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
	windowManager.show();
	processCommandLine(commandLine, workingDirectory);
});

if (shouldQuit) {
	app.quit();
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

windowManager.on('quit', () => app.quit());

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

navigate();

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

	ipcMain.on('updateState', (event, newState) => mediaService.updateState(newState));
});
