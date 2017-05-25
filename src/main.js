const {app, shell, Menu, ipcMain, globalShortcut, dialog} = require('electron');
const settings = require('electron-settings');
const path = require('path');

const windowManager = require('./window');
const mediaService = require('./media_service.js');

function processCommandLine(argv, cwd) {
	if(process.platform !== 'darwin') {
		argv.slice(process.defaultApp ? 2 : 1).forEach(console.log);
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
		type: 'url',
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
	globalShortcut.unregisterAll();
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

	const shortcuts = {
		MediaNextTrack: 'next',
		MediaPreviousTrack: 'previous', 
		MediaStop: 'stop',
		MediaPlayPause: 'playPause'
	};

	Object.keys(shortcuts).forEach((k) => {
		globalShortcut.register(k, () => {
			windowManager.send('action', {type: shortcuts[k]});
		});
	});

	mediaService.serviceStart();

	['playPause', 'prev', 'next', 'playMode', 'favorite'].forEach((type) => {
		mediaService.on(type, () => windowManager.send('action', {type}));
	});

	['volume', 'seek'].forEach((type) => {
		mediaService.on(type, (arg) => windowManager.send('action', {type, args: [arg]}));
	});

	ipcMain.on('updateState', (event, newState) => {
		setImmediate(() => mediaService.updateState(newState));
	});
});