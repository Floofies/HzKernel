Kernel.prototype.ProcDescriptor = function (image) {
	this.image = image;
	this.mainThread = null;
	this.pid = null;
	this.waiting = false;
	this.waitForEvent = null;
	this.waitForTime = null;
	this.eventBus = null;
	this.dispatcher = null;
	this.childPids = null;
	this.threads = null;
	this.killed = false;
	this.idle = false;
	this.sysCallResponse = null;
	this.lastSysCall = null;
};
const ProcDescriptor = Kernel.prototype.ProcDescriptor;
ProcDescriptor.prototype.initialize = function (...args) {
	this.threads = new stdLib.CircularDoubleLinkedList();
	this.eventBus = new stdLib.EventBus();
	this.childPids = new Set();
	this.mainThread = this.execThread(this.helperThreads.main, ...args);
	this.dispatch();
	this.eventBus.dispatch(this);
};
ProcDescriptor.prototype.execThread = function (image, ...args) {
	const thread = image.apply(this, ...args);
	this.threads.add(thread);
	return thread;
};
ProcDescriptor.prototype.killThread = function (thread) {
	if (thread === mainThread) {
		this.killed = true;
	}
	this.threads.delete(thread);
};
ProcDescriptor.prototype.helperThreads = {
	eventReactor: function* () {
		while (true) {
			while (this.eventBus.eventQueue.size > 0) {
				yield this.eventBus.dispatcher.next();
			}
			yield;
		}
	},
	timeWait: function* () {
		while (true) {
			while (this.waiting && this.waitForTime !== null) {
				if (performance.now() >= this.waitForTime) {
					this.waitForTime = null;
					if (this.waitForEvent === null) {
						this.waiting = false;
					}
				}
			}
			yield;
		}
	},
	main: function* (instance) {
		var state;
		do {
			state = instance.next(this.sysCallResponse);
			this.sysCallResponse = null;
			if (state.done) {
				yield Kernel.SCI.KILL();
			}
			yield state.value;
		} while (!state.done);
	}
};
ProcDescriptor.prototype.dispatchIterator = function* () {
	var state;
	do {
		if (!this.waiting && !this.idle) {
			for (var queueElement of threads.values()) {
				var thread = equeueElement.payload;
				state = thread.next();
				if (this.killed) {
					break;
				}
				if (state.done) {
					this.killThread(thread);
					continue;
				}
				yield state.value;
			}
		}
		yield;
	} while (!this.killed);
};
ProcDescriptor.prototype.dispatch = function* () {
	this.dispatcher = this.dispatchIterator();
	return this.dispatcher;
};
ProcDescriptor.prototype.kill = function () {
	this.eventBus.eventQueue.clear();
	this.eventBus.eventListeners.clear();
	this.children.clear();
	this.threads.clear();
	stdLib.nullifyObject(this);
};