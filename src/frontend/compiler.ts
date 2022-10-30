import { Chunk } from "../common/chunk";
import { TokenType } from "../common/token";
import { RueFunction } from "../common/value";
import { Parser } from "./parser";
import { Scanner } from "./scanner";

type RueLocal = { name: string; depth: number };
export enum FunctionType {
	FUNCTION,
	SCRIPT,
}

export class Compiler {
	enclosing?: Compiler;
	function: RueFunction;

	locals: RueLocal[] = [];
	localCount = 0;
	scopeDepth = 0;

	constructor(fn: RueFunction, public type: FunctionType) {
		this.function = fn;
	}
}

export function Compile(source: string): [boolean, RueFunction] {
	const scanner = new Scanner(source);
	const compiler = new Compiler(
		{ type: "function", value: { arity: 0, name: "main", chunk: new Chunk() } },
		FunctionType.SCRIPT,
	);

	const parser = new Parser(compiler, scanner);

	parser.advance();

	while (!parser.match(TokenType.EOF)) {
		parser.declaration();
	}

	parser.endCompiler();

	return [!parser.hadError, compiler.function];
}
