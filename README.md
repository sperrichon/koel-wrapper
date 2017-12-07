koel-wrapper
==============

An [Electron](http://electron.atom.io/) wrapper for [Koel](https://github.com/phanan/koel).

Tested on macOS High Sierra, Windows 10, and Solus

This app was first made as a playground to mess with Electron APIs (globalShortcuts, TouchBar, Frameless Windows).
Although its goal is the same as the official [Koel Desktop App](https://github.com/phanan/koel-app), it behaves differently:

- Does not contain Koel assets, loads your hosted version as when using it via browsers.
- Uses [MutationObservers](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) and DOM [Events](https://developer.mozilla.org/en-US/docs/Web/API/Event/Event) to fetch state updates (=what's playing) from the [BrowserWindow](https://electron.atom.io/docs/api/browser-window/), and permit actions (e.g.: pause, volume change, etc...) to be triggered 
- MacOS: Uses the (experimental) [TouchBar API](https://electron.atom.io/docs/api/touch-bar/) to display navigation controls while the app is focused, and [Electron Media Service](https://github.com/MarshallOfSound/electron-media-service) to provide quick control when the app is in the background
- MacOS: Style adjustments so that with [titleBarStyle](https://electron.atom.io/docs/api/browser-window/#new-browserwindowoptions) set to inset, the window controls blends nicely within Koel header bar

**Note**: Media Keys work too, as in the official Koel App.

## Installation

```bash
git clone https://github.com/p-sam/koel-wrapper.git
cd koel-wrapper
npm install
npm start
npm run pack # package app
npm run dist # package app + zips and installers
```
