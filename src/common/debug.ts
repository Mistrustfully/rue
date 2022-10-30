import { exit } from "process";
import { padNumber } from "../util";
import { Chunk } from "./chunk";
import { OpCode } from "./opcode";
import { RueValue } from "./value";

function printValue(val: RueValue) {
	if (!val) {
		console.log("BRUH");
		return "";
	}

	let text = `[ ${val.type}`;

	if (val.type !== "nil") {
		text += ` : ${val.value}`;
	}

	text += " ]";

	return text;
}

function simpleInstruction(name: string, offset: number): [number, string] {
	return [offset + 1, name];
}

function constantInstruction(name: string, chunk: Chunk, offset: number): [number, string] {
	const constant = chunk.code[offset + 1];
	return [offset + 2, `${name} ${padNumber(constant, 4)} ${printValue(chunk.constants[constant])}`];
}

function byteInstruction(name: string, chunk: Chunk, offset: number): [number, string] {
	const slot = chunk.code[offset + 1];
	return [offset + 2, `${name} ${padNumber(slot, 4)}`];
}

function jumpInstruction(name: string, chunk: Chunk, offset: number, direction = 1): [number, string] {
	const jmpOffset = chunk.code[offset + 1];
	return [offset + 2, `${name} ${padNumber(offset + jmpOffset * direction, 4)}`];
}

export namespace Debug {
	/* eslint-disable */
	export let DEBUG_TRACE_EXECUTION = false;
	export let DEBUG_STACK = false;

	export function DisassembleInstruction(chunk: Chunk, offset: number): [number, string] {
		const instruction = chunk.code[offset];

		switch (instruction) {
			case OpCode.RETURN:
				return simpleInstruction("OP_RETURN", offset);
			case OpCode.CONSTANT:
				return constantInstruction("OP_CONSTANT", chunk, offset);
			case OpCode.NEGATE:
				return simpleInstruction("OP_NEGATE", offset);
			case OpCode.ADD:
				return simpleInstruction("OP_ADD", offset);
			case OpCode.SUBTRACT:
				return simpleInstruction("OP_SUBTRACT", offset);
			case OpCode.MULTIPLY:
				return simpleInstruction("OP_MULTIPLY", offset);
			case OpCode.DIVIDE:
				return simpleInstruction("OP_DIVIDE", offset);
			case OpCode.TRUE:
				return simpleInstruction("OP_TRUE", offset);
			case OpCode.FALSE:
				return simpleInstruction("OP_FALSE", offset);
			case OpCode.NIL:
				return simpleInstruction("OP_NIL", offset);
			case OpCode.NOT:
				return simpleInstruction("OP_NOT", offset);
			case OpCode.GREATER:
				return simpleInstruction("OP_GREATER", offset);
			case OpCode.LESS:
				return simpleInstruction("OP_LESS", offset);
			case OpCode.EQUAL:
				return simpleInstruction("OP_EQUAL", offset);
			case OpCode.POP:
				return simpleInstruction("OP_POP", offset);
			case OpCode.DEFINE_GLOBAL:
				return constantInstruction("OP_DEFINE_GLOBAL", chunk, offset);
			case OpCode.GET_GLOBAL:
				return constantInstruction("OP_GET_GLOBAL", chunk, offset);
			case OpCode.SET_GLOBAL:
				return constantInstruction("OP_SET_GLOBAL", chunk, offset);
			case OpCode.GET_LOCAL:
				return byteInstruction("OP_GET_LOCAL", chunk, offset);
			case OpCode.SET_LOCAL:
				return byteInstruction("OP_SET_LOCAL", chunk, offset);
			case OpCode.JUMP_IF_FALSE:
				return jumpInstruction("OP_JUMP_IF_FALSE", chunk, offset);
			case OpCode.JUMP:
				return jumpInstruction("OP_JUMP", chunk, offset);
			case OpCode.LOOP:
				return jumpInstruction("OP_LOOP", chunk, offset, -1);
			case OpCode.CALL:
				return byteInstruction("OP_CALL", chunk, offset);
		}
		return [offset + 1, "UNKNOWN_OP"];
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
