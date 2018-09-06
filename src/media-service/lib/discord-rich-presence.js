const {EventEmitter} = require('events');
const {Client} = require('discord-rpc');

// Monkey patching discord-rpc to avoid unhandled rejections
const Transports = require('discord-rpc/src/transports');

const IPCTransport = Transports.ipc;

class KoelSafeIPCTransport extends IPCTransport {
	async connect(opts) {
		try {
			await super.connect(opts);
		} catch (err) {
			this.onClose(err);
		}
	}
}

Transports._koelSafeIPC = KoelSafeIPCTransport;

class DiscordRichPresence extends EventEmitter {
	constructor(clientId) {
		super();

		this._client = null;
		this._clientId = clientId;
	}

	getClient() {
		if (this._client) {
			return this._client;
		}

		this._client = new Promise((resolve, reject) => {
			const client = new Client({
				transport: '_koelSafeIPC' // Using our patched ipc transport
			});

			const rejectW = e => {
				this.emit('error', e);
				this.destroy();
				reject(e);
			};

			client.on('error', rejectW);
			client.transport.on('error', rejectW);
			client.transport.on('close', () => rejectW('Transport closed'));

			client.on('ready', () => {
				this.emit('ready');
				resolve(client);
			});

			client.login(this._clientId).catch(rejectW);
		});

		return this._client;
	}

	async setActivity(state) {
		const client = await this.getClient();

		return client.setActivity(state);
	}

	destroy() {
		if (this._client) {
			this._client
				.then(client => client.destroy())
				.catch(() => {});

			this._client = null;
		}
	}
}

module.exports = DiscordRichPresence;
