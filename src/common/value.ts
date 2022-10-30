import { Chunk } from "./chunk";

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

export type RueFunction = {
	type: "function";
	value: { chunk: Chunk; name: string; arity: number };
};

export type RueNative = {
	type: "nativeFunction";
	value: (...args: RueValue[]) => RueValue;
};

export type RueValue = RueString | RueNumber | RueBoolean | RueNil | RueFunction | RueNative;
export function ValuesEqual(a: RueValue, b: RueValue) {
	if (a.type !== b.type) return false;
	if (a.type === "nil" || b.type === "nil") return true;

	return a.value === b.value;
}
