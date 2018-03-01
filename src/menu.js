const {shell, dialog} = require('electron');
const pkg = require('../package.json');

function menuTemplateFactory(actions, initialValues) {
	const aboutMenuItem = {
		label: 'About ' + pkg.productName,
		click() {
			dialog.showMessageBox({
				title: 'About ' + pkg.productName,
				message: pkg.productName,
				detail:
					pkg.description +
					'\n\nv' +
					pkg.version +
					'\n\nCopyright © ' +
					new Date().getFullYear() +
					' ' + pkg.author.name
			});
		}
	};

	const preferencesSubMenu = {
		label: 'Preferences',
		submenu: [
			{
				label: 'Set Koel URL...',
				click() {
					actions.openSetUrlDialog();
				}
			},
			{
				label: 'Discord Presence',
				type: 'checkbox',
				checked: initialValues.discordPresenceEnabled,
				enabled: true,
				click(item) {
					actions.setDiscordPresenceEnabled(item.checked);
				}
			}
		]
	};

	const clearSubMenu = {
		label: 'Clear',
		submenu: [
			{
				label: 'Clear cache',
				click() {
					actions.clearCache();
				}
			},
			{
				label: 'Clear storage data',
				click() {
					actions.clearStorageData();
				}
			}
		]
	};

	const externalLinksMenuItems = [
		{
			label: 'Github Repo',
			click() {
				shell.openExternal('https://github.com/sperrichon/koel-wrapper');
			}
		},
		{
			label: 'Koel Website',
			click() {
				shell.openExternal('https://koel.phanan.net/');
			}
		}
	];

	const template = [
		{
			label: 'Edit',
			submenu: [
				{role: 'undo'},
				{role: 'redo'},
				{type: 'separator'},
				{role: 'cut'},
				{role: 'copy'},
				{role: 'paste'},
				{role: 'delete'},
				{role: 'selectall'}
			]
		},
		{
			label: 'View',
			submenu: [
				{role: 'reload'},
				{role: 'forcereload'},
				{role: 'toggledevtools'},
				{type: 'separator'},
				{role: 'resetzoom'},
				{role: 'zoomin'},
				{role: 'zoomout'},
				{type: 'separator'},
				{role: 'togglefullscreen'}
			]
		}
	];

	if (process.platform === 'darwin') {
		template.unshift({
			label: pkg.productName,
			submenu: [
				aboutMenuItem,
				{type: 'separator'},
				preferencesSubMenu,
				clearSubMenu,
				{type: 'separator'},
				{role: 'hide'},
				{role: 'hideothers'},
				{role: 'unhide'},
				{type: 'separator'},
				{role: 'quit'}
			]
		});

		template.push({
			role: 'window',
			submenu: [
				{role: 'minimize'},
				{role: 'zoom'},
				{type: 'separator'},
				{role: 'front'}
			]
		});

		template.push({
			role: 'help',
			submenu: externalLinksMenuItems
		});
	} else {
		template.unshift({
			label: pkg.productName,
			submenu: [
				preferencesSubMenu,
				clearSubMenu,
				{type: 'separator'},
				{role: 'quit'}
			]
		});

		template.push({
			label: 'About',
			submenu: [
				aboutMenuItem,
				{type: 'separator'}
			].concat(externalLinksMenuItems)
		});
	}

	return template;
}

module.exports = menuTemplateFactory;
