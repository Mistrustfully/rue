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
var add = 0;

for var i = 0, i <= 3, i = i + 1 {
	add = i + add
}

assert(add == 6)
```

* Objects
```rs
var obj = {
    stuff: "Hello",
    stuff2: "World"
}

assert((obj.stuff + obj.stuff2) == "HelloWorld")
```

See the [tests](test) for examples on how to program in Rue!

