const CoreScheduler = require("./CoreScheduler.js");
const d = require("differentia");
function RRScheduler(quantum = 6) {
	this.quantum = quantum;
	this.queue = new d.CircularDoubleLinkedList();
	this.dispatcher = this.dispatchIterator();
}
RRScheduler.prototype.QueueElement = (..._) => new d.CircularDoubleLinkedList.ListElement(..._);
RRScheduler.prototype = Object.create(CoreScheduler.prototype);
RRScheduler.prototype.getNext = function () {
	if (this.queue.size > 0) return this.dispatcher.next().value;
	return null;
};
RRScheduler.prototype.needPreempt = function () {
	return this.curProc.makeflight >= this.quantum;
};
RRScheduler.prototype.dispatchIterator = function* () {
	for (const proc of this.queue[Symbol.iterator](true)) {
		this.curProc = proc;
		while (proc.makeflight < this.quantum) {
			yield element;
		}
	}
};