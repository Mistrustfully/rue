export function padNumber(number: number, size: number) {
	let numberString = number.toString();

	while (numberString.length < size) {
		numberString = "0" + numberString;
	}

	return numberString;
}

export function isDigit(c: string) {
	return c.charCodeAt(0) >= "0".charCodeAt(0) && c.charCodeAt(0) <= "9".charCodeAt(0);
}

export function isAlpha(c: string) {
	return (
		(c.charCodeAt(0) >= "a".charCodeAt(0) && c.charCodeAt(0) <= "z".charCodeAt(0)) ||
		(c.charCodeAt(0) >= "A".charCodeAt(0) && c.charCodeAt(0) <= "Z".charCodeAt(0)) ||
		c.charCodeAt(0) == "_".charCodeAt(0)
	);
}

export function stringToDigit(c: string) {
	return Number(c);
}
