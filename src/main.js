const {app, shell, Menu, ipcMain, dialog} = require('electron');
const settings = require('electron-settings');
const path = require('path');

const windowManager = require('./window');
const mediaService = require('./media_service');

const SIMPLE_ACTIONS = ['playPause', 'prev', 'next', 'playMode', 'favorite'];
const ARG_ACTIONS = ['volume', 'seek'];

function processCommandLine(argv, cwd) {
	const [type] = argv.slice(process.defaultApp ? 2 : 1);
	if(type && SIMPLE_ACTIONS.includes(SIMPLE_ACTIONS)) {
		windowManager.send('action', {type});
	}
}

function navigate() {
	const defaultUrl = require('url').format({
		protocol: 'file',
		slashes: true,
		pathname: path.join(__dirname, 'browser', 'default.html')
	});

	windowManager.create((window) => window.loadURL(settings.get('url', '') || defaultUrl));	
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
	.then((r) => {
		if(r) {
			settings.set('url', r);
			navigate();
		}
	}).catch((e) => {
		windowManager.messageBox({
			type: 'error',
			title: promptTitle,
			message: e.message
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

const observer = settings.watch('url', (newUrl) => {
	if(windowManager.isRunning()) {
		navigate();
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

windowManager.on('quit', () => app.quit())

app.on('will-quit', () => {
	mediaService.shortcuts.unregister();
});

app.on('activate', () => {
	windowManager.create((win) => win.show());
});


windowManager.on('navigated', (webContents) => {
	webContents.executeJavaScript('require('+JSON.stringify(path.resolve(__dirname, './browser/inject.js'))+')');
});

windowManager.on('enter-full-screen', (mainWindow) => {
	mainWindow.webContents.executeJavaScript('document.documentElement.classList.add("fullscreen")');
});

windowManager.on('leave-full-screen', (mainWindow) => {
	mainWindow.webContents.executeJavaScript('document.documentElement.classList.remove("fullscreen")');
});

navigate();

windowManager.ready(() => {
	processCommandLine(process.argv, process.cwd());

	mediaService.shortcuts.register();

	mediaService.serviceStart();

	SIMPLE_ACTIONS.forEach((type) => {
		mediaService.on(type, () => windowManager.send('action', {type}));
	});

	ARG_ACTIONS.forEach((type) => {
		mediaService.on(type, (arg) => windowManager.send('action', {type, args: [arg]}));
	});

	ipcMain.on('updateState', (event, newState) => mediaService.updateState(newState));
});