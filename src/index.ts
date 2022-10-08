import { Debug as DebugCommon } from "./common/debug";
import { VirtualMachine } from "./backend/vm";

namespace Rue {
	export const Debug = DebugCommon;
	export const VM = VirtualMachine;
}

export = Rue;
