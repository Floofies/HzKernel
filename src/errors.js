function AccessViolation(pid, virt, real = null) {
	this.message = "FATAL: MEMORY ACCESS VIOLATION " + pid + " :: " + addr + (real !== null ? " -> " + real : "");
	this.name = "Access Violation";
}
AccessViolation.prototype = Error.prototype;
function SegFault(pid, virt, real = null) {
	this.message = "FATAL: MEMORY SEGMENTATION FAULT " + pid + " :: " + addr + (real !== null ? " -> " + real : "");
	this.name = "Segmentation Fault";
}
SegFault.prototype = Error.prototype;