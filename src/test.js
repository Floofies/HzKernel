const Kernel = require("./HzKernel.js");
const RRScheduler = require("./lib/scheduler/RRScheduler.js");
const SCI = require("./SysCallInterface.js");
function test1() {
	var testProcess = function* () {
		console.info("Test process " + this.pid + " is alive!");
		console.log("Process " + this.pid + " is spawning a child process.");
		var childPid = yield SCI.EXEC_CHILD(function* () {
			console.info("Test process " + this.pid + " is alive!");
			console.log("Process " + this.pid + " is now emitting a heartbeat event.");
			yield SCI.EMIT_EVENT("iLive", this.pid);
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
		var heartbeatEvent = yield SCI.EVENT_WAIT("iLive");
		console.log("Heard from child process " + iLiveEvent.value + "!");
		for (var loc = 0; loc <= 5; loc++) {
			console.log("Asking process " + iLiveEvent.value + " to say hello...");
			yield SCI.EMIT_EVENT("sayHello", this.pid);
		}
	};
	var kern = new Kernel(RRScheduler);
	kern.exec(testProcess);
	kern.runSync();
}
function test2() {
	var testProcess = function* () {
		console.info("Test process " + this.pid + " is alive!");
		console.info("Process " + this.pid + " will say hello every 2 seconds, 10 times.");
		var hellos = 0;
		while (hellos < 10) {
			yield SCI.TIME_WAIT(2000);
			console.log("Hello!");
			hellos++;
		}
	}
	var kern = new Kernel(RRScheduler);
	kern.exec(testProcess);
	kern.runSync();
}
test2();