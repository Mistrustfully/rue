import { Chunk } from "./common/chunk";
import { OpCode } from "./common/opcode";
import { Debug as DebugCommon } from "./common/debug";
import { VirtualMachine } from "./vm";

namespace Rue {
	export const Debug = DebugCommon;
	export const VM = VirtualMachine;
}

const chunk = new Chunk();

chunk.write(OpCode.OP_CONSTANT, 0);
chunk.write(chunk.addConstant(10), 0);
chunk.write(OpCode.OP_RETURN, 1);

Rue.Debug.DisassembleChunk(chunk, "Test Chunk");
Rue.VM.Interpret(chunk);

export = Rue;
