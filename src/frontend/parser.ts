import { Chunk } from "../common/chunk";
import { Debug } from "../common/debug";
import { OpCode } from "../common/opcode";
import { Token, TokenType } from "../common/token";
import { RueValue } from "../common/value";
import { stringToDigit } from "../util";
import { Compiler } from "./compiler";
import { Scanner } from "./scanner";

type ParseFn = (parser: Parser, canAssign: boolean) => void;
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

	[TokenType.STRING]: [Precendence.NONE, string],
	[TokenType.IDENTIFIER]: [Precendence.NONE, variable],

	[TokenType.AND]: [Precendence.AND, undefined, and_],
	[TokenType.OR]: [Precendence.OR, undefined, or_],
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

function string(parser: Parser) {
	parser.emitConstant({
		type: "string",
		value: parser.previous.lexeme.substring(1, parser.previous.lexeme.length - 1),
	});
}

function and_(parser: Parser) {
	const endJump = parser.emitJump(OpCode.JUMP_IF_FALSE);
	parser.emitByte(OpCode.POP);
	parser.parsePrecedence(Precendence.AND);
	parser.patchJump(endJump);
}

function or_(parser: Parser) {
	const elseJump = parser.emitJump(OpCode.JUMP_IF_FALSE);
	const endJump = parser.emitJump(OpCode.JUMP);

	parser.patchJump(elseJump);
	parser.emitByte(OpCode.POP);

	parser.parsePrecedence(Precendence.OR);
	parser.patchJump(endJump);
}

function variable(parser: Parser, canAssign: boolean) {
	parser.namedVariable(parser.previous, canAssign);
}

export class Parser {
	constructor(public currentCompiler: Compiler, public scanner: Scanner, public compilingChunk: Chunk) {}
	public previous!: Token;
	public current!: Token;
	public hadError = false;
	public panicMode = false;

	currentChunk() {
		return this.compilingChunk;
	}

	errorAt(token: Token, message: string) {
		if (this.panicMode) return;

		let text = `[line ${token.line}] Error `;
		if (token.type === TokenType.EOF) {
			text += "at end";
		} else if (token.type !== TokenType.ERROR) {
			text += token.lexeme;
		}

		console.log(`${text} ${message}`);
		this.hadError = true;
		this.panicMode = true;
	}

