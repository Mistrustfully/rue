import { string_length, tostring_, tonumber_, char_code_at } from "./polyfills";

export function padNumber(number: number, size: number) {
	let numberString = tostring_(number);

	while (string_length(numberString) < size) {
		numberString = "0" + numberString;
	}

	return numberString;
}

export function isDigit(c: string) {
	return char_code_at(c, 0) >= char_code_at("0", 0) && char_code_at(c, 0) <= char_code_at("9", 0);
}

export function isAlpha(c: string) {
	return (
		(char_code_at(c, 0) >= char_code_at("a", 0) && char_code_at(c, 0) <= char_code_at("z", 0)) ||
		(char_code_at(c, 0) >= char_code_at("A", 0) && char_code_at(c, 0) <= char_code_at("Z", 0)) ||
		char_code_at(c, 0) === char_code_at("_", 0)
	);
}

export function stringToDigit(c: string) {
	return tonumber_(c);
}
