const EventBus = require("./lib/EventBus.js");
const Threader = require("./lib/Threader.js");
function Kernel(interrupt = null) {
	this.threader = new Threader();
	this.procs = new Map();
	this.running = false;
	this.eventBus = new EventBus();
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
	SYSCALL_NOCALL: function (pid, call) {
		this.message = "The system call \"" + String(call) + "\" was not found for PID \"" + pid + "\"";
		this.name = "SYSCALL_NOCALL_ERR";
	}
};
for (const error in Kernel.prototype.errors) {
	Kernel.prototype.errors[error].prototype = Object.create(Error.prototype);
}
Kernel.prototype.throw = function (errorName, pid) {
	if (!(errorName in this.errors)) throw new Error("Kernel Error \"" + String(errorName) + "\" was not found. (requested by PID \"" + pid + "\")");
	throw new this.errors[errorName](pid);
};
Kernel.prototype.Event = function (name, value) {
	this.name = name;
	this.value = value;
};
Kernel.prototype.dispatchEvent = function (name, value) {
	this.eventBus.publishEvent(name, value);
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
Kernel.prototype.runSync = function () {
	run: while (this.running && !this.interrupt && !this.dispatcher.next().done);
};
Kernel.prototype.runAsync = function () {
	if (!this.running || this.dispatcher.next().done) return;
	setTimeout(this.runAsync, 0);
};
Kernel.prototype.stop = function () {
	this.running = false;
};
Kernel.prototype.exec = function (image, ...args) {
	const procDescriptor = new stdLib.CoreScheduler.ProcDescriptor(proc, ...args);
	procDescriptor.pid = ++this.highestPid;
	this.threader.enqueue(procDescriptor);
	this.procs.set(procDescriptor.pid, procDescriptor);
	return procDescriptor.pid;
};
Kernel.prototype.killProc = function (procDescriptor) {
	if (!procDescriptor.killed) {
		for (const pid of this.procDescriptor.childPids.values()) {
			this.SCP.KILL_PID(pid);
		}
		this.procs.delete(procDescriptor.pid);
		procDescriptor.kill();
		procDescriptor.killed = true;
	}
};
Kernel.prototype.sysCall = function (sysCall, procDescriptor) {
	procDescriptor.lastSysCall = sysCall;
	procDescriptor.sysCallResponse = this.SCP[sysCall[0]](sysCall[1]);
};
Kernel.prototype.sysCallProcedures = {
	EXEC: function (image, ...args) {
		return this.exec(image, ...args);
	},
	EXEC_CHILD: function (image, ...args) {
		const pid = this.SCP.EXEC(image, ...args);
		this.curProc.childPids.add(pid);
		return pid;
	},
	FORK: function (...args, procDescriptor) {
		return this.SCP.EXEC(procDescriptor.image, ...args);
	},
	FORK_PID: function (pid, ...args) {
		const procDescriptor = this.procs.get(pid);
		if (procDescriptor === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		return this.SCP.EXEC(procDescriptor.image, ...args);
	},
	FORK_CHILD: function (...args, procDescriptor) {
		const pid = this.SCP.FORK(...args);
		procDescriptor.childPids.add(pid);
		return pid;
	},
	FORK_PID_CHILD: function (...args, procDescriptor) {
		const procDescriptor = this.procs.get(pid);
		if (procDescriptor === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		const pid = this.SCP.EXEC(procDescriptor.image, ...args);
		procDescriptor.childPids.add(pid);
		return pid;
	},
	EMIT_EVENT: function (name, value) {
		this.dispatchEvent(name, value);
	},
	TIME_WAIT: function (waitTime, procDescriptor) {
		procDescriptor.waiting = true;
		procDescriptor.waitForTime = performance.now() + waitTime;
	},
	EVENT_WAIT: function (name, procDescriptor) {
		procDescriptor.waiting = true;
		procDescriptor.waitForEvent = name;
		procDescriptor.eventBus.addEventListener(function (event) {
			this.waitForEvent = null;
			this.sysCallResponse = event;
			if (this.waitForTime === null) this.waiting = false;
		});
	},
	EVENT_LISTEN: function (name, callback, procDescriptor) {
		this.eventBus.addEventListener(name, procDescriptor.eventBus.publishEvent);
	},
	HALT: function () {
		this.stop();
	},
	KILL: function (pid) {
		const procDescriptor = this.procs.get(pid);
		if (procDescriptor === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		this.killProc(procDescriptor);
	}
};
Kernel.prototype.SCP = Kernel.prototype.sysCallProcedures;
Kernel.prototype.sysCallInterface = {};
Kernel.prototype.SCI = Kernel.prototype.sysCallInterface;
for (const name in Kernel.prototype.SCP) {
	Kernel.prototype.SCI[name] = (...args) => [name, args];
}
module.exports = Kernel;