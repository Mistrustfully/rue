import fs = require("fs");

import Rue = require("..");
import { InterpretResult } from "../backend/vm";
import std from "./std";

Rue.Debug.Config.DEBUG_TRACE_EXECUTION = false;
Rue.Debug.Config.DEBUG_STACK = false;
Rue.Debug.Config.DEBUG_EXECUTION_TIME = false;

const start = performance.now();

let failed = false;
fs.readdirSync("./test/").forEach((file) => {
	const data = fs.readFileSync("./test/" + file);

	const [result] = Rue.VM.Interpret(data.toString(), std);
	console.log(`[${result === InterpretResult.OK ? "\x1b[92mOK\x1b[0m" : "\x1b[91mFAILED\x1b[0m"}] ${file}`);
	if (result !== InterpretResult.OK) {
		failed = true;
	}
});

const end = performance.now();
console.log(`Test suite took ${end - start}ms!`);

if (failed) {
	process.exit();
} else {
	process.exit(0);
}
