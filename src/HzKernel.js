const EventBus = require("./lib/EventBus.js");
const Threader = require("./lib/threader/Threader.js");
function Kernel(shceduler, interrupt = null) {
	this.threader = new Threader(scheduler);
	this.irq = _ => this.threader.scheduler.needPreempt();
	this.eventBus = new EventBus();
	this.procs = new Map();
	this.running = false;
	this.highestPid = 0;
	this.SCP = stdLib.bindAssign(this, {}, this.prototype.SCP);
	this.sysCallProcedures = this.SCP;
	this.dispatcher = this.dispatchIterator(interrupt);
}
Kernel.prototype.errors = {
	PID_NOPROC: function (pid) {
		this.message = "No ProcDescriptor was found for PID \"" + pid + "\"";
		this.name = "PID_NOPROC_ERR";
	},
	PID_INVALID: function (pid) {
		this.message = "The given PID, \"" + pid + "\" is invalid";
		this.name = "PID_INVALID";
	},
	SYSCALL_NOCALL: function (pid, call) {
		this.message = "The system call \"" + String(call) + "\" was not found for PID \"" + pid + "\"";
		this.name = "SYSCALL_NOCALL_ERR";
	},
	SYSCALL_NOPROC: function (pid, call) {
		this.message = "PID \"" + pid + "\" ran system call \"" + String(call) + "\", but the process was terminated.";
		this.name = "SYSCALL_NOPROC_ERR";
	}
};
for (const error in Kernel.prototype.errors) {
	Kernel.prototype.errors[error].prototype = Object.create(Error.prototype);
}
Kernel.prototype.throw = function (errorName) {
	if (!(errorName in this.errors)) throw new Error("HzKernel Error \"" + String(errorName) + "\" was not found.");
	throw new this.errors[errorName](pid);
};
Kernel.prototype.sysCallProcedures = {
	EXEC: function (image, ...args) {
		const proc = new stdLib.CoreScheduler.ProcDescriptor(_ => this.irq, image, ...args);
		proc.pid = ++this.highestPid;
		this.threader.enqueue(proc);
		this.procs.set(proc.pid, proc);
		return proc.pid;
	},
	EXEC_CHILD: function (parentProc, image, ...args) {
		const pid = this.SCP.EXEC(image, ...args);
		parentProc.childPids.add(pid);
		return pid;
	},
	EXEC_TASKLET: function (parentProc, handlerImage, ...args) {
		parentProc.wait = true;
		this.SCP.EXEC(function* () {
			yield* handlerImage.apply(this, ...args);
			parentProc.wait = false;
		});
	},
	FORK: function (proc, ...args) {
		return this.SCP.EXEC(proc.image, ...args);
	},
	FORK_PID: function (pid, ...args) {
		const proc = this.procs.get(pid);
		if (proc === undefined) throw new this.errors.PID_NOPROC_ERR(pid);
		return this.SCP.FORK(proc, ...args);
	},
	FORK_CHILD: function (parentProc, proc, ...args) {
		const pid = this.SCP.FORK(proc, ...args);
		parentProc.childPids.add(pid);
		return pid;
	},
	FORK_PID_CHILD: function (parentProc, pid, ...args) {
		const proc = this.procs.get(pid);
		if (proc === undefined) throw new this.errors.PID_NOPROC_ERR(pid);
		return this.SCP.FORK_CHILD(parentProc, proc, ...args);
	},
	EMIT_EVENT: function (name, value) {
		this.eventBus.publishEvent(name, value);
	},
	TIME_WAIT: function (waitTime, proc) {
		proc.wait = true;
		proc.waitForTime = performance.now() + waitTime;
	},
	EVENT_LISTEN: function (name, callback, proc) {
		this.threader.eventBus.addEventListener(name, callback);
	},
	KERN_EVENT_LISTEN: function (name, callback, proc) {
		this.SCP.EVENT_LISTEN(name, callback, proc);
		this.eventBus.addEventListener(name, event => this.threader.eventBus.publishEvent(event));
	},
	EVENT_WAIT: function (name, proc) {
		proc.wait = true;
		this.SCP.EVENT_LISTEN(name, function (event) {
			proc.wait = false;
			proc.sysCallResponse = event;
		}, proc);
	},
	KERN_EVENT_WAIT: function (name, proc) {
		this.SCP.EVENT_WAIT(name, proc);
		this.eventBus.addEventListener(name, event => this.threader.eventBus.publishEvent(event));
	},
	TASKLET_EVENT_LISTEN: function (name, handler, proc, ...args) {
		this.SCP.EVENT_LISTEN(name, function () {
			proc.wait = true;
			this.SCP.EXEC_TASKLET(handler, proc, ...args);
		}, proc);
	},
	KERN_TASKLET_EVENT_LISTEN: function (name, handler, proc, ...args) {
		this.SCP.KERN_EVENT_LISTEN(name, function () {
			proc.wait = true;
			this.SCP.EXEC_TASKLET(handler, proc, ...args);
		}, proc);
	},
	HALT: function () {
		this.running = false;
	},
	KILL: function (pid) {
		proc.killed = true;
		const proc = this.procs.get(pid);
		if (proc === undefined) throw new this.errors.PID_NOPROC_ERR(pid);
		for (const pid of this.proc.childPids.values()) this.SCP.KILL_PID(pid);
		this.procs.delete(proc.pid);
		proc.kill();
	}
};
Kernel.prototype.SCP = Kernel.prototype.sysCallProcedures;
Kernel.prototype.sysCall = function (sysCall, proc) {
	proc.lastSysCall = sysCall;
	if (!(syscall.name in this.SCP)) this.throw("SYSCALL_NOCALL");
	proc.sysCallResponse = this.SCP[sysCall.name](...sysCall.args);
};
Kernel.prototype.Event = function (name, value) {
	this.name = name;
	this.value = value;
};
Kernel.prototype.runSync = function () {
	while (this.running && !this.interrupt && !this.dispatcher.next().done);
};
Kernel.prototype.runAsync = function () {
	if (!this.running || this.dispatcher.next().done) return;
	setTimeout(this.runAsync, 0);
};
Kernel.prototype.dispatchIterator = function* (interrupt = null) {
	this.running = true;
	cycle: while (this.running === true) {
		const state = this.threader.dispatcher.next();
		if (state.done) {
			this.killProc(this.threader.curThread);
			break;
		} else if (state.value !== undefined) {
			this.sysCall(state.value, this.threader.curThread.descriptor);
		}
		if (this.interrupt || (interrupt !== null && interrupt())) {
			this.interrupt = false;
			yield;
		}
	}
	this.running = false;
	this.curElement = null;
	this.curProc = null;
};
module.exports = Kernel;