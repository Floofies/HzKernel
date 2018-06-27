const EventBus = require("./lib/EventBus.js");
const ProcDescriptor = require("./lib/scheduler/CoreScheduler.js").ProcDescriptor;
const SCI = require("./lib/SysCallInterface.js");
function Threader(Scheduler) {
	this.threads = new Map();
	this.eventBus = new EventBus(this);
	this.childPids = new Set();
	this.mainThread = null;
	this.curThread = null;
	this.dispatcher = this.dispatchIterator();
};
Threader.prototype.exec = function (image, ...args) {
	return this.enqueue(new ProcDescriptor(instance, ...args));
};
Threader.prototype.enqueue = function (procDescriptor) {
	const program = this.helperThreads.program(procDescriptor.instance);
	procDescriptor.program = program;
	if (this.mainThread === null) {
		this.mainThread = procDescriptor;
	}
	this.threads.add(procDescriptor);
	this.scheduler.enqueue(procDescriptor);
	return procDescriptor.instance;
};
Threader.prototype.killThread = function (procDescriptor) {
	const descriptor = procDescriptor;
	this.threads.delete(procDescriptor);
	const listeners = procDescriptor.eventListeners;
	for (const listener in listeners) {
		this.eventBus.removeEventListener(listener, listeners[listener]);
	}
	if (procDescriptor.childPids.size > 0) {
		for (const pid of procDescriptor.childPids) {
			this.killThread(this.threads.get(pid));
		}
	}
	this.scheduler.dequeue(procDescriptor);
	procDescriptor.childPids.clear();
	stdLib.nullifyObject(procDescriptor);
	descriptor.killed = true;
};
Threader.prototype.helperThreads = {
	program: function* (instance) {
		while (true) {
			const state = this.dispatcher.next(this.sysCallResponse);
			this.sysCallResponse = null;
			if (state.done) {
				yield SCI.KILL(this.pid);
				break;
			}
			yield state.value;
		}
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
	while (this.scheduler.queue.size > 0) {
		this.curThread = this.scheduler.getNext();
		const state = this.curThread.program.next();
		if (state.done) {
			yield SCI.KILL(this.curThread.pid);
			break;
		}
		yield state.value;
	};
};