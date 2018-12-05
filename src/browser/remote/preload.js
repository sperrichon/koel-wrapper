{
	function querySelector(selector) {
		try {
			if (!document.body || !document.head) {
				return null;
			}
			return document.querySelector(selector);
		} catch (_) {
			return null;
		}
	}

	function hook() {
		const appEl = querySelector('#app');
		if (!appEl) {
			return requestAnimationFrame(hook);
		}
		const dragEl = document.createElement('div');
		dragEl.style.position = 'fixed';
		dragEl.style.left = 0;
		dragEl.style.right = 0;
		dragEl.style.top = 0;
		dragEl.style.height = '24px';
		dragEl.style.webkitAppRegion = 'drag';
		appEl.parentNode.appendChild(dragEl);
	}

	hook();
}
