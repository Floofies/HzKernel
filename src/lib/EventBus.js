stdLib.EventBus = function () {
	this.eventListeners = new Map();
	this.eventQueue = new stdLib.DoubleLinkedList();
	this.dispatcher = null;
	this.catchAllEnabled = false;
};
stdLib.EventBus.CATCH_ALL = new Symbol("CatchAll Event");
stdLib.EventBus.dispatchIterator = function* (thisArg = null) {
	while (true) {
		if (this.eventQueue.size > 0) {
			for (var element of this.eventQueue[Symbol.iterator]()) {
				this.eventQueue.remove(element);
				var event = element.payload;
				listeners = this.eventListeners.get(event.name);
				if (listeners === undefined) {
					continue;
				}
				for (var listener of listeners[Symbol.iterator]()) {
					listener.call(thisArg, event);
					yield;
				}
				if (!catchAllEnabled) {
					continue;
				}
				listeners = this.eventListeners.get(this.CATCH_ALL);
				if (listeners === undefined) {
					continue;
				}
				for (var listener of listeners) {
					listener.call(thisArg, event);
					yield;
				}
			}
		}
		yield;
	}
};
stdLib.EventBus.dispatch = function () {
	this.dispatcher = this.dispatchIterator();
	return this.dispatcher;
};
stdLib.EventBus.prototype.publishEvent = function (event) {
	this.eventQueue.append(event);
};
stdLib.EventBus.prototype.addEventListener = function (name, callback) {
	var listeners = this.eventListeners.get(name);
	if (listeners === undefined) {
		listeners = new Set();
		this.eventListeners.set(name, listeners);
		listeners.add(callback);
	} else {
		this.eventListeners.get(name).add(callback);
	}
};
stdLib.EventBus.prototype.removeEventListener = function (name, callback) {
	var listeners = this.eventListeners.get(name);
	if (listeners === undefined) {
		return;
	}
	listeners.delete(callback);
	if (listeners.size === 0) {
		this.eventListeners.delete(name)
	}
};