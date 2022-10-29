import { Chunk } from "../common/chunk";
import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import { RueBoolean, RueNumber, RueString, RueValue, ValuesEqual } from "../common/value";
import { Compile } from "../frontend/compiler";

export class VM {
	public instruction = -1;
	public globals = new Map<string, RueValue>();
	constructor(public chunk: Chunk) {}

	readByte() {
		return this.chunk.code[++this.instruction];
	}

	readConstant() {
		return this.chunk.constants[this.readByte()];
	}

	peek(distance: number) {
		return this.chunk.stack[this.chunk.stack.length - distance - 1];
	}

	binaryOp(op: OpCode) {
		const v2 = this.pop() as RueNumber;
		const v1 = this.pop() as RueNumber;

		switch (op) {
			case OpCode.ADD:
				return v1.value + v2.value;
			case OpCode.SUBTRACT:
				return v1.value - v2.value;
			case OpCode.MULTIPLY:
				return v1.value * v2.value;
			case OpCode.DIVIDE:
				return v1.value / v2.value;
		}

		return 0;
	}

	concat() {
		const v2 = this.pop() as RueString;
		const v1 = this.pop() as RueString;

		return v1.value + v2.value;
	}

	compare(op: OpCode) {
		const v2 = this.pop() as RueNumber;
		const v1 = this.pop() as RueNumber;

		switch (op) {
			case OpCode.GREATER:
				return v1.value > v2.value;
			case OpCode.LESS:
				return v1.value < v2.value;
		}

		return false;
	}

	push(v: RueValue) {
		if (Debug.DEBUG_TRACE_EXECUTION) console.log(this.chunk.stack);
		return this.chunk.stack.push(v);
	}

	pop() {
		if (Debug.DEBUG_TRACE_EXECUTION) console.log(this.chunk.stack);
		return this.chunk.stack.pop();
	}

	runtimeError(message: string) {
		console.log(message);
		console.log(`[line ${this.chunk.lines[this.instruction]}] in script`);
	}

	run(): [InterpretResult, RueValue?] {
		/* eslint-disable no-constant-condition */
		while (true) {
			const instruction = this.readByte();

			if (Debug.DEBUG_TRACE_EXECUTION) {
				console.log(Debug.DisassembleInstruction(this.chunk, this.instruction)[1]);
			}

			switch (instruction) {
				case OpCode.RETURN:
					return [InterpretResult.OK, this.pop()];
				case OpCode.CONSTANT:
					this.push(this.readConstant());
					break;
				case OpCode.NEGATE:
					if (this.peek(0).type !== "number") {
						this.runtimeError("Operand must be a number.");
						return [InterpretResult.RUNTIME_ERROR];
					}

					this.push({ type: "number", value: -(this.pop() as RueNumber).value });
					break;

				case OpCode.ADD: {
					if (this.peek(0).type === "string" && this.peek(1).type === "string") {
						this.push({ type: "string", value: this.concat() });
						break;
					}
				}
				case OpCode.SUBTRACT:
				case OpCode.MULTIPLY:
				case OpCode.DIVIDE:
					if (this.peek(0).type !== "number" || this.peek(1).type !== "number") {
						this.runtimeError("Operand must be a number.");
						return [InterpretResult.RUNTIME_ERROR];
					}

					this.push({ type: "number", value: this.binaryOp(instruction) });
					break;
				case OpCode.LESS:
				case OpCode.GREATER:
					if (this.peek(0).type !== "number" || this.peek(1).type !== "number") {
						this.runtimeError("Operand must be a number.");
						return [InterpretResult.RUNTIME_ERROR];
					}

					this.push({ type: "boolean", value: this.compare(instruction) });
					break;
				case OpCode.NIL:
					this.push({ type: "nil" });
					break;
				case OpCode.TRUE:
					this.push({ type: "boolean", value: true });
					break;
				case OpCode.FALSE:
					this.push({ type: "boolean", value: false });
					break;
				case OpCode.NOT:
					if (this.peek(0).type === "nil") {
						this.push({ type: "boolean", value: true });
					} else if (this.peek(0).type === "boolean") {
						this.push({ type: "boolean", value: !(this.pop() as RueBoolean).value });
					} else {
						this.runtimeError("Attempt to OP_NOT a nonboolean type!");
						return [InterpretResult.RUNTIME_ERROR];
					}
					break;
				case OpCode.EQUAL: {
					const a = this.pop();
					const b = this.pop();
					this.push({ type: "boolean", value: ValuesEqual(a, b) });
					break;
				}
				case OpCode.POP:
					this.pop();
					break;
				case OpCode.DEFINE_GLOBAL: {
					const name = this.readConstant() as RueString;
					this.globals.set(name.value, this.peek(0));
					this.pop();
					break;
				}
				case OpCode.GET_GLOBAL: {
					const name = this.readConstant() as RueString;
					if (!this.globals.has(name.value)) {
						this.runtimeError(`Undefined variable: ${name.value}`);
						return [InterpretResult.RUNTIME_ERROR];
					}

					const value = this.globals.get(name.value);
					this.push(value);
					break;
				}
				case OpCode.SET_GLOBAL: {
					const name = this.readConstant() as RueString;
					if (!this.globals.has(name.value)) {
						this.runtimeError(`Undefined variable ${name.value}`);
						return [InterpretResult.RUNTIME_ERROR];
					}
					this.globals.set(name.value, this.peek(0));
					break;
				}
				case OpCode.GET_LOCAL: {
					const slot = this.readByte();
					this.push(this.chunk.stack[slot]);
					break;
				}
				case OpCode.SET_LOCAL: {
					const slot = this.readByte();
					this.chunk.stack[slot] = this.peek(0);
					break;
				}
				case OpCode.JUMP_IF_FALSE: {
					const offset = this.readByte();
					const next = this.peek(0);
					if (next.type !== "boolean" && next.type !== "nil") {
						this.runtimeError(`Cannot use type ${next.value} as a boolean!`);
						return [InterpretResult.RUNTIME_ERROR];
					}

					if (next.type === "nil" || next.value === false) {
						this.instruction += offset;
					}
					break;
				}
				case OpCode.JUMP: {
					const offset = this.readByte();
					this.instruction += offset;
					break;
				}
				case OpCode.LOOP: {
					const offset = this.readByte();
					this.instruction -= offset;
					break;
				}
			}
		}
	}
}

export namespace VirtualMachine {
	export function Interpret(source: string): [InterpretResult, RueValue?] {
		const chunk = new Chunk();

		if (!Compile(source, chunk)) {
			return [InterpretResult.COMPILE_ERROR];
		}

		const vm = new VM(chunk);
		return vm.run();
	}
}

export enum InterpretResult {
	OK,
	COMPILE_ERROR,
	RUNTIME_ERROR,
}
