const ProcDescriptor = require("../ProcDescriptor.js");
function CoreScheduler() {
	this.dispatcher = null;
	this.queue = null;
};
CoreScheduler.prototype.enqueue = function (proc, nice = 0, ...args) {
	if (!(proc instanceof this.ProcDescriptor)) {
		proc = new this.ProcDescriptor(proc, nice, ...args);
	}
	proc.queueElement = new this.QueueElement(proc);
	this.queue.add(proc.queueElement);
};
CoreScheduler.prototype.dequeue = function (proc) {
	this.queue.delete(proc.queueElement);
};
CoreScheduler.prototype.dispatchIterator = function* () {
	while (this.queue.size > 0) {
		const queueElement = this.getNext();
		const proc = queueElement.payload;
		if (proc.killed) this.dequeue(proc);
		yield proc;
	}
};
module.exports = CoreScheduler;