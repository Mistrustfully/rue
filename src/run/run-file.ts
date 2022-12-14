import fs = require("fs");
import path = require("path");

import Rue = require("..");
import std from "../std";

const file = process.argv[2];
fs.readFile(path.resolve(file), (err, data) => {
	const start = performance.now();
	if (err) throw err;
	const vm = new Rue.VM();
	vm.addLibrary("std", std);
	const [, returnValue] = vm.interpret(data.toString());
	console.log(returnValue);
	const end = performance.now();

	console.log(`Took ${end - start}ms`);
});
