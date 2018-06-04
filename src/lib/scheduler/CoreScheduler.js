CoreScheduler = function () {
	this.dispatcher = this.dispatchIterator();
};
CoreScheduler.prototype.ProcData = function (proc) {
	this.descriptor = proc;
	this.makeflight = 0;
	this.quantum = 0;
	this.killed = false;
};
CoreScheduler.prototype.ProcData.prototype.delegate = function () {

};
CoreScheduler.prototype.enqueue = function (procData) {
	if (!(procData instanceof this.ProcData)) {
		procData = new this.ProcData(procData);
	}
	this.queue.add(procData.queueElement);
};
CoreScheduler.prototype.dequeue = function (procData) {
	this.queue.delete(procData.queueElement);
};
FairScheduler.prototype.dispatchIterator = function* () {
	var procData;
	var queueElement;
	while (this.queue.size > 0) {
		queueElement = this.queue.getNext();
		procData = queueElement.payload;
		this.queue.delete(queueElement);
		yield procData;
		if (!procData.killed) {
			this.queue.add(queueElement);
		}
	}
};