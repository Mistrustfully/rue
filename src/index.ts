import { Debug as DebugCommon } from "./common/debug";
import { VM as VM_ } from "./backend/vm";

namespace Rue {
	export const Debug = DebugCommon;
	export const VM = VM_;
}

export = Rue;
