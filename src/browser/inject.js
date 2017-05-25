class __ParentNotification extends window.Notification {
    constructor(title, options) {
        options = Object.assign({silent: true}, options || {});
        super(title, options);
    } 
}

window.Notification = __ParentNotification;

require('fs').readFile(
    require('path').resolve(__dirname, './style.css'), 
    (err, css) => {
        if(err) {
            console.error('styleInject', err);
        } else {
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet){
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
            console.log('CSS INJECTED');
        }
    }
);

require('./listeners.js');
require('./actions.js');