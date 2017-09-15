function Scheduler() {
	this.supervisors = [];
	this.queue = [];
	this.free = [];
	this.waiting = [];
	this.ready = [];
	this.halt = true;
	this.highestPid = 0;
}
Scheduler.prototype.newPid = function () {
	this.highestPid++;
	return this.highestPid;
};
Scheduler.prototype.exec = function (gen, args = null) {
	const pid = this.newPid();
	this.queue[pid] = {
		pid: pid,
		generator: gen,
		instance: gen(args),
		events: []
	};
};
Scheduler.prototype.propagateEvent = function (event) {
	if (event.name in this.eventListeners) {
		for (var listener in this.eventListeners[event.name]) {
			if (!(pid in this.queue)) {
				continue;
			}
			this.queue[pid].events.push(event);
			if (pid in this.waiting && this.waiting[pid] !== null) {
				this.ready[pid] = this.waiting[pid];
			}
		}
	}
}
Scheduler.prototype.run = function () {
	_cycle: while (!this.halt) {
		var activePids = Object.keys(this.queue).filter((value, accessor) => accessor !== null);
		var loc = 0;
		var supervisor = false;
		for (var pid = activePids[0]; !this.halt && loc < activePids.length; loc++) {
			pid = activePids[loc];
			supervisor = pid in this.supervisors;
			var sysCall = this.queue[pid].instance.next(this.queue[pid].events);
			this.queue[pid].events.length = 0;
			if (sysCall.done) {
				this.queue[pid] = null;
			}
			if (sysCall.value === undefined) {
				continue;
			}
			switch (sysCall.value[0]) {
				case DISPATCHER_WAIT:
					this.waiting[pid] = sysCall[1];
					break;
				case SCHEDULER_STOP:
					this.stop();
					break;
				case KILL_PID:
					if (supervisor) {
						this.queue[sysCall[1]] = null;
						this.free.push(sysCall[1]);
					}
					break;
				case KILL:
					this.queue[pid] = null;
					this.free.push(pid);
					break;
			}
		}
	}
};
Scheduler.prototype.start = function () {
	this.halt = false;
	this.run();
};
Sheduler.prototype.stop = function () {
	this.halt = true;
};

function Dispatcher() {

}
Dispatcher.prototype.delegate = function (pid) {

};
Dispatcher.prototype.