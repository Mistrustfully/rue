# rue
An interpreted programming language written in Typescript.


## Features
* Use Statements
```rs
use std.(print, assert)

print("Hello World!")
assert(1 == 1)
```

* Functions
```rs
use std.assert

fn fib() {
	if n <= 2 {
		return 1
	}

	return fib(n - 1) + fib(n - 2)
}

assert(fib(9) == 34)
```

* For Loops
```rs
use std.assert

var add = 0;

for var i = 0, i <= 3, i = i + 1 {
	add = i + add
}

assert(add == 6)
```

* Objects
```rs
use std.assert

var obj = {
    stuff: "Hello",
    stuff2: "World"
}

assert((obj.stuff + obj.stuff2) == "HelloWorld")
```

See the [tests](test) for examples on how to program in Rue!

## Integration

* Running Code
```ts
import Rue from "rue"

const vm = new Rue.VM()
vm.interpet("return 1 + 1")
```

* Using the standard library
```ts
import Rue from "rue"

const vm = new Rue.VM()
vm.addLibrary("std", Rue.std)
vm.interpet(`print("Hello World!")`)
```

* Creating your own library
```ts
import Rue from "rue"

const lib = {
    customFn: {
        type: "nativeFunction"
        value: (param1, param2) => {
            if (param1.type !== "number" || param2.type !== "number") return { type: "error", value: "Cannot add non numbers!" }
            return { type: "number", value: param1.value + param2.value}
        }
    }
}

const vm = new Rue.VM()
vm.addLibrary("std", Rue.std)
vm.addLibrary("mylib", lib)
vm.interpet(`print(customFn(1 + 1))`)
```
