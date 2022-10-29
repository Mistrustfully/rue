import { Chunk } from "../common/chunk";
import { TokenType } from "../common/token";
import { Parser } from "./parser";
import { Scanner } from "./scanner";

type RueLocal = { name: string; depth: number };

export class Compiler {
	locals: RueLocal[] = [];
	localCount = 0;
	scopeDepth = 0;
}

export function Compile(source: string, chunk: Chunk) {
	const scanner = new Scanner(source);
	const compiler = new Compiler();

	const parser = new Parser(compiler, scanner, chunk);

	parser.advance();

	while (!parser.match(TokenType.EOF)) {
		parser.declaration();
	}

	parser.endCompiler();

	return !parser.hadError;
}
