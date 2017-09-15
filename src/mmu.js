function MMU(stackLen = 32768) {
	this.stack = new Stack();
	this.freePages = [];
	this.frames = [];
	this.pages = [];
	this.tlb = new Map();
	for (var num = 0; num <= stackLen; num++) {
		this.stack.push(null);
	}
	this.stack.length = 0;
	this.freePages.push({
		pid: 0,
		segments: [[0, stackLen]],
		size: stackLen,
		free: true,
		present: true,
		dirty: false,
		accessed: false
	});
}
this.alloc = function (pid, virt, size = 1) {
	const loc = this.translate(pid, virt);

};
this.freePid = function (pid) {
	if (!(pid in this.pages)) {
		throw new SegFault(pid, 0);
	}
	for (var segment in this.pages[pid].segments) {
		this.freeAddrs(pid, segment[0], segment[1]);
	}
	const freePage = this.pages[pid];
	freePage.free = true;
};
this.freeAddrs = function (pid, virt, size = 1) {
	const real = this.translate(pid, virt);
	const freePage = this.pages[pid];
	this.freePages.push(freePage);
	this.pages[real] = null;
};
this.findSegment = function (page, real) {
	var segment = null;
	for (var loc = 0; loc < page.segments.length; loc++) {
		if (real >= page.segments[loc][0] && real <= page.segments[loc][1]) {
			return page.segments[loc];
		}
	}
};
this.translate = function (pid, virt) {
	var page = this.tlb.get(pid);
	if (page === undefined) {
		page = this.p
	}
	if (!(pid in this.pages)) {
		throw new SegFault(pid, virt);
	}
	if (!(real in this.stack)) {
		throw new SegFault(pid, virt, real);
	}
	if (real > this.pages[pid].segments[0] || real < this.pages.[pid].start) {
		throw new AccessViolation(pid, virt, real);
	}
	real = this.pages[pid].start + virt;
	this.tlb.set(pid, );
	return real;
};
this.poke = function (pid, virt) {

};
this.peek = function (pid, virt) {
	return this.pages[this.translate(pid, virt)];
};