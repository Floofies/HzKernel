function ProcDescriptor(image) {
	this.image = image;
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
ProcDescriptor.prototype.initialize = function (...args) {
	this.childPids = new Set();
	this.threader = new Threader(this.image);
	this.threader.initialize(...args);
	this.dispatch();
};
ProcDescriptor.prototype.dispatchIterator = function* () {
	var state;
	do {
		if (!this.waiting && !this.idle) {
			startTime = performance.now();
			state = this.threader.dispatch.next()
			this.makeflight = performance.now() - procStartTime;
			if (this.killed) {
				break;
			}
			if (state.done) {
				this.threader.killThread(thread);
				continue;
			}
			yield state.value;
		}
		yield;
	} while (!this.killed && !state.done);
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