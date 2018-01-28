function Kernel() {
	this.scheduler = new stdLib.Scheduler();
	this.procs = new Map();
	this.running = false;
	this.eventBus = new stdLib.EventBus();
	this.curElement = null;
	this.curProc = null;
	this.highestPid = 0;
	this.sysCallProcedures = stdLib.bindAssign(this, {}, this.prototype.SCP);
	this.SCP = this.sysCallProcedures;
}
Kernel.prototype.errors = {
	PID_NOPROC_ERR: function (pid) {
		this.message = "No ProcDescriptor was found for PID \"" + pid + "\"";
		this.name = "PID_REF_ERR";
	}
};
const errorNames = Object.keys(Kernel.prototype.errors);
errorNames.forEach(
	name => Kernel.prototype.errors[name].prototype = Error.prototype
);
Kernel.prototype.Event = function (name, value) {
	this.name = name;
	this.value = value;
};
Kernel.prototype.dispatchEvent = function (name, value) {
	this.eventBus.publishEvent(name, value);
};
Kernel.prototype.dispatch = function () {
	this.running = true;
	var procStartTime = 0;
	var procState = null;
	_cycle: for (this.curProcData of this.scheduler[Symbol.iterator]()) {
		if (this.running === false) {
			break;
		}
		this.curProc = this.curProcData.proc;
		procStartTime = performance.now();
		this.curProc.makeflight = 0;
		_delegate: while ((this.curProcData.quantum / this.curProcData.makeflight) >= 1) {
			var procState = this.curProc.dispatchIterator.next();
			this.curProcData.makeflight = performance.now() - procStartTime;
			if (procState.done) {
				this.killProc(this.curProcData);
				continue _cycle;
			} else if (procState.value !== undefined) {
				this.sysCall(instanceState.value);
			}
		}
	}
	this.running = false;
	this.curElement = null;
	this.curProc = null;
};
Kernel.prototype.run = function () {
	if (this.running) {
		return;
	}
	this.dispatch();
};
Kernel.prototype.stop = function () {
	this.running = false;
};
Kernel.prototype.exec = function (image, ...args) {
	varproc = new this.ProcDescriptor(image);
	var procData = new stdLib.Scheduler.ProcData(proc);
	proc.initialize(args);
	proc.pid = ++this.highestPid;
	this.scheduler.enqueue(procData);
	this.procs.set(proc.pid, procData);
	return proc.pid;
};
Kernel.prototype.killProc = function (procData) {
	const proc = procData.procDescriptor;
	if (!proc.killed) {
		for (var pid of this.proc.childPids.values()) {
			this.SCP.KILL_PID(pid);
		}
		this.procs.delete(proc.pid);
		proc.kill();
		procData.killed = true;
	}
};
Kernel.prototype.sysCall = function (sysCall) {
	this.curProc.lastSysCall = sysCall;
	this.curProc.sysCallResponse = this.SCP[sysCall[0]].apply(this, sysCall[1]);
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
	FORK: function (...args) {
		const pid = this.SCP.EXEC(this.curProc.image, ...args);
		this.curProc.children.add(pid);
		return pid;
	},
	FORK_PID: function (pid, ...args) {
		const procData = this.procs.get(pid);
		if (procData === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		return this.SCP.EXEC(procData.proc.image, ...args);
	},
	FORK_CHILD: function (...args) {
		const pid = this.SCP.FORK(...args);
		this.curProc.childPids.add(pid);
		return pid;
	},
	EMIT_EVENT: function (name, value) {
		this.dispatchEvent(name, value);
	},
	TIME_WAIT: function (waitTime) {
		this.curProc.waiting = true;
		this.curProc.waitForTime = performance.now() + waitTime;
	},
	EVENT_WAIT: function (name) {
		this.curProc.waiting = true;
		this.curProc.waitForEvent = name;
		this.curProc.eventBus.addEventListener(function (event) {
			this.waitForEvent = null;
			this.sysCallResponse = event;
			if (this.waitForTime === null) {
				this.waiting = false;
			}
		});
	},
	EVENT_LISTEN: function (name, callback) {
		this.eventBus.addEventListener(name, this.curProc.eventBus.publishEvent);
	},
	HALT: function () {
		this.stop();
	},
	KILL_PID: function (pid) {
		const procData = this.procs.get(pid);
		if (procData === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		this.killProc(procData);
	},
	KILL: function () {
		this.killProc(this.curProcData);
	}
};
Kernel.prototype.SCP = Kernel.prototype.sysCallProcedures;
Kernel.prototype.sysCallInterface = {};
Kernel.prototype.SCI = Kernel.prototype.sysCallInterface;
const sysCallStrings = Object.keys(Kernel.prototype.SCP);
sysCallStrings.forEach(name =>
	Kernel.prototype.SCI[name] = (...args) => [name, args]
);

var testKernel = new Kernel();
with (testKernel.SCI) {
	var testProcess = function* () {
		console.info("Test process " + this.pid + " is alive!");
		console.log("Process " + this.pid + " is spawning a child process.");
		var childPid = yield EXEC_CHILD(function* () {
			console.info("Test process " + this.pid + " is alive!");
			console.log("Process " + this.pid + " is now emitting a heartbeat event.");
			yield EMIT_EVENT("iLive", this.pid);
			this.addEventListener("sayHello", function (event) {
				console.log("Hello process " + event.value + "!");
			});
			this.idle = true;
			yield;
		});
		console.log("Waiting for heartbeat from the child process...");
		this.addEventListener("iLive", function (event) {
			this.idle = false;
		});
		var heartbeatEvent = yield EVENT_WAIT("iLive");
		console.log("Heard from child process " + iLiveEvent.value + "!");
		for (var loc = 0; loc <= 5; loc++) {
			console.log("Asking process " + iLiveEvent.value + " to say hello...");
			yield EMIT_EVENT("sayHello", this.pid);
		}
	};
}
testKernel.exec(testProcess);
testKernel.run();