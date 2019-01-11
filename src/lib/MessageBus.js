const d = require('differentia');
function MessageBus(limit = Number.MAX_SAFE_INTEGER) {
	this.messageConsumers = new Map();
	this.messageQueue = new d.DoubleLinkedList();
	this.queueLimit = limit;
	this.dispatcher = this.dispatchIterator();
}
MessageBus.prototype.dispatchIterator = function* (thisArg = null) {
	while (true) {
		if (this.messageQueue.size === 0 || this.messageConsumers.size === 0) {
			yield;
			continue;
		}
		const element = this.messageQueue.first();
		this.messageQueue.remove(element);
		const message = element.payload;
		for (const consumers of this.messageConsumers) {
			consumer.call(thisArg, message);
			yield;
		}
	}
};
MessageBus.prototype.publishMessage = function (message) {
	if (this.eventQueue.size === this.queueLimit) this.limitReached();
	this.messageQueue.push(message);
};
MessageBus.prototype.addConsumer = function (id, callback) {
	this.messageConsumers.set(id, callback);
};
MessageBus.prototype.removeConsumer = function (id) {
	this.messageConsumers.delete(id);
};
MessageBus.prototype.purgeConsumers = function () {
	this.messageConsumers.clear();
};
MessageBus.prototype.limitReached = function() {
	throw new Error("MessageBus Queue size limit reached. Could not publish additional message.");
};