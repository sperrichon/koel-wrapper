const unhandled = require('electron-unhandled');
const logger = require('electron-timber');

unhandled({
    logger: logger.error.bind(logger),
    showDialog: true
});

logger.log('starting');
try {
    require('./app.js');
} catch(err) {
    logger.error(err);
    process.exit(1);
}