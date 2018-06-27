function compose(...funcs) {
	initValue => funcs.reduce(
		(value, func) => func(value),
		initValue
	);
}
const randStr = stdLib.compose(
	() => Math.floor((1 + Math.random()) * 0x10000),
	int => int.toString(8),
	str => str.substring(1)
);
function bindAssign(thisArg, toObj, ...objects) {
	for (var obj of objects) {
		for (var prop in obj) {
			toObj[prop] = (typeof obj[prop]) === "function" ? obj[prop].bind(thisArg) : obj[prop];
		};
	}
	return toObj;
};
function nullifyObject(obj) {
	Object.keys(obj).forEach(prop => obj.prop = null);
};
module.exports = {
	HzKernel: require("../HzKernel.js"),
	EventBus: require("./EventBus.js"),
	Threader: require("./Threader.js"),
	compose: compose,
	randStr: randStr,
	bindAssign: bindAssign,
	nullifyObject: nullifyObject
};