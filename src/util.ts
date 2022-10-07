export function padNumber(number: number, size: number) {
	let numberString = number.toString();

	while (numberString.length < size) {
		numberString = "0" + numberString;
	}

	return numberString;
}
