This document illustrates two major goals for the property decorator
proposal:

1. It should be possible to write general-purpose decorators that work
   across all of the different syntactic forms for creating declarative
   properties in JavaScript (both classes and object literals).
2. Decorators implement syntactic abstractions, and therefore receive
   information about the syntactic form they are decorating.

## Motivating Example

To illustrate, I'll write a decorator called `reader` that decorates a
property beginning with an `_` and creates a public getter for that
property without an `_`.

Here's the decorator definition:

```js
function reader(target, descriptor) {
  let { enumerable, configurable, property: { name, get }, hint } = descriptor;

  // extractPublicName('_first') === 'first'
  let publicName = extractPublicName(name() /* extract computed property */);

  // define a public accessor: get first() { return this._first; }
  Object.defineProperty(target, publicName, {
    // give the public reader the same enumerability and configurability
    // as the property it's decorating
    enumerable, configurable, get: function() { return get(this, name); }
  });
  
  return descriptor;
}

function extractPublicName(name) {
  // _first -> first
  return name.slice(1);
}
```

> For those of you thinking this is weak tea without true private state,
> I have a treat for you in this repository: how this decorator could be
> extended to work with hypothetical true private state. In the
> meantime, bear with me.

Next, we'll explore how this definition works on each kind of
declarative property creation in JavaScript.

## Basic Rules of Decorators

Decorators always operate on a particular syntactic element,
providing a hook into the runtime semantics for that syntax.

If the runtime semantics for the syntax include "let x be the
result of evaluating *SomeExpression*`, that expression is passed
into the decorator as a function that, when called, evaluates the
expression (a "thunk").

Decorators are not macros: they cannot introduce new bindings into
the scope and cannot see any downstream syntax. They are restricted
to operating on a local declaration using reflection tools.

## The Programming Model of Decorators

Decorators allow library and framework authors to provide abstractions
that extend the JavaScript syntax, but only in controlled ways, and
only by using a distinguished syntax.

Property decorators (including method decorators) can change the property
being installed or install other properties alongside it, always operating
on inert values.

Decorators that simply attach metadata to a property without altering it
or defining any additional properties on the target can be documented
simply.

Other decorators will be documented in terms of their effects on the
target, which might include completely replacing the property they
are decorating, wrapping it, or installing other properties.

## Usage With Property Declarations in JavaScript

The examples below use a few library functions that are defined in an
appendix, which will be explained the first time they are encountered.

## Initialized Property Declarations

```js
class Person {
  @reader _first = "Andreas";
  @reader _last = "Rossberg";
}
```

#### Usage

```js
let andreas = new Person();
andreas.first // "Andreas"
andreas.last // "Rossberg"
```

#### Resulting Class

```js
class Person {
  _first = "Andreas";
  _last = "Rossberg";

  get first() { return this._first; }
  get last() { return this._last; }
}
```

#### Desugaring

```js
class Person {}

let target = Person.prototype;

decorate('field', target, [reader], Property('_first', () => "Andreas"));
decorate('field', target, [reader], Property('_last', () => "Rossberg"));
```

#### The `decorate` and `Property` Utilities

The `decorate` function constructs a decorator descriptor for the appropriate type,
and calls the array of decorators in reverse order, passing the decorator descriptor
returned in the previous step into the next step.

The final descriptor is used to construct the arguments for an invocation of
`Object.defineProperty` or `Reflect.defineField`.

You can find full details in the appendix. 

```ts
// type is "field" | "property" | "accessor" | "method"
// different for each combination of defaults passed to defineProperty or defineField
function decorate(type: string, target: any, decorators: Decorator[], property: Property, hint=null: string);

// A Decorator is a function that takes a target and a decorator descriptor and return
// an optional decorator descriptor.
type Decorator = (target: Object, descriptor: DecoratorDescriptor): DecoratorDescriptor;

