import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import {
	RueBoolean,
	RueClosure,
	RueNative,
	RueNumber,
	RueString,
	RueUpvalue,
	RueValue,
	ValuesEqual,
} from "../common/value";
import { Compile } from "../frontend/compiler";
import { array_length, printf, reverse_array } from "../polyfills";

export class CallFrame {
	instruction = -1;
	slots: RueValue[] = [];
	getFn() {
		return this.closure.value.fn.value;
	}
	constructor(public closure: RueClosure) {}
}

export class VM {
	public globals = new Map<string, RueValue>();
	public frames: CallFrame[] = [];
	public frameCount = 0;
	public openUpvalues?: RueUpvalue;

	getFrame() {
		return this.frames[this.frameCount - 1];
	}

	readByte() {
		return this.getFrame().getFn().chunk.code[++this.getFrame().instruction];
	}

	readConstant() {
		return this.getFrame().getFn().chunk.constants[this.readByte()];
	}

	peek(distance: number) {
		return this.getFrame().slots[array_length(this.getFrame().slots) - distance - 1];
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
		if (Debug.DEBUG_STACK) printf(this.getFrame().slots);
		return this.getFrame().slots.push(v);
	}

	pop() {
		if (Debug.DEBUG_STACK) printf(this.getFrame().slots);
		return this.getFrame().slots.pop();
	}

	popCount(c: number) {
		if (Debug.DEBUG_STACK) printf(this.getFrame().slots);
		const values = [];
		for (let i = 0; i < c; i++) {
			values.push(this.pop()!);
		}

		return reverse_array(values);
	}

	call(fn: RueClosure, argCount: number) {
		if (argCount !== fn.value.fn.value.arity) {
			this.runtimeError(`Expected ${fn.value.fn.value.arity} arguments, but got ${argCount}.`);
			return false;
		}

		const frame = new CallFrame(fn);
		// Pop off all the args off the current stack.
		for (const v of this.popCount(argCount + 1)) {
			frame.slots.push(v);
		}
		this.frames[this.frameCount++] = frame;
		return true;
	}

	callValue(callee: RueValue, argCount: number) {
		if (callee.type === "closure") {
			return this.call(callee, argCount);
		} else if (callee.type === "nativeFunction") {
			const result = callee.value(...this.popCount(argCount));
			if (result.type === "error") {
				this.runtimeError(result.value);
				return false;
			}

			this.push(result);
			return true;
		}

		this.runtimeError("Call only call functions and classes.");
		return false;
	}

	captureUpvalue(local_: number): RueUpvalue {
		let prevUpvalue: RueUpvalue | undefined = undefined;
		let upvalue = this.openUpvalues;

		while (upvalue !== undefined && upvalue.value.index > local_) {
			prevUpvalue = upvalue;
			upvalue = upvalue.value.next;
		}

		if (upvalue !== undefined && upvalue.value.index === local_) {
			return upvalue;
		}

		const newUpvalue: RueUpvalue = {
			type: "upvalue",
			value: { isLocal: true, index: local_, value: this.getFrame().slots[local_] },
		};

		if (prevUpvalue === undefined) {
			this.openUpvalues = newUpvalue;
		} else {
			prevUpvalue.value.next = newUpvalue;
		}

		return newUpvalue;
	}

	runtimeError(message: string) {
		printf(message);
		for (let i = this.frameCount - 1; i >= 0; i--) {
			const frame = this.frames[i];
			printf(`[line ${frame.getFn().chunk.lines[frame.instruction - 1]}] in ${frame.getFn().name}()`);
		}
	}

	run(): [InterpretResult, RueValue?] {
		let frame = this.getFrame();

		/* eslint-disable no-constant-condition */
		while (true) {
			const instruction = this.readByte();

			if (Debug.DEBUG_TRACE_EXECUTION) {
				printf(Debug.DisassembleInstruction(frame.getFn().chunk, frame.instruction)[1]);
			}

			switch (instruction) {
				case OpCode.RETURN: {
					const result = this.pop();
					this.pop(); // Pop the function off the stack
					if (this.frameCount === 1) {
						return [InterpretResult.OK, result];
					}

					this.frameCount--;

					frame = this.getFrame();
					this.push(result!);
					break;
				}
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
					this.push({ type: "boolean", value: ValuesEqual(a!, b!) });
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
					this.push(value!);
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
					this.push(frame.slots[slot]);
					break;
				}
				case OpCode.SET_LOCAL: {
					const slot = this.readByte();
					frame.slots[slot] = this.peek(0);
					break;
				}
				case OpCode.JUMP_IF_FALSE: {
					const offset = this.readByte();
					const next_ = this.peek(0);
					if (next_.type !== "boolean" && next_.type !== "nil") {
						this.runtimeError(`Cannot use type ${next_.value} as a boolean!`);
						return [InterpretResult.RUNTIME_ERROR];
					}

					if (next_.type === "nil" || next_.value === false) {
						frame.instruction += offset;
					}
					break;
				}
				case OpCode.JUMP: {
					const offset = this.readByte();
					frame.instruction += offset;
					break;
				}
				case OpCode.LOOP: {
					const offset = this.readByte();
					frame.instruction -= offset;
					break;
				}
				case OpCode.CALL: {
					const argCount = this.readByte();
					if (!this.callValue(this.peek(argCount), argCount)) {
						return [InterpretResult.RUNTIME_ERROR];
					}
					frame = this.getFrame();
					break;
				}
				case OpCode.CLOSURE: {
					const closure = this.readConstant() as RueClosure;
					for (let i = 0; i < closure.value.fn.value.upvalueCount; i++) {
						const isLocal = this.readByte();
						const index = this.readByte();
						if (isLocal === 1) {
							closure.value.upvalues[i] = this.captureUpvalue(index);
						} else {
							closure.value.upvalues[i] = this.getFrame().closure.value.upvalues[index];
						}
					}
					this.push(closure);
					break;
				}
				case OpCode.GET_UPVALUE: {
					const slot = this.readByte();
					this.push(this.getFrame().closure.value.upvalues[slot].value.value);
					break;
				}
				case OpCode.SET_UPVALUE: {
					const slot = this.readByte();
					this.getFrame().closure.value.upvalues[slot].value.value = this.peek(0);
					break;
				}
				default: {
					this.runtimeError(`Unknown instruction: ${instruction} @ ${this.getFrame().instruction}`);
					return [InterpretResult.RUNTIME_ERROR];
				}
			}
		}
	}
}

export namespace VirtualMachine {
	export function Interpret(source: string, natives?: Map<string, RueNative>): [InterpretResult, RueValue?] {
		const [success, fn] = Compile(source);
		if (success === false) return [InterpretResult.COMPILE_ERROR];

		const vm = new VM();

		if (natives) {
			natives.forEach((native, name) => {
				vm.globals.set(name, native);
			});
		}

		const callFrame = new CallFrame({ type: "closure", value: { fn, upvalues: [] } });
		vm.frames[vm.frameCount++] = callFrame;

		vm.push(fn);

		return vm.run();
	}
}

export enum InterpretResult {
	OK,
	COMPILE_ERROR,
	RUNTIME_ERROR,
}
