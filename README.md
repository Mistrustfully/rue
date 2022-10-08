# rue
An interpreted programming language written in Typescript.

## Planned Features

[ ] Functions
```rs
use {std::print}

fn hello_world() {
    print("Hello World")
}

hello_world()
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

