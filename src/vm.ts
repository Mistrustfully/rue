import { Chunk } from "./common/chunk";
import { Debug } from "./common/debug";
import { OpCode } from "./common/opcode";
import { Value } from "./common/value";

export class VM {
	public instruction = 0;
	constructor(public chunk: Chunk) {}

	readByte() {
		return this.chunk.code[this.instruction++];
	}

	readConstant() {
		return this.chunk.constants[this.readByte()];
	}

	push(v: Value) {
		return this.chunk.stack.push(v);
	}

	pop() {
		return this.chunk.stack.pop();
	}

	run() {
		/* eslint-disable no-constant-condition */
		while (true) {
			const instruction = this.readByte();
			print(instruction, this.instruction);

			if (Debug.DEBUG_TRACE_EXECUTION) {
				console.log(this.chunk.stack);
				Debug.DisassembleInstruction(this.chunk, this.chunk.code[instruction]);
			}

			switch (instruction) {
				case OpCode.OP_RETURN:
					console.log(this.pop());
					return InterpretResult.OK;
				case OpCode.OP_CONSTANT:
					this.push(this.readConstant());
					break;
			}
		}
	}
}

export namespace VirtualMachine {
	export function Interpret(chunk: Chunk) {
		const vm = new VM(chunk);
		return vm.run();
	}
}

export enum InterpretResult {
	OK,
	COMPILE_ERROR,
	RUNTIME_ERROR,
}
