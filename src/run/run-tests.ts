import fs = require("fs");

import Rue = require("..");
import { InterpretResult } from "../backend/vm";

Rue.Debug.DEBUG_TRACE_EXECUTION = false;
Rue.Debug.DEBUG_STACK = false;

let failed = false;
fs.readdirSync("./test/").forEach((file) => {
	const data = fs.readFileSync("./test/" + file);

	const [result] = Rue.VM.Interpret(data.toString());
	console.log(`[${result === InterpretResult.OK ? "OK" : "FAILED"}] ${file}`);
	if (result !== InterpretResult.OK) {
		failed = true;
	}
});

if (failed) {
	process.exit(1);
} else {
	process.exit(0);
}
