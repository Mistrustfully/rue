import { Chunk } from "../common/chunk";
import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import { RueBoolean, RueNumber, RueValue, ValuesEqual } from "../common/value";
import { Compile } from "../frontend/compiler";

export class VM {
	public instruction = -1;
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
		if (this.peek(0).type !== "number" || this.peek(1).type !== "number") {
			this.runtimeError("Operand must be a number.");
		}

		const v1 = this.pop() as RueNumber;
		const v2 = this.pop() as RueNumber;

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

	compare(op: OpCode) {
		if (this.peek(0).type !== "number" || this.peek(1).type !== "number") {
			this.runtimeError("Operand must be a number.");
		}

		const v1 = this.pop() as RueNumber;
		const v2 = this.pop() as RueNumber;

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

	run() {
		/* eslint-disable no-constant-condition */
		while (true) {
			const instruction = this.readByte();

			if (Debug.DEBUG_TRACE_EXECUTION) {
				console.log(Debug.DisassembleInstruction(this.chunk, this.instruction)[1]);
			}

			switch (instruction) {
				case OpCode.RETURN:
					console.log(this.pop());
					return InterpretResult.OK;
				case OpCode.CONSTANT:
					this.push(this.readConstant());
					break;
				case OpCode.NEGATE:
					if (this.peek(0).type !== "number") {
						this.runtimeError("Operand must be a number.");
						return InterpretResult.RUNTIME_ERROR;
					}

					this.push({ type: "number", value: -(this.pop() as RueNumber).value });
					break;

				case OpCode.ADD:
				case OpCode.SUBTRACT:
				case OpCode.MULTIPLY:
				case OpCode.DIVIDE:
					this.push({ type: "number", value: this.binaryOp(instruction) });
					break;
				case OpCode.LESS:
				case OpCode.GREATER:
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
						this.runtimeError("Attempt to OP_NOT a nonfalsey type!");
						return InterpretResult.RUNTIME_ERROR;
					}
					break;
				case OpCode.EQUAL: {
					const a = this.pop();
					const b = this.pop();
					this.push({ type: "boolean", value: ValuesEqual(a, b) });
				}
			}
		}
	}
}

export namespace VirtualMachine {
	export function Interpret(source: string) {
		const chunk = new Chunk();

		if (!Compile(source, chunk)) {
			return InterpretResult.COMPILE_ERROR;
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
