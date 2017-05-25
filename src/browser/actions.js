function _withEl(selector, fn) {
    const el = document.querySelector(selector);
    if(el) {
        fn(el);
        return true;
    }
    return false;
}

function dispatchEvent(el, type) {
        const ev = new Event(type);
        ev.__generated = true;
        el.dispatchEvent(ev);
}

function next() {
    _withEl('#playerControls > i.next.control', (el) => el.click());
}

function prev() {
    _withEl('#playerControls > i.prev.control', (el) => el.click());
}

function play() {
    _withEl('#playerControls > span.play.control', (el) => el.click());
}

function pause() {
    _withEl('#playerControls > span.pause.control', (el) => el.click());
}

function playPause() {
    play();
    pause();
}

function playMode() {
    _withEl('#mainFooter > div.media-info-wrap > div.other-controls > div > span.repeat.control', (el) => el.click());
}

function favorite() {
    _withEl('#mainFooter > div.media-info-wrap > div.other-controls > div > i.like.control.fa.fa-heart', (el) => el.click());
}

function seek(percent) {
    console.log('percent', percent);
    
    _withEl(
        '#progressPane > div.plyr > div.plyr__controls > div.plyr__progress > input.plyr__progress--seek', 
        (el) => {
            el.value = percent;
            dispatchEvent(el, 'input');
        }
    );
}


function volume(percent) {
    _withEl(
        '#volumeRange', 
        (el) => {
            el.value = percent/10;
            dispatchEvent(el, 'input');
        }
    );
}

function stop() {
    pause();
    seek(0);
}

const actions = {
    next, prev, play, pause, playPause, playMode, seek, stop, volume, favorite
};

let isReady = false;
let onReadyActions = [];

function handleAction(obj) {
    if(obj.type && actions[obj.type]) {
        console.log('action', obj);
        if(obj.args) {
            if(Array.isArray(obj.args)) {
                actions[obj.type].apply(actions[obj.type], obj.args);
            } else {
                actions[obj.type].call(actions[obj.type], obj.args);
            }
        } else {
            actions[obj.type].call(actions[obj.type]);
        }
    }
}

require('electron').ipcRenderer.on('action', (event, obj) => {
    console.log('action', isReady, obj);
    if(isReady) {
        handleAction(obj);
    } else {
        onReadyActions.push(obj);
    }
});

function ready() {
    if(!isReady) {
        isReady = true;
        const readyActions = onReadyActions;
        onReadyActions = [];
        readyActions.forEach(handleAction);
    }
}

module.exports = {
    actions,
    ready
};