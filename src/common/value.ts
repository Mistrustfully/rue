export type RueString = {
	type: "string";
	value: string;
};

export type RueNumber = {
	type: "number";
	value: number;
};

export type RueBoolean = {
	type: "boolean";
	value: boolean;
};

export type RueNil = {
	type: "nil";
};

export type RueValue = RueString | RueNumber | RueBoolean | RueNil;
export function ValuesEqual(a: RueValue, b: RueValue) {
	if (a.type !== b.type) return false;
	if (a.type === "nil" || b.type === "nil") return true;

	return a.value === b.value;
}
