const stdLib = {};
Object.assign(stdLib, differentia);
Kernel.prototype.stdLib = stdLib;
stdLib.compose = (...funcs) =>
	initValue => funcs.reduce(
		(value, func) => func(value),
		initValue
	);
stdLib.randStr = stdLib.compose(
	() => Math.floor((1 + Math.random()) * 0x10000),
	int => int.toString(8),
	str => str.substring(1)
);
stdLib.bindAssign = function (thisArg, toObj, ...objects) {
	for (var obj of objects) {
		for (var prop in obj) {
			toObj[prop] = (typeof obj[prop]) === "function" ? obj[prop].bind(thisArg) : obj[prop];
		};
	}
	return toObj;
};
stdLib.nullifyObject = function (obj) {
	Object.keys(obj).forEach(prop => obj.prop = null);
};