// The full list of `DecoratorDescriptor`s are listed in the appendix
```

## Initialized Computed Property Declarations

```js
const first = Symbol('first');
const last = Symbol('last');

class Person {
  @reader [first] = "Andreas";
  @reader [last] = "Rossberg";
}
```

#### Usage

```js
let andreas = new Person();
andreas.first // "Andreas"
andreas.last // "Rossberg"
```

#### Resulting Class

```js
const first = Symbol('first');
const last = Symbol('last');

class Person {
  [first] = "Andreas";
  [last] = "Rossberg";

  get first() { return this[first]; }
  get last() { return this[last]; }
}
```

#### Desugaring

```js
const first = Symbol('first');
const last = Symbol('last');

class Person {}

let target = Person.prototype;

decorate('field', target, [reader], Property(first, () => "Andreas"));
decorate('field', target, [reader], Property(last, () => "Rossberg"));
```

#### Updated Decorator

Let's update the decorator to handle symbols used for harder-to-access
"private" fields.

```diff
function reader(target, descriptor) {
  let { enumerable, configurable, property: { name, get }, hint } = descriptor;

  // extractPublicName('_first') === 'first'
  let publicName = extractPublicName(name() /* extract computed property */);

  // define a public accessor: get first() { return this._first; }
  Object.defineProperty(target, publicName, {
    // give the public reader the same enumerability and configurability
    // as the property it's decorating
    enumerable, configurable, get: function() { return get(this, name); }
  });
}

function extractPublicName(name) {
+ // Symbol(first) -> first
+ if (typeof name === 'symbol') return String(name).slice(7, -1);
+
  // _first -> first
  return name.slice(1);
}
```

## Uninitialized Field Declarations

```js
class Person {
  @reader _first, _last;

  constructor(first="Waldemar", last="Horwat") {
    this._first = first;
    this._last = last;
  }
}
```

#### Usage

```js
let waldemar = new Person();
waldemar.first // "Waldemar"
waldemar.last // "Horwat"

let jeff = new Person("Jeff", "Morrison");
jeff.first // "Jeff"
jeff.last // "Morrison"
```

#### Resulting Class

```js
class Person {
  _first, _last;

  constructor(first="Waldemar", last="Horwat") {
    this._first = first;
    this._last = last;
  }

  get first() { return this._first; }
  get last() { return this._last; }
}
```

#### Desugaring

```js
class Person {}

let prototype = Person.prototype;

decorate(target, 'field', [reader], Property('_first'));
decorate(target, 'field', [reader], Property('_last'));
```

## Initialized Static Properties

```js
class Person {
  @reader static _first = "Brendan";
  @reader static _last = "Eich";
}
```

#### Usage

```js
let brendan = Person;
brendan.first // "Brendan"
brendan.last // "Eich"
```

#### Resulting Class

```js
class Person {
  static _first = "Brendan";
  static _last = "Eich";

  static get first() { return this._first; }
  static get last() { return this._last; }
}
```

#### Desugaring:

```js
class Person {}

let target = Person;

decorate(target, 'property', [reader], Property('_first', () => "Brendan"), 'static');
decorate(target, 'property', [reader], Property('_last', () => "Eich"), 'static');
```

## Uninitialized Static Properties

```js
class Person {
  static @reader _first, _last;
}
```

#### Usage

```js
let jonathan = Person;

jonathan.first // undefined

Object.assign(jonathan, { _first: "Jonathan", _last: "Turner" });

jonathan.first // "Jonathan"
Jonathan.last // "Turner"
```

#### Resulting Class

```js
class Person {
  static _first, _last;

  static get first() { return this._first; }
  static get last() { return this._last; }
}
```

#### Desugaring

```js
class Person {}

let target = PersonF;

