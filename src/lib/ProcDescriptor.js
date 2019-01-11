function ProcDescriptor(image, nice = 0, ...args) {
	this.image = image;
	this.instance = image.apply(this, ...args);
	this.makespan = 0;
	this.makeflight = 0;
	this.quantum = 0;
	this.pid = null;
	this.killed = false;
	this.wait = false;
	this.sysCallResponse = null;
	this.lastSysCall = null;
	this.childPids = new Set();
	this.eventListeners = new Map();
	this.reNice(nice);
	this.dispatcher = this.dispatchIterator(image, args);
};
ProcDescriptor.prototype.reNice = function (nice) {
	/*
	Lower priority value indicates higher priority.
	Numbers from 0 to 99 are reserved for real-time processes and 100 to 139
	(mapped to nice ranges -20 to +19) are for normal processes.
	*/
	this.nice = nice;
	this.priority = 20 + nice;
};
module.exports = ProcDescriptor;