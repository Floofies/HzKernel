function compose(...funcs) {
	return initValue => funcs.reduce(
		(value, func) => func(value),
		initValue
	);
}
function callbackFill(target, callback, start, end = target.length) {
	for (var loc = start; loc <= end; loc++) target[loc] = callback();
	return target;
}
const randStr = compose(
	_ => Math.floor((1 + Math.random()) * 0x10000),
	int => int.toString(8),
	str => str.substring(1)
);
function uid(segments, delimiter = "") {
	return callbackFill([], _ => randStr(), 0, segments - 1).join(delimiter);
}
function bindAssign(thisArg, toObj, ...objects) {
	for (const obj of objects) {
		for (const prop in obj) {
			toObj[prop] = (typeof obj[prop]) === "function" ? obj[prop].bind(thisArg) : obj[prop];
		};
	}
	return toObj;
};
function nullifyObject(obj) {
	Object.keys(obj).forEach(prop => obj[prop] = null);
};
module.exports = {
	compose: compose,
	callbackFill: callbackFill,
	randStr: randStr,
	uid: uid,
	bindAssign: bindAssign,
	nullifyObject: nullifyObject
};