decorate(target, 'property', [reader], Property('_first'), 'static');
decorate(target, 'property', [reader], Property('_last'), 'static');
```

## Initialized Properties in Object Literals

```js
let person = {
  @reader _first: "Mark",
  @reader _last: "Miller"
}
```

#### Usage

```js
person.first // "Mark"
person.last // "Miller"
```

#### Resulting Object

```js
let person = {
  _first: "Mark",
  _last: "Miller",

  get first() { return this._first; },
  get last() { return this._last; }
}
```

#### Desugaring

```js
let person = {};

let target = person;

decorate(target, 'property', [reader], Property('_first', () => "Mark"), 'explicit'));
decorate(target, 'property', [reader], Property('_last', () => "Miller"), 'explicit'));
```

## Methods

The same decorator would work on methods.

```js
const first = Symbol("first"), last = Symbol("last"), update = Symbol("update");

class Person {
  @reader [first], [last];

  constructor(first, last) {
    this[first] = first;
    this[last] = last;
  }

  @reader [update](first, last) {
    this[first] = first;
    this[last] = last;
  }
}
```

#### Usage

```js
let alex = new Person("Alex", "Russell");
alex.first // "Alex"
alex.update("Alexander", "Russell");
alex.first // "Alexander"
```

#### Resulting Class

```js
const first = Symbol("first"), last = Symbol("last"), update = Symbol("update");

class Person {
  [first], [last];

  constructor(first, last) {
    this[first] = first;
    this[last] = last;
  }

  [update](first, last) {
    this[first] = first;
    this[last] = last;
  }

  get first() {
    return this[first];
  }

  get last() {
    return this[last];
  }

  get update() {
    return this[update];
  }
}
```

#### Desugaring

```js
const first = Symbol("first"), last = Symbol("last"), update = Symbol("update");

class Person {
  constructor(first, last) {
    this[first] = first;
    this[last] = last;
  }
}

let target = Person.prototype;

decorate(target, 'field',  [reader], Property('_first'));
decorate(target, 'field',  [reader], Property('_last'));
decorate(target, 'method', [reader], Property('_update', () => function _update() { /* ... */ }));
```

## Getters

It would also work just fine with getters:

```js
class Person {
  @reader _first, last;

  constructor(first, last) {
    this._first = first;
    this._last = last;
  }

  @reader get _fullName() {
    return `${this._first} ${this._last}`;
  }
}
```

#### Usage

```js
let jason = new Person("Jason", "Orendorff");

jason.first // "Jason"
jason.last // "Orendorff"
jason.fullName // "Jason Orendorff"

jason.update("JSON", "Orendorff")
jason.first // "JSON"
jason.fullName // "JSON Orendorff"
```

#### Resulting Class

```js
class Person {
  constructor(first, last) {
    this._first = first;
    this._last = last;
  }

  get _fullName() {
    return `${this._first} ${this._last}`;
  }

  get first() {
    return this._first;
  }

  get last() {
    return this._last;
  }

  get fullName() {
    return this._fullName;
  }
}
```

#### Desugaring

```js
class Person {
  constructor(first, last) {
    this._first = first;
    this._last = last;
  }
}

let target = Person.prototype;

decorate(target, 'field',    [reader], Property('_first'));
decorate(target, 'field',    [reader], Property('_last'));
decorate(target, 'accessor', [reader], Property({ get() { /* ... */ } }), 'getter');
```

## "Uninitialized" Properties in Object Literals

```js
let person = {
  @reader _first,
  @reader _last
}
```

#### Usage

```js
person.first // "undefined"

Object.assign(person, { _first: "Brian", _last: "Terlson" });

person.first // "Brian"
person.last // "Terlson"
```

#### Resulting Object

```
let person = {
  _first: undefined,
  _last: undefined,

  get first() { return this._first; },
  get last() { return this._last; }
}
```

#### Desugaring

```js
let person = {};

let target = person;

