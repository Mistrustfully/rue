import { Chunk } from "../common/chunk";
import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import { RueNumber, RueValue } from "../common/value";
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
			return InterpretResult.RUNTIME_ERROR;
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

	push(v: RueValue) {
		return this.chunk.stack.push(v);
	}

	pop() {
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
				console.log(this.chunk.stack);
				Debug.DisassembleInstruction(this.chunk, this.chunk.code[instruction]);
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
		console.log("gaming");

		const vm = new VM(chunk);
		return vm.run();
	}
}

export enum InterpretResult {
	OK,
	COMPILE_ERROR,
	RUNTIME_ERROR,
}
