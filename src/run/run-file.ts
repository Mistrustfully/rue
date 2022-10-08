import fs = require("fs");
import path = require("path");

import Rue = require("..");

const file = process.argv[2];
fs.readFile(path.resolve(file), (err, data) => {
	if (err) throw err;
	Rue.VM.Interpret(data.toString());
});
