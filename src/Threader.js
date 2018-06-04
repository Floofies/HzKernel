function Threader() {
	this.mainThread = null;
	this.eventBus = null;
	this.dispatcher = null;
	this.threads = null;
};
Threader.prototype.initialize = function (...args) {
	this.threads = new stdLib.CircularDoubleLinkedList();
	this.eventBus = new stdLib.EventBus();
	this.childPids = new Set();
	this.mainThread = this.execThread(this.helperThreads.main, ...args);
	this.dispatch();
	this.eventBus.dispatch(this);
};
Threader.prototype.execThread = function (image, ...args) {
	const thread = image.apply(this, ...args);
	this.threads.add(thread);
	return thread;
};
Threader.prototype.killThread = function (thread) {
	if (thread === mainThread) {
		this.killed = true;
	}
	this.threads.delete(thread);
};
Threader.prototype.helperThreads = {
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
	},
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
	}
};
Threader.prototype.dispatchIterator = function* () {
	var state;
	do {
		if (!this.waiting && !this.idle) {
			startTime = performance.now();
			for (var queueElement of threads.values()) {
				var thread = equeueElement.payload;
				state = thread.next();
				this.makeflight = performance.now() - procStartTime;
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
Threader.prototype.dispatch = function* () {
	this.dispatcher = this.dispatchIterator();
	return this.dispatcher;
};