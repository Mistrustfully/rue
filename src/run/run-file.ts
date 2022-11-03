import fs = require("fs");
import path = require("path");

import Rue = require("..");
import std from "./std";

const file = process.argv[2];
fs.readFile(path.resolve(file), (err, data) => {
	const start = performance.now();
	if (err) throw err;
	const [, returnValue] = Rue.VM.Interpret(data.toString(), std);
	console.log(returnValue);
	const end = performance.now();

	console.log(`Took ${end - start}ms`);
});
