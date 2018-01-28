stdLib.CoreScheduler = function () {
	this.dispatcher = this.dispatchIterator();
};
stdLib.CoreScheduler.prototype.ProcData = function (proc) {
	this.proc = proc;
	this.makeflight = 0;
	this.quantum = 0;
};
stdLib.CoreScheduler.prototype.enqueue = function (procData) {
	if (!(procData instanceof this.ProcData)) {
		procData = new this.ProcData(procData);
	}
	this.queue.add(procData.queueElement);
};
stdLib.CoreScheduler.prototype.dequeue = function (procData) {
	this.queue.delete(procData.queueElement);
};