const CoreScheduler = require("./CoreScheduler.js");
const d = require("differentia");
/*
Does not preempt nearly as often as regular tasks would, thereby allowing tasks
to run longer and make better use of caches, but at the cost of interactivity.
*/
function BatchScheduler() {
	
}