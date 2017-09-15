const DISPATCHER_WAIT = function (pid) {
	return [DISPATCHER_WAIT, pid];
};
const SYSTEM_HALT = function (pid) {
	return [SYSTEM_HALT, pid];
}
const KILL_PID = function (pid) {
	return [KILL_PID, pid];
}