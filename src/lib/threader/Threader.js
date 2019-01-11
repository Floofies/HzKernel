const EventBus = require("./EventBus.js");
const ProcDescriptor = require("../ProcDescriptor.js");
const SCI = require("../SysCallInterface.js");
const helpers = require("./helpers.js");
function Threader(Scheduler) {
	this.scheduler = new Scheduler();
	this.eventBus = new EventBus(this);
	this.threads = new Map();
	this.mainThread = null;
	this.curThread = null;
	this.dispatcher = this.dispatchIterator();
};
Threader.prototype.exec = function (image, ...args) {
	return this.enqueue(new ProcDescriptor(instance, ...args));
};
Threader.prototype.enqueue = function (proc) {
	const task = helpers.task(proc.instance);
	proc.task = task;
	if (this.mainThread === null) this.mainThread = proc;
	this.threads.set(proc.pid, proc);
	this.scheduler.enqueue(proc);
	return proc.instance;
};
Threader.prototype.killThread = function (proc) {
	this.threads.delete(proc);
	const listeners = proc.eventListeners;
	for (const listener in listeners) {
		this.eventBus.removeEventListener(listener, listeners[listener]);
	}
	if (proc.childPids.size > 0) {
		for (const pid of proc.childPids) {
			this.killThread(this.threads.get(pid));
		}
	}
	this.scheduler.dequeue(proc);
	proc.childPids.clear();
	stdLib.nullifyObject(proc);
	descriptor.killed = true;
};
Threader.prototype.dispatchIterator = function* () {
	while (this.scheduler.queue.size > 0) {
		this.curThread = this.scheduler.getNext();
		const state = this.curThread.task.next();
		if (state.done) {
			yield SCI.KILL(this.curThread.pid);
			break;
		}
		yield state.value;
	};
};
module.exports = Threader;