const helpers = {
	task: function* (proc) {
		while (!proc.killed) {
			const startTime = performance.now();
			const state = proc.instance.next();
			if (proc.killed || state.done) break;
			proc.makeflight = performance.now() - startTime;
			proc.makespan += proc.makeflight;
			proc.sysCallResponse = null;
			yield state.value;
		}
		yield SCI.KILL(proc.pid);
	},
	eventReactor: function* (eventBus) {
		while (true) {
			while (eventBus.eventQueue.size > 0) {
				yield eventBus.dispatcher.next();
			}
			yield SCI.EVENT_WAIT(eventBus.CATCH_ALL);
		}
	},
	wait: function* (proc) {
		while (true) {
			while (proc.waiting && proc.waitForTime !== null) {
				if (performance.now() >= proc.waitForTime) {
					proc.waitForTime = null;
					if (proc.waitForEvent === null) {
						proc.waiting = false;
					}
				}
			}
			yield;
		}
	}
};
module.exports = helpers;