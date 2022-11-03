import { RueValue } from "../common/value";

const std = new Map<string, RueValue>([
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
]);

export default std;