decorate(target, 'property', [reader], Property('_first', () => _first), 'shorthand');
decorate(target, 'property', [reader], Property('_last', () => _last, 'shorthand');
```

#### Updated Decorator

Let's update the decorator to handle shorthand properties interpreted by
the decorator as uninitialized fields.

```diff
function reader(target, descriptor) {
  let { enumerable, configurable, property: { name, get }, hint } = descriptor;

  // extractPublicName('_first') === 'first'
  let publicName = extractPublicName(name() /* extract computed property */);

  // define a public accessor: get first() { return this._first; }
  Object.defineProperty(target, publicName, {
    // give the public reader the same enumerability and configurability
    // as the property it's decorating
    enumerable, configurable, get: function() { return get(this, name); }
  });

+ // if we're looking at { @reader _first }, interpret it as { @reader _first: undefined }
+ if (hint === 'shorthand') descriptor.initializer = null;
}

function extractPublicName(name) {
  // Symbol(first) -> first
  if (typeof name === 'symbol') return String(name).slice(7, -1);

  // _first -> first
  return name.slice(1);
}
```

#### Note: Static Properties, Object Literal Shorthand, and Hints

The decorator descriptors for static properties and object literal
properties are the same, since both describe an immediate installation
of a property onto a target.

As we've seen, to help a decorator distinguish between the contexts for
high-fidelity syntactic abstractions, the data decorator descriptor
contains an additional `hint` field, which is one of:

* `static` for static class properties
* `shorthand` for object literal properties defined via shorthand (`{
  @reader _first }`)
* `explicit` for object literal properties defined with an explicit
  initializer (`{ @reader _first: "Yehuda" }`)

## Methods

The same decorator would work on methods.

```js
class Person {
  @reader _first, _last;

  constructor(first, last) {
    this._first = first;
    this._last = last;
  }

  @reader _update(first, last) {
    this._first = first;
    this._last = last;
  }
}
```

#### Usage

```js
let alex = new Person("Alex", "Russell");
alex.first // "Alex"
alex.update("Alexander", "Russell");
alex.first // "Alexander"
```

#### Resulting Class

```js
class Person {
  _first, _last;

  constructor(first, last) {
    this._first = first;
    this._last = last;
  }

  _update({ first, last }) {
    this._first = first;
    this._last = last;
  }

  get first() {
    return this._first;
  }

  get last() {
    return this._last;
  }

  get update() {
    return this._update;
  }
}
```

#### Desugaring

```js
class Person {
  constructor(first, last) {
    this._first = first;
    this._last = last;
  }
}

let target = Person.prototype;

decorate(target, 'field',  [reader], Property('_first'));
decorate(target, 'field',  [reader], Property('_last'));
decorate(target, 'method', [reader], Property('_update', () => function _update() { /* ... */ }));
```

## Appendix: Making `PropertyDefinitionEvaluation` Decoratable

As an illustration, we'll make `PropertyDefinitionEvaluation` decoratable. The basic
strategy is to run the decorators before the first expression evaluation, passing the
unevaluated expression into the decorator as a function that, when called, evaluates
the expression.

> This has the rough intuition of "wrap any expressions in the decorated declaration
> in an arrow automatically".

---

First, the existing definition of `PropertyDefinition : PropertyName : AssignmentExpression`

1. Let *propKey* be the result of evaluating *PropertyName*.
2. `ReturnIfAbrupt(propKey)`.
3. Let *exprValueRef* be the result of evaluating *AssignmentExpression*.
4. Let *propValue* be `GetValue(exprValueRef)`.
5. `ReturnIfAbrupt(propValue)`.
6. If `IsAnonymousFunctionDefinition(AssignmentExpression)` is `true`, then
   a. Let *hasNameProperty* be `HasOwnProperty(propValue, "name")`.
   b. `ReturnIfAbrupt(hasNameProperty)`.
   c. If *hasNameProperty* is `false`, perform `SetFunctionName(propValue, propKey)`.
7. Assert: *enumerable* is true.
8. Return `CreateDataPropertyOrThrow(object, propKey, propValue)`.

### DecoratedPropertyDefinition

What we're going to do is create a new `DecoratedPropertyDefinition`, which looks
like this:

```js
DecoratedPropertyDefinition: DecoratorExpression+ PropertyDefinition;
```

In this case, we we see that Step 1 of the original algorithm evaluates an expression,
so the decorator must intercede at the very beginning of the process.

The two top-level expressions in the decorated `PropertyDefinition` are `PropertyName`
(which can be a computed property) and `AssignmentExpression`.

For `DecoratedPropertyDefinition`, the first step is to reify each of the two expressions
into a function that, when called, evaluates the expression (a "thunk").

### Main Algorithm

The following algorithm uses the suffix `?` as a shorthand for `ReturnIfAbrupt`.

---

1. Let *propertyNameThunk* = `Thunk(PropertyName)`
2. Let *assignmentExpressionThunk* = `Thunk(AssignmentExpression)`
3. Let *decoratorDescriptor* = `PropertyDefinitionDescriptor(propertyNameThunk, assignmentExpressionThunk)`
4. For each `DecoratorExpression`, in reverse order:
  1. Let *decorator* = `GetValue(Evaluate(DecoratorExpression))?`
  2. Let *possibleDescriptor* = `Call(decorator, [object, decoratorDescriptor])?`
  3. If *possibleDescriptor* is not `undefined`, *decoratorDescriptor* = *possibleDescriptor*.
5. Let *property* = `Get(decoratorDescriptor, 'property')?`
6. Let *updatedPropertyNameThunk* = `Get(property, 'name')?`
7. Let *initializer* = `Get(property, 'initializer')?`
6. Let *propName* = `Call(updatedPropertyNameThunk)?`
7. Let *enumerable* = `Get(decoratorDescriptor, 'enumerable')?`
8. Let *configurable* = `Get(decoratorDescriptor, 'configurable')?`
9. Let *writable* = `Get(decoratorDescriptor, 'writable')?`
10. If `IsCallable(initializer)`:
  1. Let *value* = `Call(initializer)?`
  2. Return `object.[[DefineOwnProperty]](propName, { value, enumerable, configurable, writable })?`
11. Otherwise, if `Type(initializer)` is Object:
  1. If `'get'` not in *initializer* and `'set'` not in *initializer*, throw a TypeError
  2. Let *get* = `Get(initializer, 'get')?`
  3. Let *set* = `Get(initializer, 'set')?`
  4. Return `object.[[DefineOwnProperty]](propName, { get, set, enumerable, configurable, writable })?`
12. Otherwise, if *initializer* is `null`, return
13. Otherwise, throw a TypeError

---

#### Algorithm: PropertyDefinitionDescriptor(nameThunk, valueThunk, getter, setter)

1. Let *object* = `ObjectCreate(%ObjectPrototype%)`
2. `CreateDataProperty(object, 'name', nameThunk)?`
3. `CreateDataProperty(object, 'initializer', valueThunk)?`
4. Let *decoratorGetter* = `new DecoratorGetter`
5. `decoratorGetter.[[Name]] = nameThunk`
6. `CreateDataProperty(object, 'get', decoratorGetter)?`
7. Let *decoratorSetter* = `new DecoratorSetter`
8. `decoratorSetter.[[Name]] = nameThunk`
9. `CreateDataProperty(object, 'set', decoratorSetter)?`
10. Return *object*

#### The DecoratorGetter Exotic Object

Internal Slots:

| Internal Slot    | Type              | Description |
| ---------------- | ----------------- | ----------- |
| `[[Name]]`       | ThunkedExpression | A thunk that, when called, returns a string |

##### [[Call]] (thisArgument, [ object ])

1. Let *name* = `Call(this.[[Name]])?`
2. Return `Get(object, name)?`

#### The DecoratorSetter Exotic Object

| Internal Slot    | Type              | Description |
| ---------------- | ----------------- | ----------- |
| `[[Name]]`       | ThunkedExpression | A thunk that, when called, returns a string |

##### [[Call]] (thisArgument, [ object, value ])

1. Let *name* = `Call(this.[[Name]])`
2. Return `Set(object, name, value, false)?`

---

#### Algorithm: Thunk(Expression)

1. Let *thunk* = new ThunkedExpression (exotic object)
2. *thunk.[[Expression]]* = Expression
3. Return *thunk*

---

#### The Thunk Exotic Object

Internal Slots:

| Internal Slot    | Type        | Description |
| ---------------- | ----------- | ----------- |
| `[[Expression]]` | Expression  | An unevaluated expression |
| `[[Value]]`      | any         | The value of the JavaScript reference, once evaluated |

##### [[Call]]

1. If `this.[[Value]]` is populated, return `this.[[Value]]`
2. Let *value* = `GetValue(Evaluate(this.[[Expression]]))?`
3. `this.[[Value]]` = *value*
4. Return *value*

---

### Pseudo-Code

Described as pseudo-TypeScript, reifying unevaluated expressions into JavaScript values.

```ts
function PropertyDefinitionEvaluation(object: Object, decorators: Decorator[], definition: PropertyDefinition) {
  let propertyNameThunk = new Thunk(definition.PropertyName);
  let expressionThunk = new Thunk(definition.AssignmentExpression);

  let initialDescriptor = {
    type: 'property',
    enumerable: true,
    configurable: true,
    writable: true,
    property: {
      name: propertyNameThunk,
      initializer: expressionThunk,
      get(obj) { return obj[Call(propertyNameThunk)]; },
      set(obj, val) { obj[Call(propertyNameThunk)] = val; }
    }
  };

  let descriptor = decorators.reverse().reduce((descriptor, decorator) => {
    let possibleDescriptor = Evaluate(decorator)(object, descriptor);
    return possibleDescriptor === undefined ? descriptor : possibleDescriptor;
  }, initialDescriptor);

  let { enumerable, configurable, writable, property } = descriptor;
  let name = Call(property.name);
  let initializer = property.initializer;
  
  if (initializer === null) return;
  
  if (typeof 'initializer' === 'function') {
    let value = Call(initializer);
    Object.defineProperty(obj, name, { value, enumerable, configurable, writable });
  } else if (typeof initializer === 'object') {
    let { get, set } = property;
    Object.defineProperty(obj, name, { get, set, enumerable, configurable, writable });
  } else {
    throw new TypeError(); 
  }
}

const EMPTY_SENTINEL = function() {};

function Thunk {
  let value = EMPTY_SENTINEL;
  return function() {
    if (value === EMPTY_SENTINEL) value = Evaluate(expression);
    return value;
  }
}
```

---

## Appendix: Decorator Descriptor List

##### Decorator Descriptor Interfaces

The shared interface for all decorator descriptors:

```ts
interface DecoratorDescriptor<Class> {
  type: string,             // 'property' | 'field' | 'method' | 'accessor'
  configurable: boolean,    // default: true
  enumerable: boolean,      // default: true except for methods
  property: Property<Class>
}
```

---

```ts
interface PropertyDecoratorDescriptor<Class> extends DecoratorDescriptor<Class> {
  type: string,             // 'property'
  hint: string,             // 'shorthand' or 'explicit' or 'static'
  enumerable: boolean,      // default: true
  configurable: boolean,    // default: true
  writable: boolean,        // default: true
  property: DataProperty<Class>
}

interface FieldDecoratorDescriptor<Class> extends DecoratorDescriptor<Class> {
  type: string,             // 'field'
  enumerable: boolean,      // default: true
  configurable: boolean,    // default: true
  writable: boolean,        // default: true
  property: DataProperty<Class>
}

interface MethodDecoratorDescriptor<Class> extends DecoratorDescriptor<Class> {
  type: string,             // 'method'
  enumerable: boolean,      // default: false
  configurable: boolean,    // default: true
  writable: boolean,        // default: true
  property: MethodProperty<Class>
}

interface AccessorDecoratorDescriptor<Class> {
  type: string,             // 'accessor'
  hint: string,             // 'getter', 'setter', 'both'
  enumerable: boolean,      // default: true
  wrtiable: boolean,        // default: true 
  property: AccessorProperty<Class>
}
```

##### Property Interfaces

The shared interface for the `property` member of all decorator descriptors.

```ts
interface Property<Class> {
  name: () => string;            // the name of the property, as a thunk (computed properties)
  initializer: any;              // the initializer for the property, as a thunk for expressions
  get(obj: Class): any;          // a function that gets the property for an object (future-proof for slots)
  set(obj: Class, value: any);   // a function that sets the property for an object (future-proof for slots)
}
```

---

```
interface DataProperty<Class> extends Property<Class> {
  // for a property, field or static field, the initializer is a thunk of the expression
  initializer?: () => any;
}

interface MethodProperty<Class> extends Property<Class> {
  // for a method, the initializer is the function
  initializer: function,
}

interface AccessorProperty<Class> extends Property<Class> {
  // for an accessor, the intializer is an object containing the `get` and `set` functions
  initializer: { get: () => any, set: (any) => void },
}
```

---

## Appendix: Assumed Library APIs

Since this proposal is on a parallel track with declarative fields, it
assumes the following APIs:

* `Reflect.defineField(constructor, name, desc: FieldDescriptor)`
* `Reflect.getFieldDescriptor(constructor, name): FieldDescriptor)`
* `Reflect.getOwnFieldDescriptor(constructor, name): FieldDescriptor)`

```ts
interface FieldDescriptor {
  initializer: Initializer, // nullable
  enumerable: boolean,
  configurable: boolean,
  writable: boolean
}

