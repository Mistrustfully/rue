# rue
An interpreted programming language written in Typescript.


## Features
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

See the [tests](test) for examples on how to program in Rue!

## Planned Features

[ ] Use keyword
```rs
use {std::print}
print("Hello World")
```

[ ] Classes
```rs
use {std::print}

class Person {
    private name;
    sayName() {
        print(this.name)
    }
    
    new(name) {
        this.name = name
    }
}

var person = Person::new()
person.sayName()
```

[ ] Traits
```rs
use {std::print}

trait Speaks {
    say(text) {
        print(text)
    }
}

trait Greets {
    greet() {
        print(this.name)
    }
}

class Person: Speaks, Greets {
    private name;
    new(name) {
        this.name = name
    }
}

class Dog: Speaks {}

var dog = Dog::new()
var person = Person::new()

dog.say("Woof!")

person.say("Hello!")
person.greet()
```

