import { Chunk } from "../common/chunk";
import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import { Token, TokenType } from "../common/token";
import { RueValue } from "../common/value";
import { stringToDigit } from "../util";
import { Scanner } from "./scanner";

type ParseFn = (parser: Parser) => void;
const DefaultRule = [Precendence.NONE];

const enum Precendence {
	NONE,
	ASSIGNMENT,
	OR,
	AND,
	EQUALITY,
	COMPARISON,
	TERM,
	FACTOR,
	UNARY,
	CALL,
	PRIMARY,
}

const rules: { [index in number]: [Precendence, ParseFn?, ParseFn?] } = {
	[TokenType.LEFT_PAREN]: [Precendence.NONE, grouping, undefined],
	[TokenType.MINUS]: [Precendence.TERM, unary, binary],
	[TokenType.PLUS]: [Precendence.TERM, undefined, binary],
	[TokenType.SLASH]: [Precendence.FACTOR, undefined, binary],
	[TokenType.STAR]: [Precendence.FACTOR, undefined, binary],
	[TokenType.NUMBER]: [Precendence.NONE, number, undefined],

	[TokenType.NIL]: [Precendence.NONE, literal],
	[TokenType.FALSE]: [Precendence.NONE, literal],
	[TokenType.TRUE]: [Precendence.NONE, literal],

	[TokenType.BANG]: [Precendence.NONE, unary],
	[TokenType.BANG_EQUAL]: [Precendence.EQUALITY, undefined, binary],
	[TokenType.EQUAL_EQUAL]: [Precendence.EQUALITY, undefined, binary],
	[TokenType.GREATER]: [Precendence.EQUALITY, undefined, binary],
	[TokenType.GREATER_EQUAL]: [Precendence.EQUALITY, undefined, binary],
	[TokenType.LESS]: [Precendence.EQUALITY, undefined, binary],
	[TokenType.LESS_EQUAL]: [Precendence.EQUALITY, undefined, binary],
};

function grouping(parser: Parser) {
	parser.expression();
	parser.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
}

function binary(parser: Parser) {
	const operatorType = parser.previous.type;
	const rule = parser.getRule(operatorType);
	parser.parsePrecedence(rule[0]);

	switch (operatorType) {
		case TokenType.PLUS:
			parser.emitByte(OpCode.ADD);
			break;
		case TokenType.MINUS:
			parser.emitByte(OpCode.SUBTRACT);
			break;
		case TokenType.STAR:
			parser.emitByte(OpCode.MULTIPLY);
			break;
		case TokenType.SLASH:
			parser.emitByte(OpCode.DIVIDE);
			break;
		case TokenType.BANG_EQUAL:
			parser.emitBytes(OpCode.EQUAL, OpCode.NOT);
			break;
		case TokenType.EQUAL_EQUAL:
			parser.emitBytes(OpCode.EQUAL);
			break;
		case TokenType.GREATER:
			parser.emitByte(OpCode.GREATER);
			break;
		case TokenType.GREATER_EQUAL:
			parser.emitBytes(OpCode.LESS, OpCode.NOT);
			break;
		case TokenType.LESS:
			parser.emitByte(OpCode.LESS);
			break;
		case TokenType.LESS_EQUAL:
			parser.emitBytes(OpCode.GREATER, OpCode.NOT);
			break;
	}
}

function number(parser: Parser) {
	const number = stringToDigit(parser.previous.lexeme);
	parser.emitConstant({ type: "number", value: number });
}

function unary(parser: Parser) {
	const operatorType = parser.previous.type;
	parser.parsePrecedence(Precendence.UNARY);

	switch (operatorType) {
		case TokenType.MINUS:
			parser.emitByte(OpCode.NEGATE);
			break;
		case TokenType.BANG:
			parser.emitByte(OpCode.NOT);
			break;
	}
}

function literal(parser: Parser) {
	switch (parser.previous.type) {
		case TokenType.FALSE:
			parser.emitByte(OpCode.FALSE);
			break;
		case TokenType.TRUE:
			parser.emitByte(OpCode.TRUE);
			break;
		case TokenType.NIL:
			parser.emitByte(OpCode.NIL);
			break;
	}
}

export class Parser {
	constructor(public scanner: Scanner, public compilingChunk: Chunk) {}
	public previous!: Token;
	public current!: Token;
	public hadError = false;
	public panicMode = false;

	currentChunk() {
		return this.compilingChunk;
	}

	errorAt(token: Token, message: string) {
		if (this.panicMode) return;

		let text = `[line ${token.line}] Error`;
		if (token.type === TokenType.EOF) {
			text += " at end";
		} else if (token.type !== TokenType.ERROR) {
			text += token.lexeme;
		}

		console.log(`${text} ${message}`);
		this.hadError = true;
		this.panicMode = true;
	}

	consume(type: TokenType, message: string) {
		if (this.current.type === type) {
			this.advance();
			return;
		}

		this.errorAt(this.current, message);
	}

	emitByte(byte: number) {
		this.currentChunk().write(byte, this.previous.line);
	}

	emitBytes(...bytes: number[]) {
		bytes.forEach((byte) => this.emitByte(byte));
	}

	emitConstant(constant: RueValue) {
		this.emitBytes(OpCode.CONSTANT, this.currentChunk().addConstant(constant));
	}

	getRule(type: TokenType) {
		return rules[type] || DefaultRule;
	}

	parsePrecedence(precedence: Precendence) {
		this.advance();
		const prefixRule = this.getRule(this.previous.type)[1] as ParseFn;
		if (!prefixRule) {
			this.errorAt(this.previous, "Expect expression.");
			return;
		}

		prefixRule(this);
		while (precedence <= this.getRule(this.current.type)[0]) {
			this.advance();
			const infix = this.getRule(this.previous.type)[2] as ParseFn;
			if (infix) {
				infix(this);
			}
		}
	}

	expression() {
		this.parsePrecedence(Precendence.ASSIGNMENT);
	}

	advance() {
		this.previous = this.current;
		for (;;) {
			this.current = this.scanner.scanToken();
			if (this.current.type !== TokenType.ERROR) break;

			this.errorAt(this.current, this.current.lexeme);
		}
	}

	endCompiler() {
		this.emitByte(OpCode.RETURN);
		if (Debug.DEBUG_TRACE_EXECUTION && !this.hadError) {
			Debug.DisassembleChunk(this.currentChunk(), "code");
		}
	}
}
