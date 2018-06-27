function EventBus(limit = Number.MAX_SAFE_INTEGER) {
	this.eventListeners = new Map();
	this.eventQueue = new DoubleLinkedList();
	this.queueLimit = limit;
	this.dispatcher = this.dispatchIterator();
	this.catchAllEnabled = false;
};
EventBus.prototype.CATCH_ALL = new Symbol("CatchAll Event");
EventBus.prototype.dispatchIterator = function* (thisArg = null) {
	while (true) {
		if (this.eventQueue.size === 0) {
			yield;
			continue;
		}
		while (this.eventQueue.size > 0) {
			const element = this.eventQueue.shift();
			this.eventQueue.remove(element);
			const event = element.payload;
			var listeners = this.eventListeners.get(event.name);
			if (listeners === undefined) continue;
			for (const listener of listeners) {
				listener.call(thisArg, event);
				yield;
			}
			if (!catchAllEnabled) continue;
			listeners = this.eventListeners.get(this.CATCH_ALL);
			if (listeners === undefined) continue;
			for (const listener of listeners) {
				listener.call(thisArg, event);
				yield;
			}
		}
	}
};
EventBus.prototype.publishEvent = function (event) {
	if (this.eventQueue.size === this.queueLimit) throw new Error("EventBus Queue size limit reached. Could not publish additional event.");
	this.eventQueue.append(event);
};
EventBus.prototype.addEventListener = function (name, callback) {
	var listeners = this.eventListeners.get(name);
	if (listeners === undefined) {
		listeners = new Set();
		this.eventListeners.set(name, listeners);
		listeners.add(callback);
	} else {
		this.eventListeners.get(name).add(callback);
	}
};
EventBus.prototype.removeEventListener = function (name, callback) {
	var listeners = this.eventListeners.get(name);
	if (listeners === undefined) {
		return;
	}
	listeners.delete(callback);
	if (listeners.size === 0) {
		this.eventListeners.delete(name)
	}
};
EventBus.prototype.purgeListeners = function (name) {
	return this.eventListeners.delete(name);
};
module.exports = EventBus;