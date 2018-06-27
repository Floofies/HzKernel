function CoreScheduler() {
	this.dispatcher = null;
	this.queue = null;
};
CoreScheduler.prototype.ProcDescriptor = function (image, ...args) {
	this.makespan = 0;
	this.makeflight = 0;
	this.quantum = 0;
	this.image = image;
	this.pid = null;
	this.waiting = false;
	this.waitForEvent = null;
	this.waitForTime = null;
	this.killed = false;
	this.idle = false;
	this.sysCallResponse = null;
	this.lastSysCall = null;
	this.childPids = new Set();
	this.eventListeners = new Map();
	this.dispatcher = this.dispatchIterator();
};
CoreScheduler.prototype.ProcDescriptor.prototype.dispatchIterator = function* () {
	while (!this.killed) {
		if (this.waiting || this.idle) {
			yield;
			continue;
		}
		const startTime = performance.now();
		const state = this.instance.next();
		this.makeflight = performance.now() - startTime;
		this.makespan += this.makeflight;
		if (this.killed || state.done) break;
		yield state.value;
	}
};
CoreScheduler.ProcDescriptor = CoreScheduler.prototype.ProcDescriptor;
CoreScheduler.prototype.enqueue = function (procDescriptor) {
	if (!(procDescriptor instanceof this.ProcDescriptor)) {
		procDescriptor = new this.ProcDescriptor(procDescriptor);
	}
	procDescriptor.queueElement = new this.QueueElement(procDescriptor);
	this.queue.add(procDescriptor.queueElement);
};
CoreScheduler.prototype.dequeue = function (procDescriptor) {
	this.queue.delete(procDescriptor.queueElement);
};
CoreScheduler.prototype.dispatchIterator = function* () {
	while (this.queue.size > 0) {
		const queueElement = this.getNext();
		const procDescriptor = queueElement.payload;
		yield procDescriptor;
		if (!procDescriptor.killed) this.queue.add(queueElement);
	}
};