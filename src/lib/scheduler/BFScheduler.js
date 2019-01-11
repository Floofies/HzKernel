// Based on the Brain Fuck Scheduler by Con Kolivas.
// Runs a task with the earliest effective virtual deadline first.
const CoreScheduler = require("./CoreScheduler.js");
const utils = require("../utils.js");
const d = require("differentia");
function BFScheduler(quantum = 6) {
	this.quantum = quantum;
	/*
	The vanilla BFS implementation maintains 100 runqueues of realtime
	tasks, each correspond to a different realtime priority where the first
	runqueue is the most prioritized one and the last one is the least prioritized. 
	*/
	this.realtimeQueues = new d.CircularDoubleLinkedList();
	utils.callbackFill(this.rtQueues, _ => new d.CircularDoubleLinkedList(), 0, 99);
	this.normalQueue = new d.CircularDoubleLinkedList();
	this.idleQueue = new d.CircularDoubleLinkedList();
	this.isoQueue = new d.CircularDoubleLinkedList();
	this.runnables = [];
	utils.callbackFill(this.runnables, _ => new d.CircularDoubleLinkedList(), 0, 103);
	this.dispatcher = this.dispatchIterator();
}
BFScheduler.prototype.QueueElement = (..._) => new d.CircularDoubleLinkedList.ListElement(..._);
BFScheduler.prototype = Object.create(CoreScheduler.prototype);
BFScheduler.prototype.enqueue = function (proc, realtime = false) {
	if (proc.priority < 100) {
		this.realtimeQueues.item(proc.priority).push(proc);
	} else {
		this.normalQueue.push(proc);
	}
};
BFScheduler.prototype.getNext = function () {
	const state = this.dispatcher.next();
	if (state.done) return null;
	return state.value;
};
BFScheduler.prototype.needPreempt = function (proc) {
	return proc.makeflight >= this.quantum;
};
BFScheduler.prototype.dispatchIterator = function* () {
	// All queues are run in FCFS mode
	for (const priorityGroup of runnables) {
		if (priorityGroup.size === 0) {
			yield null;
			continue;
		}
		for (const proc of priorityGroup) {
			while (true) {
				const state = this.curQueue.next();
				if (state.done) break;
				const proc = state.value;
				while (proc.makeflight < this.quantum) {
					if (proc.killed) {
						this.dequeue(proc);
						break;
					}
					yield proc;
				}
			}
		}
	}
};