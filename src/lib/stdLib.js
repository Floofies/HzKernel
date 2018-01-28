const stdLib = {};
Object.assign(stdLib, differentia);
Kernel.prototype.stdLib = stdLib;
stdLib.compose = (...funcs) =>
	initValue => funcs.reduce(
		(value, func) => func(value),
		initValue
	);
stdLib.randStr = stdLib.compose(
	() => Math.floor((1 + Math.random()) * 0x10000),
	int => int.toString(8),
	str => str.substring(1)
);
stdLib.bindAssign = function (thisArg, toObj, ...objects) {
	for (var obj of objects) {
		for (var prop in obj) {
			toObj[prop] = (typeof obj[prop]) === "function" ? obj[prop].bind(thisArg) : obj[prop];
		};
	}
	return toObj;
};
stdLib.nullifyObject = function (obj) {
	Object.keys(obj).forEach(prop => obj.prop = null);
};
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
stdLib.CoreScheduler = function () {
	this.dispatcher = this.dispatchIterator();
};
stdLib.CoreScheduler.prototype.ProcData = function (proc) {
	this.proc = proc;
	this.makeflight = 0;
	this.quantum = 0;
};
stdLib.CoreScheduler.prototype.enqueue = function (procData) {
	if (!(procData instanceof this.ProcData)) {
		procData = new this.ProcData(procData);
	}
	this.queue.add(procData.queueElement);
};
stdLib.CoreScheduler.prototype.dequeue = function (procData) {
	this.queue.delete(procData.queueElement);
};
stdLib.FairScheduler = function () {
		this.queue = new stdLib.RedBlackTree();
};
stdLib.FairScheduler.prototype = Object.create(stdLib.CoreScheduler.prototype);

stdLib.FairScheduler.prototype.ProcData = function (proc) {
	stdLib.CoreScheduler.ProcData.call(this, proc);
	this.queueElement = new stdLib.RedBlackTree.TreeElement(this);
};
stdLib.FairScheduler.prototype.dispatchIterator = function* () {
	var procData;
	var queueElement;
	while (this.queue.size > 0) {
		queueElement = this.queue.getMin();
		procData = queueElement.payload;
		this.queue.delete(queueElement);
		yield procData;
		if (!procData.killed) {
			this.queue.add(queueElement);
		}
	}
};
stdLib.FairScheduler.prototype.pickNext = function () {
	return this.dispatcher.next().value;
};
stdLib.RealtimeScheduler = function () {

};
stdLib.RealtimeScheduler.prototype = Object.create(stdLib.Scheduler.prototype);
stdLib.BackgroundScheduler =function () {

};
stdLib.BackgroundScheduler.prototype = Object.create(stdLib.Scheduler.prototype);