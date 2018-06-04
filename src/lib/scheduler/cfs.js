const CoreScheduler = require("./CoreScheduler.js");
const d = require("differentia");
FairScheduler = function () {
	this.queue = new d.structs.RedBlackTree();
};
FairScheduler.prototype = Object.create(CoreScheduler.prototype);
FairScheduler.prototype.ProcData = function (proc) {
	CoreScheduler.prototype.ProcData.call(this, proc);
	this.queueElement = new RedBlackTree.TreeElement(this);
};
FairScheduler.prototype.dispatchIterator = function* () {
	var procData;
	var queueElement;
	while (this.queue.size > 0) {
		queueElement = this.queue.getMin();
		procData = queueElement.payload;
		this.queue.delete(queueElement);
		yield procData;
		if (!procData.killed) {
			this.queue.add(queueElement);
		}
	}
};
FairScheduler.prototype.pickNext = function () {
	return this.dispatcher.next().value;
};