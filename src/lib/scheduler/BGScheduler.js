const CoreScheduler = require("./CoreScheduler.js");
const d = require("differentia");
/*
A scheduler for very low priority background tasks.
Weaker than setting nice 19 in all other schedulers.
*/
function BGScheduler() {
	this.queue = new d.DoubleLinkedList();
}