export class Token {
	constructor(public type: TokenType, public lexeme: string, public line: number) {}
}

export const enum TokenType {
	LEFT_PAREN,
	RIGHT_PAREN,
	LEFT_BRACE,
	RIGHT_BRACE,
	COMMA,
	DOT,
	MINUS,
	PLUS,
	SLASH,
	STAR,

	COLON,
	SCOPE,
	BANG,
	BANG_EQUAL,
	EQUAL,
	EQUAL_EQUAL,
	GREATER,
	GREATER_EQUAL,
	LESS,
	LESS_EQUAL,

	IDENTIFIER,
	STRING,
	NUMBER,

	AND,
	CLASS,
	ELSE,
	FALSE,
	FOR,
	FN,
	MIXIN,
	IF,
	NIL,
	OR,
	RETURN,
	THIS,
	TRUE,
	VAR,
	WHILE,
	USE,

	ERROR,
	EOF,
}
