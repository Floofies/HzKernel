function Process(ppid, gen, args = null) {
	this.ppid = ppid;
	this.supervisor = false;
	this.generator = gen;
	this.arguments = args;
	this.childProcs = new Set();
	this.childPids = [];
	this.events = [];
	this.waiting = false;
	this.waitingOn = new Set();
	this.makespan = infinity;
}
Process.prototype.spawnChild = function (gen, args = null) {
	const child = new Process(this.pid, gen, args);
	this.supervisor.exec(child);
	this.childPids[child.pid] = child;
	this.childProcs.add(child);
};
function Supervisor(args = null) {
	Process.constructor.call(this, 0, null, args);
	this.supervisor = true;
}
Supervisor.prototype = Object.new(Process.prototype);
Supervisor.prototype.generator = function* (args) {

};
Supervisor.prototype.exec = function (proc) {

};
function Dispatcher(scheduler) {
	this.halt = true;
	this.running = false;
	this.scheduler = scheduler;
	this.eventListeners = new Map();
};
Dispatcher.prototype.start = function () {
	this.halt = false;
	this.run();
};
Dispatcher.prototype.halt = function () {
	this.halt = true;
};
Dispatcher.prototype.propagateEvent = function (event) {
	const listeners = this.eventListeners.get(event);
	if (listeners === undefined) {
		return;
	}
	for (var proc in listeners) {
		listener.events.push(event);
		if (!proc.waiting || !proc.waitingOn.has(event)) {
			continue;
		}
		proc.waitingOn.delete(event);
		if (proc.waitingOn.size === 0) {
			proc.waiting = false;
		}
	}
};
Dispatcher.prototype.sysCallHandler = function (proc, sysCall) {
	switch (sysCall[0]) {
		case EXEC:

			break;
		case EVENT_WAIT:
			proc.waiting = true;
			proc.waitingOn.push(sysCall[1]);
			break;
		case SYSTEM_HALT:
			this.halt();
			break;
		case KILL_PID:
			if (proc.supervisor || this.pids[sysCall[1]].ppid === proc.pid) {
				this.killed.push(sysCall[1]);
			}
			break;
		case KILL:
			this.killed.push(proc.pid);
			break;
	}
};
Dispatcher.prototype.delegate = function () {
	const timings = [];
	var proc;
	_delegate: for (
		var loc = 0;
		proc = this.queue[loc],
		!this.halt && loc < this.queue.length;
		loc++
	) {
		if (proc === null || proc === undefined || proc.waiting) {
			continue;
		}
		proc.makespan = process.hrtime();
		var sysCall = proc.instance.next(proc.events);
		proc.makespan = process.hrtime(proc.makespan);
		proc.makespan = (proc.makespan[0] * 1e9) + proc.makespan[1];
		proc.events.length = 0;
		if (sysCall.done) {
			this.queue[loc] = null;
		}
		if (sysCall.value !== undefined) {
			this.sysCallHandler(sysCall.value);
		}
		if (this.killed.length > 0) {
			var proc;
			for (var loc = 0; proc = this.killed[loc], loc < this.killed; loc++) {
				this.queue
			}
		}
	}
	return timings;
};
Dispatcher.prototype.run = function (queue) {
	if (!this.halt && queue.length > 0) {
		this.running = true;
	}
	_cycle: while (!this.halt && queue.length > 0) {
		this.delegate(queue);
		this.scheduler.shortOpt(queue);
	}
	this.running = false;
};
function Scheduler() {
	this.queue = [];
	this.procs = new Set();
	this.pids = new Map();
	this.waiting = new Set();
	this.free = new Set();
	this.killed = [];
	this.highestPid = 0;
	this.dispatcher = new Dispatcher(this);
	this.supervisor = new Supervisor();
	this.enqueue(this.supervisor);
}
Scheduler.prototype.newPid = function () {
	return ++this.highestPid;
};
Scheduler.prototype.enqueue = function (process, args = null) {
	try {
		const parentProc = this.pids.get(process.ppid);
		if (parentProc === undefined) {
			throw new TypeError("Cannot start new process; parent PID is invalid!");
		}
		if (parentProc.supervisor) {
			process.supervisor = true;
		}
		process.instance = process.generator();
		const pid = this.newPid();
		this.procs.add(process);
		this.pids.set(pid, process);
		this.queue.push(process);

	} catch (error) {
		console.error(error);
	}
};
Scheduler.prototype.shortOpt = function (queue) {
	queue.sort(function (proc1, proc2) {
		return proc1.makespan - proc2.makespan;
	});
};
Scheduler.prototype.longOpt = function (queue) {

};