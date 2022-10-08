import { Chunk } from "../common/chunk";
import { TokenType } from "../common/token";
import { Parser } from "./parser";
import { Scanner } from "./scanner";

export function Compile(source: string, chunk: Chunk) {
	const scanner = new Scanner(source);
	const parser = new Parser(scanner, chunk);

	parser.advance();
	parser.expression();
	parser.consume(TokenType.EOF, "Expect end of expression.");
	parser.endCompiler();

	return !parser.hadError;
}