interface Initializer {
  (): any // thunk
}
```

---

## Appendix: General Purpose Utilities

The defininition of the utilities used throughout the rest of this document.

```js
const DESCRIPTOR_DEFAULTS = {
  method:   { enumerable: false, configurable: true, writable: true },
  field:    { enumerable: true, configurable: true, writable: true },
  property: { enumerable: true, configurable: true, writable: true },
  accessor: { enumerable: true, configurable: true }
}

export function decorate(type, target, decorators, property, hint) {
  let desc = Object.assign({ type, hint, property }, DESCRIPTOR_DEFAULTS[type]);

  descriptor = decorators.reverse()
    .reduce((desc, decorator) => applyDecorator(decorator, target, desc), desc)

  let { enumerable, configurable, writable, initializer, get, set, property: { name } } = descriptor;
  name = name(); // computed properties

  if ('initializer' in descriptor) {
    assert(!('get' in descriptor) && !('set' in descriptor), TypeError);
    let value = initializer();
    define(type, target, name, { value, enumerable, configurable, writable });
  } else if ('get' in descriptor || 'set' in descriptor) {
    Object.defineProperty(target, name, { get, set, enumerable, configurable, writable });
    return;
  } else {
    throw new TypeError("Your decorator must return a descriptor with an initializer or an accessor"); 
  }
}

function define(type, target, name, descriptor) {
  if (type === 'field') Reflect.defineField(target, name, descriptor);
  else Object.defineProperty(target, name, descriptor);
}

function applyDecorator(decorator, target, _descriptor) {
  descriptor = decorator(target, _descriptor);
  if (descriptor === undefined) return _descriptor;
  return descriptor;
}

export function Property(name, initializer=null) {
  return {
    name: typeof name === 'function' ? name : () => name,
    initializer,
    get(obj) { return obj[name]; },           // future-proof for slots
    set(obj, value) { obj[name] = value; }    // future-proof for slots
  }
}
```
