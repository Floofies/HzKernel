function Process(ppid, gen, args = null) {
	this.ppid = ppid;
	this.supervisor = false;
	this.generator = gen;
	this.arguments = args === null ? undefined : args;
	this.events = [];
}
function Dispatcher() {
	this.queue = new Queue();
	this.procs = new Map();
	this.pids = [];
	this.waiting = [];
	this.free = [];
	this.halt = true;
	this.running = false;
	this.highestPid = 0;
	this.scheduler = new Scheduler(this);
	this.eventListeners = new Map();
};
Dispatcher.prototype.start = function () {
	this.halt = false;
	this.run();
};
Dispatcher.prototype.halt = function () {
	this.halt = true;
};
Dispatcher.prototype.newPid = function () {
	return ++this.highestPid;
};
Dispatcher.prototype.propagateEvent = function (event) {
	const listeners = this.eventListeners.get(event);
	if (listeners !== undefined) {
		for (var listener in listeners) {
			listener.events.push(event);
			if (pid in this.scheduler.waiting && this.scheduler.waiting[pid] !== null) {
				this.scheduler.ready[pid] = this.scheduler.waiting[pid];
			}
		}
	}
};
Dispatcher.prototype.sysCallHandler = function (proc, sysCall) {
	switch (sysCall[0]) {
		case EVENT_WAIT:
			this.scheduler.waiting[proc.pid] = proc;
			this.scheduler.queue[loc] = null;
			this.scheduler.free.push(loc);
			break;
		case SYSTEM_HALT:
			this.halt();
			break;
		case KILL_PID:
			if (proc.supervisor) {
				this.queue[sysCall[1]] = null;
				this.free.push(sysCall[1]);
			}
			break;
		case KILL:
			this.queue[pid] = null;
			this.free.push(pid);
			break;
	}
};
Dispatcher.prototype.enqueue = function (process, args = null) {
	if (!(process instanceof Process)) {
		throw new TypeError("Scheduler.enqueue only accepts processes and arguments.");
	}
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
		this.procs.set(pid, process);
		this.pids.set(process, pid);
		this.queue.push(process);

	} catch (error) {
		console.error(error);
	}
};
Dispatcher.prototype.delegate = function () {
	const timings = [];
	var proc;
	_delegate: for (var loc = 0; proc = this.queue[loc], !this.halt && loc < this.queue.length; loc++) {
		if (proc === null) {
			continue;
		}
		timings[proc.pid] = process.hrtime();
		var sysCall = proc.instance.next(proc.events);
		timings[proc.pid] = process.hrtime(timings[proc.pid]);
		timings[proc.pid] = (timings[proc.pid][0] * 1e9) + timings[proc.pid][1];
		proc.events.length = 0;
		if (sysCall.done) {
			this.queue[loc] = null;
		}
		if (sysCall.value !== undefined) {
			this.sysCallHandler(sysCall.value);
		}
	}
	return timings;
};
Dispatcher.prototype.run = function () {
	if (!this.halt && this.procs.size > 0) {
		this.running = true;
	}
	_cycle: while (!this.halt && this.procs.size > 0) {
		this.scheduler.opt(this.queue, this.delegate());
	}
	this.running = false;
};
function Scheduler() {
	this.load = 0;
}
Scheduler.prototype.opt = function (queue, timings) {
	var loc = 0;
	queue.sort((proc1, proc2) => timings[proc1.pid] - timings[proc2.pid]);
};