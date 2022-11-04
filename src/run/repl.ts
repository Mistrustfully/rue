import readline = require("readline");
import Rue = require("..");
import std from "../std";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const vm = new Rue.VM();
vm.addLibrary("std", std);

rl.on("line", (line) => {
	console.log(line);
	console.log(vm.interpret(line + " "));
});
