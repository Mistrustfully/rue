import readline = require("readline");
import Rue = require("..");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "> ",
});

rl.on("line", (line) => {
	Rue.VM.Interpret(line + " ");
});
