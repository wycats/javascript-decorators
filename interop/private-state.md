## Interoperability With Private Slots

In principle, this system could be retrofitted to work nicely with true
privates with one additional abstraction.

For this exploration, let's assume that the syntax for private
declarations is `#name [= initializer]` and the syntax for private usage
is `#name` or `receiver.#name`.

```js
class Person {
  @reader #first, #last;

  constructor(first, last) {
    #first = first;
    #last = last;
  }

  @reader get #fullName() {
    return `${#first} ${#last}`;
  }
}
```

#### Usage

```js
let person = new Person("Dmitry", "Lomov");
person.first // "Dmitry"
person.last // "Lomov"
person.fullName // "Dmitry Lomov"
```

#### Desugaring

```js
const PERSON_SLOTS = new WeakMap();

class Person {
  constructor(first, last) {
    let slots = { first: undefined, last: undefined };
    slots.first = first;
    slots.last = last;
    PERSON_SLOTS.set(this, slots);
  }
}

let target = Person.prototype;

decorate('slot', target, [reader], Slot(PERSON_SLOTS, 'first', null));
decoratePrivate(target, 'last', [reader], Slot(PERSON_SLOTS, 'last', null));
decoratePrivate(target, 'fullName', [reader], Slot(PERSON_SLOTS, { get: function() { /* ... */ }));
```

#### Decorator Descriptor Extensions

The decorator descriptors for fields, methods, and accessors are extended with an
additional `slot` boolean (true for slots, false otherwise). 

```diff
interface FieldDecoratorDescriptor<Class> extends DecoratorDescriptor<Class> {
  type: string,             // 'field'
  enumerable: boolean,      // default: true
  configurable: boolean,    // default: true
  writable: boolean,        // default: true
  property: DataProperty<Class>,

+ // true for private fields (#name = expr), false for public fields (name = expr)
+ slot: boolean
}

interface MethodDecoratorDescriptor<Class> extends DecoratorDescriptor<Class> {
  type: string,             // 'method'
  enumerable: boolean,      // default: false
  configurable: boolean,    // default: true
  writable: boolean,        // default: true
  property: MethodProperty<Class>,

+ // true for private methods (#name() {}), false for public methods (name() {})
+ slot: boolean
}

interface AccessorDecoratorDescriptor {
  type: string,             // 'accessor'
  hint: string,             // 'getter', 'setter', 'both'
  enumerable: boolean,      // default: true
  wrtiable: boolean,        // default: true 
  property: AccessorProperty<Class>,

+ // true for private accessors (get #name() {}), false for public accessors (get name() {})
+ slot: boolean
}
```

#### Updated Decorator Definition

With the addition of true private fields, we can update our decorator
definition to make it support true private fields as well as
"underscored" fake privates.

```js
function reader(target, descriptor) {
  let property = descriptor.property;
  let { slot, name } = property;

  let publicName = slot ? name : descriptor.name.slice(1);

  Object.defineProperty(target, publicName, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    get: function() { return property.get(this); }
  });

  // special meaning for object literal: { @reader _first }
  if (descriptor.shorthand) delete descriptor.initializer;
}
```

#### Private State Utilities

```js
function decoratePrivate(target, name, decorators, descriptor) {
  decorators.reduce((desc, decorator) => decorate(decorator, target, name, desc), descriptor)
}

function PrivateFieldDecoratorDescriptor(slots, name, initializer) {
  return {
    type: 'field',
    private: PrivateLookup(slots, name)
    initializer: initializer
  }
}

function PrivateMethodDecoratorDescriptor(slots, name, initializer) {
  return {
    type: 'method',
    private: PrivateLookup(slots, name),
    initializer: initializer
  }
}

function PrivateAccessorDecoratorDescriptor(slots, name, { get, set }) {
  let type;

  if (get && set) type = 'accessor';
  else if (get) type = 'getter';
  else type = 'setter';

  return { type, private: PrivateLookup(slots, name), get, set };
}

function PrivateLookup(slots, name) {
  return { for: (self) => slots.get(self)[name] };
}
```
