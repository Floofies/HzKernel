const Kernel = require("./HzKernel.js");
const SCI = {};
for (const name in Kernel.prototype.SCP) SCI[name] = (...args) => { name, args };
module.exports = SCI;