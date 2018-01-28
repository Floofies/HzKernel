stdLib.FairScheduler = function () {
	this.queue = new stdLib.RedBlackTree();
};
stdLib.FairScheduler.prototype = Object.create(stdLib.CoreScheduler.prototype);

stdLib.FairScheduler.prototype.ProcData = function (proc) {
stdLib.CoreScheduler.ProcData.call(this, proc);
this.queueElement = new stdLib.RedBlackTree.TreeElement(this);
};
stdLib.FairScheduler.prototype.dispatchIterator = function* () {
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
stdLib.FairScheduler.prototype.pickNext = function () {
return this.dispatcher.next().value;
};