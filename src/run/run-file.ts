import fs = require("fs");
import path = require("path");

import Rue = require("..");
import { RueValue } from "../common/value";

const file = process.argv[2];
fs.readFile(path.resolve(file), (err, data) => {
	const start = performance.now();
	if (err) throw err;
	const [, returnValue] = Rue.VM.Interpret(
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
	console.log(returnValue);
	const end = performance.now();

	console.log(`Took ${end - start}ms`);
});
