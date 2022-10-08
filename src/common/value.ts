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
