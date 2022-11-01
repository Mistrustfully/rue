import fs = require("fs");

import Rue = require("..");
import { InterpretResult } from "../backend/vm";
import { RueValue } from "../common/value";

Rue.Debug.DEBUG_TRACE_EXECUTION = false;
Rue.Debug.DEBUG_STACK = false;

const start = performance.now();

let failed = false;
fs.readdirSync("./test/").forEach((file) => {
	const data = fs.readFileSync("./test/" + file);

	const [result] = Rue.VM.Interpret(
		data.toString(),
		new Map([
			[
				"print",
				{
					type: "nativeFunction",
					value: (valToPrint: RueValue) => {
						if (valToPrint.type === "nil") return valToPrint;
						console.log(valToPrint.value);

						return { type: "nil" };
					},
				},
			],
			[
				"assert",
				{
					type: "nativeFunction",
					value: (check: RueValue) => {
						if (check.type !== "nil" && check.type !== "boolean") return { type: "boolean", value: true };
						if (check.type === "nil") {
							return;
						}

						if (check.value === false) {
							return { type: "error", value: "Assert failed!" };
						}

						return check;
					},
				},
			],
		]),
	);
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
