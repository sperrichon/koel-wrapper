const logger = require('electron-timber');

const windowManager = require('./window');

function loggingRegister() {
    ['close', 'enter-full-screen', 'leave-full-screen', 'navigate', 'navigated', 'dom-ready', 'ready'].forEach((event) => {
        windowManager.on(event, () => logger.log('[window]', event));
    });
}

module.exports = {
    register: loggingRegister
};