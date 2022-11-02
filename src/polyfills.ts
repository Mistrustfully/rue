import { RueValue } from "./common/value";

export function string_length(get: string) {
	return get.length;
}

export function array_length(get: Array<unknown>) {
	return get.length;
}

export function substring(string_: string, start: number, end_?: number) {
	return string_.substring(start, end_ !== undefined ? end_ : undefined);
}

export function char_at(string_: string, index: number) {
	return string_.charAt(index);
}

export function char_code_at(string_: string, index: number) {
	return string_.charCodeAt(index);
}

export function tostring_(string_: number): string {
	return string_.toString();
}

export function tonumber_(number: unknown): number | undefined {
	return Number(number);
}

// Screw it, since this function is used ONCE **EVER**, I'm just gonna hardcode the types.
export function reverse_array(array: RueValue[]): RueValue[] {
	return array.reverse();
}

export function printf(...strings: unknown[]) {
	console.log(...strings);
}
