import { padNumber } from "../util";
import { Chunk } from "./chunk";
import { OpCode } from "./opcode";

function simpleInstruction(name: string, offset: number): [number, string] {
	return [offset + 1, name];
}

function constantInstruction(name: string, chunk: Chunk, offset: number): [number, string] {
	const constant = chunk.code[offset + 1];
	return [offset + 2, `${name} ${padNumber(constant, 4)} ${chunk.constants[constant]}`];
}

export namespace Debug {
	export const DEBUG_TRACE_EXECUTION = true;

	export function DisassembleInstruction(chunk: Chunk, offset: number): [number, string] {
		const instruction = chunk.code[offset];

		switch (instruction) {
			case OpCode.OP_RETURN:
				return simpleInstruction("OP_RETURN", offset);
			case OpCode.OP_CONSTANT:
				return constantInstruction("OP_CONSTANT", chunk, offset);
		}

		return [offset, ""];
	}

	export function DisassembleChunk(chunk: Chunk, name: string) {
		console.log(`=== ${name} ===`);
		for (let offset = 0; offset < chunk.code.length; offset) {
			const [newOffset, log] = DisassembleInstruction(chunk, offset);
			console.log(
				`${padNumber(offset, 4)} ${
					chunk.lines[offset] === chunk.lines[offset - 1] ? "|" : chunk.lines[offset]
				}  ${log}`,
			);

			offset = newOffset;
		}
	}
}
