const Kernel = require("./HzKernel.js");
var hz = new Kernel();
var testProcess = function* () {
	console.info("Test process " + this.pid + " is alive!");
	console.log("Process " + this.pid + " is spawning a child process.");
	var childPid = yield hz.EXEC_CHILD(function* () {
		console.info("Test process " + this.pid + " is alive!");
		console.log("Process " + this.pid + " is now emitting a heartbeat event.");
		yield hz.EMIT_EVENT("iLive", this.pid);
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
	var heartbeatEvent = yield hz.EVENT_WAIT("iLive");
	console.log("Heard from child process " + iLiveEvent.value + "!");
	for (var loc = 0; loc <= 5; loc++) {
		console.log("Asking process " + iLiveEvent.value + " to say hello...");
		yield hz.EMIT_EVENT("sayHello", this.pid);
	}
};
hz.exec(testProcess);
hz.run();