	match(type: TokenType) {
		if (this.current.type !== type) return false;
		this.advance();
		return true;
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

	emitJump(instruction: OpCode) {
		this.emitByte(instruction);
		this.emitByte(0);
		return this.currentChunk().code.length - 1;
	}

	patchJump(offset: number) {
		const jump = this.currentChunk().code.length;
		this.currentChunk().code[offset] = jump - offset - 1;
	}

	emitLoop(loopStart: number) {
		this.emitByte(OpCode.LOOP);

		const offset = this.currentChunk().code.length - loopStart + 1;
		this.emitByte(offset);
	}

	startScope() {
		this.currentCompiler.scopeDepth++;
	}

	endScope() {
		this.currentCompiler.scopeDepth--;
		while (
			this.currentCompiler.localCount > 0 &&
			this.currentCompiler.locals[this.currentCompiler.localCount - 1].depth > this.currentCompiler.scopeDepth
		) {
			this.emitByte(OpCode.POP);
			this.currentCompiler.localCount--;
		}
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

		const canAssign = precedence <= Precendence.ASSIGNMENT;
		prefixRule(this, canAssign);

		while (precedence <= this.getRule(this.current.type)[0]) {
			this.advance();
			const infix = this.getRule(this.previous.type)[2] as ParseFn;
			if (infix) {
				infix(this, canAssign);
			}
		}

		if (canAssign && this.match(TokenType.EQUAL)) {
			this.errorAt(this.current, "Invalid assignment target.");
		}
	}

	parseVariable(err: string) {
		this.consume(TokenType.IDENTIFIER, err);

		this.declareVariable();
		if (this.currentCompiler.scopeDepth > 0) return 0;

		return this.identifierConstant(this.previous);
	}

	namedVariable(name: Token, canAssign: boolean) {
		let [getOp, setOp] = [OpCode.GET_LOCAL, OpCode.SET_LOCAL];
		let arg = this.resolveLocal(name.lexeme);

		if (arg === -1) {
			arg = this.identifierConstant(name);
			getOp = OpCode.GET_GLOBAL;
			setOp = OpCode.SET_GLOBAL;
		}

		if (canAssign && this.match(TokenType.EQUAL)) {
			this.expression();
			this.emitBytes(setOp, arg);
		} else {
			this.emitBytes(getOp, arg);
		}
	}

	identifierConstant(name: Token) {
		return this.currentChunk().addConstant({
			type: "string",
			value: name.lexeme,
		});
	}

	block() {
		while (this.current.type !== TokenType.RIGHT_BRACE && this.current.type !== TokenType.EOF) {
			this.declaration();
		}

		this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
	}

	expression() {
		this.parsePrecedence(Precendence.ASSIGNMENT);
	}

	expressionStatement() {
		this.expression();
		this.emitByte(OpCode.POP);
	}

	ifStatement() {
		this.expression();
		const thenJump = this.emitJump(OpCode.JUMP_IF_FALSE);
		this.emitByte(OpCode.POP);
		this.declaration();
		this.patchJump(thenJump);

		if (this.match(TokenType.ELSE)) {
			this.emitByte(OpCode.POP);
			const elseJump = this.emitJump(OpCode.JUMP);
			this.statement();
			this.patchJump(elseJump);
		}
	}

	whileStatement() {
		const loopStart = this.currentChunk().code.length;
		this.expression();

		const exitJump = this.emitJump(OpCode.JUMP_IF_FALSE);
		this.emitByte(OpCode.POP);

		this.declaration();

		this.emitLoop(loopStart);
		this.patchJump(exitJump);

		this.emitByte(OpCode.POP);
	}

	forStatement() {
		this.startScope();

		// Match for intializer
		if (this.match(TokenType.COMMA)) {
			// No initializer
		} else {
			if (this.match(TokenType.VAR)) {
				this.varDeclaration();
			} else {
				this.expressionStatement();
			}

			this.consume(TokenType.COMMA, "Expect ',' after loop intializer");
		}

		let loopStart = this.currentChunk().code.length;

		// Match for condition clause
		let exitJump = -1;
		if (!this.match(TokenType.COMMA)) {
			this.expression();
			this.consume(TokenType.COMMA, "Expect ',' after loop condition");

			exitJump = this.emitJump(OpCode.JUMP_IF_FALSE);
			this.emitByte(OpCode.POP);
		}

		// Match for increment
		if (!this.match(TokenType.COMMA)) {
			const bodyJump = this.emitJump(OpCode.JUMP);
			const incrementStart = this.currentChunk().code.length;

			this.expression();

			this.emitByte(OpCode.POP);
			this.emitLoop(loopStart);
			loopStart = incrementStart;
			this.patchJump(bodyJump);
		}

		this.declaration();
		this.emitLoop(loopStart);

		if (exitJump !== -1) {
			this.patchJump(exitJump);
			this.emitByte(OpCode.POP);
		}

		this.endScope();
	}

	statement() {
		this.expressionStatement();
	}

	varDeclaration() {
		const global = this.parseVariable("Expect Variable Name");

		if (this.match(TokenType.EQUAL)) {
			this.expression();
		} else {
			this.emitByte(OpCode.NIL);
		}

		this.defineVariable(global);
	}

	declaration() {
		if (this.match(TokenType.VAR)) {
			this.varDeclaration();
		} else if (this.match(TokenType.IF)) {
			this.ifStatement();
		} else if (this.match(TokenType.WHILE)) {
			this.whileStatement();
		} else if (this.match(TokenType.FOR)) {
			this.forStatement();
		} else if (this.match(TokenType.LEFT_BRACE)) {
			this.startScope();
			this.block();
			this.endScope();
		} else {
			this.statement();
		}

		if (this.panicMode) this.synchronize();
	}

	markInitialized() {
		this.currentCompiler.locals[this.currentCompiler.localCount - 1].depth = this.currentCompiler.scopeDepth;
	}

	addLocal(name: Token) {
		this.currentCompiler.locals[this.currentCompiler.localCount++] = {
			name: name.lexeme,
			depth: -1,
		};
	}

	defineVariable(global: number) {
		if (this.currentCompiler.scopeDepth > 0) {
			this.markInitialized();
			return;
		}
		this.emitBytes(OpCode.DEFINE_GLOBAL, global);
	}

	declareVariable() {
		if (this.currentCompiler.scopeDepth === 0) return;
		const name = this.previous;

		for (let i = this.currentCompiler.localCount - 1; i >= 0; i--) {
			const local = this.currentCompiler.locals[i];

			if (local.depth !== -1 && local.depth < this.currentCompiler.scopeDepth) {
				break;
			}

			if (local.name === name.lexeme) {
				this.errorAt(this.current, "Already a variable with this name in this scope!");
			}
		}

		this.addLocal(name);
	}

	resolveLocal(name: string) {
		for (let i = this.currentCompiler.localCount - 1; i >= 0; i--) {
			const local = this.currentCompiler.locals[i];
			if (local.name === name) {
				if (local.depth == -1) {
					this.errorAt(this.current, "Can't read local variable in its own initializer.");
				}

				return i;
			}
		}

		return -1;
	}

	advance() {
		this.previous = this.current;
		for (;;) {
			this.current = this.scanner.scanToken();
			if (this.current.type !== TokenType.ERROR) break;

			this.errorAt(this.current, this.current.lexeme);
		}
	}

	synchronize() {
		this.panicMode = false;

		while (this.current.type !== TokenType.EOF) {
			switch (this.current.type) {
				case TokenType.CLASS:
				case TokenType.FN:
				case TokenType.VAR:
				case TokenType.FOR:
				case TokenType.IF:
				case TokenType.WHILE:
				case TokenType.RETURN:
					return;
			}

			this.advance();
		}
	}

	endCompiler() {
		this.emitByte(OpCode.RETURN);
		if (Debug.DEBUG_TRACE_EXECUTION && !this.hadError) {
			Debug.DisassembleChunk(this.currentChunk(), "code");
		}
	}
}
