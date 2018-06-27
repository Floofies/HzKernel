const CoreScheduler = require("./CoreScheduler.js");
const d = require("differentia");
function RRScheduler(quantum) {
	this.quantum = quantum;
	this.queue = new d.CircularDoubleLinkedList();
	this.dispatcher = this.dispatchIterator();
}
RRScheduler.prototype = Object.create(CoreScheduler.prototype);
RRScheduler.prototype.getNext = function () {
	if (this.queue.size > 0) return this.dispatcher.next().value;
	return null;
};
RRScheduler.prototype.dispatchIterator = function* () {
	for (const procDescriptor of this.queue[Symbol.iterator](true)) {
		while (procDescriptor.makeflight < this.quantum) {
			yield element;
		}
	}
};