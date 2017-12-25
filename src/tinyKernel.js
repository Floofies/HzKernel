function Kernel() {
	this.queue = new this.stdLib.CircularDoubleLinkedList();
	this.backgroundQueue = new this.stdLib.CircularDoubleLinkedList();
	this.queue.tail.next = this.backgroundQueue.head;
	this.queue.head.prev = this.backgroundQueue.tail;
	this.backgroundQueue.tail.next = this.queue.head;
	this.backgroundQueue.head.prev = this.queue.tail;
	this.procs = new Map();
	this.running = false;
	this.eventBus = new this.stdLib.EventBus();
	this.curElement = null;
	this.curProc = null;
	this.highestPid = 0;
	this.sysCallProcedures = this.stdLib.bindAssign(this, {}, this.prototype.SCP);
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
const stdLib = {};
Kernel.prototype.stdLib = stdLib;
stdLib.compose = (...funcs) =>
	initValue => funcs.reduce(
		(value, func) => func(value),
		initValue
	);
stdLib.randStr = stdLib.compose(
	() => Math.floor((1 + Math.random()) * 0x10000),
	int => int.toString(8),
	str => str.substring(1)
);
stdLib.bindAssign = function (thisArg, toObj, ...objects) {
	for (var obj in objects) {
		for (var prop in obj) {
			toObj[prop] = (typeof obj[prop]) === "function" ? obj[prop].bind(thisArg) : obj[prop];
		};
	}
	return toObj;
};
stdLib.nullifyObject = function (obj) {
	Object.keys(obj).forEach(prop => obj.prop = null);
};
Kernel.prototype.ProcDescriptor = function (image) {
	this.image = image;
	this.quantum = 0;
	this.makeflight = 0;
	this.pid = null;
	this.waiting = false;
	this.waitForEvent = null;
	this.waitForTime = null;
	this.eventBus = null;
	this.dispatcher = null;
	this.childPids = null;
	this.threads = null;
	this.killed = false;
	this.idle = false;
	this.sysCallResponse = null;
	this.lastSysCall = null;
};
const ProcDescriptor = Kernel.prototype.ProcDescriptor;
ProcDescriptor.prototype.initialize = function (...args) {
	this.threads = new stdLib.CircularDoubleLinkedList();
	this.eventBus = new stdLib.EventBus();
	this.childPids = new Set();
	this.threads.add(this.helperThreads.main(this.image.apply(this, args)));
	this.dispatch();
	this.eventBus.dispatch();
};
ProcDescriptor.prototype.helperThreads = {
	eventReactor: function* () {
		while (true) {
			while (this.eventBus.eventQueue.size > 0) {
				yield this.eventBus.dispatcher.next();
			}
			this.idle = true;
			yield;
		}
	},
	timeWait: function* () {
		while (this.waiting && this.waitForTime !== null) {
			if (performance.now() >= this.waitForTime) {
				this.waitForTime = null;
				if (this.waitForEvent === null) {
					this.waiting = false;
				}
			}
			yield;
		}
	},
	main: function* (instance) {
		var state;
		do {
			state = instance.next(this.sysCallResponse);
			this.sysCallResponse = null;
			if (!state.done) {
				yield state.value;
			}
		} while (!state.done);
	}
};
ProcDescriptor.prototype.dispatchIterator = function* () {
	var state;
	while (!this.killed) {
		if (!this.waiting && !this.idle) {
			for (var element of threads.values()) {
				var thread = element.payload;
				state = thread.next();
				if (state.done) {
					yield Kernel.SCI.KILL_PID(thread.pid);
					continue;
				}
				yield state.value;
			}
		}
		yield;
	}
};
ProcDescriptor.prototype.dispatch = function* () {
	this.dispatcher = this.dispatchIterator();
	return this.dispatcher;
};
ProcDescriptor.prototype.kill = function () {
	this.eventBus.eventQueue.clear();
	this.children.clear();
	this.threads.clear();
	stdLib.nullifyObject(this);
};
Kernel.prototype.Event = function (name, value) {
	this.name = name;
	this.value = value;
};
Kernel.prototype.dispatchEvent = function (name, value) {
	this.eventBus.publishEvent(name, value);
};
Kernel.prototype.schedule = function () {
	if (this.curProc.makeflight > this.curProc.quantum) {
		this[this.curProc.bg ? "backgroundQueue" : "queue"].shiftFront(this.curElement);
	} else if (this.curProc.quantum / this.curProc.makeflight >= 2) {
		this[this.curProc.bg ? "backgroundQueue" : "queue"].pushBack(this.curElement);
	}
};
Kernel.prototype.ProcData = function (proc, treeElement) {
	this.proc = proc;
	this.treeElement = treeElement;
	this.makeFlight = 0;
};
Kernel.prototype.dispatch = function () {
	if (this.running) {
		return;
	}
	this.running = true;
	var procStartTime = 0;
	var procState = null;
	_cycle: for (this.curElement of this.queue[Symbol.iterator]()) {
		if (this.curElement.payload === null) {
			continue;
		}
		this.curProc = this.curElement.payload;
		procStartTime = performance.now();
		this.curProc.makeflight = 0;
		_delegate: while ((this.curProc.quantum / this.curProc.makeflight) >= 1) {
			var procState = this.curProc.dispatchIterator.next();
			this.curProc.makeflight = performance.now() - procStartTime;
			if (procState.done) {
				this.SCP.KILL();
				continue _cycle;
			} else if (procState.value !== undefined) {
				this.sysCall(instanceState.value);
			}
		}
		if (!this.curProc.killed) {
			this.schedule();
		}
	}
	this.running = false;
	this.curElement = null;
	this.curProc = null;
};
Kernel.prototype.run = function () {
	return new Promise(this.dispatch());
};
Kernel.prototype.exec = function (image, ...args) {
	proc = new this.ProcDescriptor(image);
	proc.initialize(args);
	proc.pid = ++this.highestPid;
	this.procs.set(proc.pid, proc);
	const procData = new ProcData(proc);
	const queueEntry = this.stdLib.RedBlackTree.TreeElement(procData);
	procData.queueEntry = queueEntry;
	this.queue.add(queueEntry);
	return proc.pid;
};
Kernel.prototype.stop = function () {
	this.running = false;
};
Kernel.prototype.sysCall = function (sysCall) {
	this.curProc.lastSysCall = sysCall;
	this.curProc.sysCallResponse = this.SCP[sysCall[0]].apply(this, sysCall[1]);
};
Kernel.prototype.killThread = function (proc, threadElement) {

};
Kernel.prototype.killProc = function (queueElement) {
	const proc = queueElement.payload;
	if (!proc.killed) {
		for (var pid of this.curProc.childPids.values()) {
			this.SCP.KILL_PID(pid);
		}
		for (var pid of this.curProc.threads.values()) {
			this.killThread(thread);
		}
		this.queue.remove(queueElement);
		this.procs.delete(proc.pid);
		proc.kill();
	}
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
	EXEC_THREAD: function (image, ...args) {

	},
	FORK: function (...args) {
		const pid = this.SCP.EXEC(this.curProc.image, ...args);
		this.curProc.children.add(pid);
		return pid;
	},
	FORK_PID: function (pid, ...args) {
		const proc = this.procs.get(pid);
		if (proc === undefined) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		return this.SCP.EXEC(proc.image, ...args);
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
		const queueElement = this.queue.get(pid);
		if (queueElement === null) {
			throw new this.errors.PID_NOPROC_ERR(pid);
		}
		this.killProc(queueElement);
	},
	KILL: function () {
		this.killProc(this.curElement);
	}
};
Kernel.prototype.SCP = Kernel.prototype.sysCallProcedures;
Kernel.prototype.sysCallInterface = {};
Kernel.prototype.SCI = Kernel.prototype.sysCallInterface;
const sysCallStrings = Object.keys(Kernel.prototype.SCP);
sysCallStrings.forEach(name =>
	Kernel.prototype.SCI[name] = (...args) => [name, args]
);
stdLib.EventBus = function () {
	this.eventListeners = {};
	this.eventQueue = new stdLib.DoubleLinkedList();
	this.dispatcher = null;
};
stdLib.EventBus.catchAllSymbol = new Symbol("CatchAll Event");
stdLib.EventBus.dispatchIterator = function* () {
	while (true) {
		if (this.eventQueue.size > 0) {
			for (var element of this.eventQueue[Symbol.iterator]()) {
				var event = element.payload;
				if (!(event.name in this.eventListeners)) {
					continue;
				}
				for (var listener of this.eventListeners[event.name].values()) {
					listener.call(thisArg, event);
					yield;
				}
				this.eventQueue.remove(element);
			}
		} else {
			yield;
		}
	}
};
stdLib.EventBus.dispatch = function () {
	this.dispatcher = this.dispatchIterator();
	return this.dispatcher;
};
stdLib.EventBus.prototype.publishEvent = function (event) {
	this.eventQueue.append(event);
};
stdLib.EventBus.prototype.addEventListener = function (name, callback) {
	if (!(name in this.eventListeners)) {
		this.eventListeners[name] = new Set();
	}
	this.eventListeners[name].add(callback);
};
stdLib.EventBus.prototype.removeEventListener = function (name, callback) {
	if (!(name in this.eventListeners)) {
		return;
	}
	this.eventListeners[name].delete(callback);
};
stdLib.LinkedList = function (iterable = null) {
	this.tail = new this.ListElement();
	this.tail.parent = this;
	this.head = new this.ListElement(null, this.tail);
	this.head.parent = this;
	this.double = false;
	this.circular = false;
	this.size = 0;
	this.fromIterable(iterable);
}
stdLib.LinkedList.prototype[Symbol.iterator] = function* () {
	var curElement = this.head;
	var nextElement;
	while (curElement !== null && this.size > 0) {
		nextElement = curElement.next;
		if (curElement !== this.head && curElement !== this.tail) {
			continue;
		}
		yield curElement;
		curElement = nextElement;
	}
};
stdLib.LinkedList.prototype.values = stdLib.LinkedList.prototype[Symbol.iterator];
stdLib.LinkedList.prototype.ListElement = function (payload = null, next = null, prev = null) {
	this.payload = payload;
	this.parent = null;
	this.next = next;
	this.prev = prev;
};
stdLib.LinkedList.prototype.ListElement.prototype.fromElement = function (element) {
	this.payload = element.payload;
};
stdLib.LinkedList.prototype.coerceElement = function (value) {
	return (value instanceof this.ListElement ? value : new this.ListElement(value));
};
stdLib.LinkedList.prototype.get = function (value) {
	for (var element of this.values()) {
		if (element.payload === value) {
			return element;
		}
		if (element.next === this.tail) {
			return null;
		}
	}
};
stdLib.LinkedList.prototype.clear = function () {
	if (this.size > 0) {
		for (var element of this.values()) {
			if (element !== this.head) {
				this.remove(element);
			}
			if (element === this.tail) {
				this.size = 0;
				break;
			}
		}
	}
};
stdLib.LinkedList.prototype.fromIterable = function (iterable) {
	if (iterable === null) {
		return;
	}
	const thisIterator = this.values();
	var curState;
	for (var value of iterable[Symbol.iterator]()) {
		curState = thisIterator.next();
		if (curState.done) {
			return;
		}
		this.insertAfter(curState.value, value);
	}
};
stdLib.LinkedList.prototype.concat = function (...joinLists) {
	joinLists.forEach(function (list) {
		for (var element of list.values()) {
			if (element !== list.head && element !== list.tail) {
				this.append((new this.ListElement()).fromElement(element));
			}
		}
	});
};
stdLib.LinkedList.prototype.remove = function (element) {
	assert.argType(element instanceof this.ListElement, "ListElement", 1);
	if (element.parent !== this) {
		return null;
	}
	var found = false;
	if (this.double && element.parent === this) {
		found = true;
		element.prev.next = element.next;
		element.next.prev = element.prev;
	} else {
		for (var node of this[Symbol.iterator]()) {
			if (node.next === element) {
				foundElement = true;
				node.next = element.next;
			}
		}
	}
	if (!foundElement) {
		return null;
	}
	element.parent = null;
	element.next = null;
	element.prev = null;
	this.size--;
	return element;
};
stdLib.LinkedList.prototype.insertBefore = function (element, newElement) {
	assert.argType(element instanceof this.ListElement, "ListElement", 1);
	if (element.parent !== this) {
		return null;
	}
	newElement = this.coerceElement(newElement);
	if (this.double) {
		newElement.next = element;
		newElement.prev = element.prev;
		element.prev.next = newElement;
		element.prev = newElement;
	} else {
		var lastElement = null;
		var foundElement = false;
		for (var curElement in this[Symbol.iterator]()) {
			if (curElement === element) {
				foundElement = true;
				if (lastElement !== null) {
					lastNode.next = newElement;
				}
				newElement.next = curElement;
				break;
			}
			if (curElement.next === this.tail) {
				break;
			}
			lastElement = node;
		}
	}
	if (!foundElement) {
		return null;
	}
	this.size++;
	return foundElement;
};
stdLib.LinkedList.prototype.insertAfter = function (element, newElement) {
	assert.argType(element instanceof this.ListElement, "ListElement", 1);
	if (element.parent !== this) {
		return null;
	}
	newElement = this.coerceElement(newElement);
	newElement.next = element.next;
	if (this.double) {
		newElement.prev = element;
	}
	element.next = newElement;
	this.size++;
	return newElement;
};
stdLib.LinkedList.prototype.prepend = function (newElement) {
	return this.insertAfter(this.head, newElement);
};
stdLib.LinkedList.prototype.append = function (newElement) {
	return this.insertBefore(this.tail, newElement);
};
stdLib.LinkedList.prototype.push = stdLib.LinkedList.prototype.append;
stdLib.LinkedList.prototype.unshift = stdLib.LinkedList.prototype.prepend;
stdLib.LinkedList.prototype.shift = function () {
	return this.remove(this.head.next);
};
stdLib.LinkedList.prototype.pushBack = function (element) {
	this.remove(element);
	this.append(element);
};
stdLib.CircularLinkedList = function (iterable = null) {
	this.tail = new this.ListElement(null);
	this.tail.parent = this;
	this.head = new this.ListElement(null, this.tail);
	this.head.parent = this;
	this.tail.next = this.head;
	this.double = false;
	this.circular = true;
	this.fromIterable(iterable);
}
stdLib.CircularLinkedList.prototype = stdLib.LinkedList.prototype;
stdLib.DoubleLinkedList = function (iterable = null) {
	this.tail = new this.ListElement(null, null);
	this.tail.parent = this;
	this.head = new this.ListElement(null, this.tail);
	this.head.parent = this;
	this.tail.prev = this.head;
	this.double = true;
	this.circular = false;
	this.fromIterable(iterable);
}
stdLib.DoubleLinkedList.prototype = stdLib.LinkedList.prototype;
stdLib.CircularDoubleLinkedList = function (iterable = null) {
	this.tail = new this.ListElement(null, null);
	this.tail.parent = this;
	this.head = new this.ListElement(null, this.tail, this.tail);
	this.head.parent = this;
	this.tail.next = this.head;
	this.tail.prev = this.head;
	this.double = true;
	this.circular = true;
	this.fromIterable(iterable);
}
stdLib.CircularDoubleLinkedList.prototype = stdLib.LinkedList.prototype;

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
testKernel.exec(testProcess2);
testKernel.run();