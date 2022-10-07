# rue
An interpreted programming language written in Typescript.

Example:

```ts
use {std::print}

fn fib(n) {
	print(n)
	
	if(num < 2) {
        return n
    }
    else {
        return fib(n-1) + fib(n - 2)
    }
}

fib(5)
```
