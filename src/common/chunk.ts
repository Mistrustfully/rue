import { Value } from "./value";

export class Chunk {
	public code: number[] = [];
	public lines: number[] = [];

	public constants: Value[] = [];
	public stack: Value[] = [];

	write(byte: number, line: number) {
		this.code.push(byte);
		this.lines.push(line);
	}

	addConstant(value: Value) {
		this.constants.push(value);
		return this.constants.length - 1;
	}
}
