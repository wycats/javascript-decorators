> This file is under active development. Refer to `interop/reusability.md` for the
> most up to date description.

# Summary

Decorators make it possible to annotate and modify classes and properties at
design time.

While ES5 object literals support arbitrary expressions in the value position,
ES6 classes only support literal functions as values. Decorators restore the
ability to run code at design time, while maintaining a declarative syntax.

# Detailed Design

A decorator is:

* an expression
* that evaluates to a function
* that takes the target, name, and decorator descriptor as arguments
* and optionally returns a decorator descriptor to install on the target object

Consider a simple class definition:

```js
class Person {
  name() { return `${this.first} ${this.last}` }
}
```

Evaluating this class results in installing the `name` function onto
`Person.prototype`, roughly like this:

```js
Object.defineProperty(Person.prototype, 'name', {
  value: specifiedFunction,
  enumerable: false,
  configurable: true,
  writable: true
});
```

A decorator precedes the syntax that defines a property:

```js
class Person {
  @readonly
  name() { return `${this.first} ${this.last}` }
}
```

Now, before installing the descriptor onto `Person.prototype`, the engine first
invokes the decorator:

```js
let description = {
  type: 'method',
  initializer: () => specifiedFunction,
  enumerable: false,
  configurable: true,
  writable: true
};

description = readonly(Person.prototype, 'name', description) || description;
defineDecoratedProperty(Person.prototype, 'name', description);

function defineDecoratedProperty(target, { initializer, enumerable, configurable, writable }) {
  Object.defineProperty(target, { value: initializer(), enumerable, configurable, writable });
}
```

The has an opportunity to intercede before the relevant `defineProperty` actually occurs.

A decorator that precedes syntactic getters and/or setters operates on an accessor description:

```js
class Person {
  @nonenumerable
  get kidCount() { return this.children.length; }
}

let description = {
  type: 'accessor',
  get: specifiedGetter,
  enumerable: true,
  configurable: true
}

function nonenumerable(target, name, descriptor) {
  descriptor.enumerable = false;
  return descriptor;
}
```

A more detailed example illustrating a simple decorator that memoizes an
accessor.

```js
class Person {
  @memoize
  get name() { return `${this.first} ${this.last}` }
  set name(val) {
    let [first, last] = val.split(' ');
    this.first = first;
    this.last = last;
  }
}

let memoized = new WeakMap();
function memoize(target, name, descriptor) {
  let getter = descriptor.get, setter = descriptor.set;

  descriptor.get = function() {
    let table = memoizationFor(this);
    if (name in table) { return table[name]; }
    return table[name] = getter.call(this);
  }

  descriptor.set = function(val) {
    let table = memoizationFor(this);
    setter.call(this, val);
    table[name] = val;
  }
}

function memoizationFor(obj) {
  let table = memoized.get(obj);
  if (!table) { table = Object.create(null); memoized.set(obj, table); }
  return table;
}
```

It is also possible to decorate the class itself. In this case, the decorator
takes the target constructor.

```js
// A simple decorator
@annotation
class MyClass { }

function annotation(target) {
   // Add a property on target
   target.annotated = true;
}
```

Since decorators are expressions, decorators can take additional arguments and
act like a factory.

```js
@isTestable(true)
class MyClass { }

function isTestable(value) {
   return function decorator(target) {
      target.isTestable = value;
   }
}
```

The same technique could be used on property decorators:

```js
class C {
  @enumerable(false)
  method() { }
}

function enumerable(value) {
  return function (target, key, descriptor) {
     descriptor.enumerable = value;
     return descriptor;
  }
}
```

Because descriptor decorators operate on targets, they also naturally work on
static methods. The only difference is that the first argument to the decorator
will be the class itself (the constructor) rather than the prototype, because
that is the target of the original `Object.defineProperty`.

For the same reason, descriptor decorators work on object literals, and pass
the object being created to the decorator.

# Desugaring

## Class Declaration

### Syntax

```js
@F("color")
@G
class Foo {
}
```

### Desugaring (ES6)

```js
var Foo = (function () {
  class Foo {
  }

  Foo = F("color")(Foo = G(Foo) || Foo) || Foo;
  return Foo;
})();
```

### Desugaring (ES5)

```js
var Foo = (function () {
  function Foo() {
  }

  Foo = F("color")(Foo = G(Foo) || Foo) || Foo;
  return Foo;
})();
```

## Class Method Declaration

### Syntax

```js
class Foo {
  @F("color")
  @G
  bar() { }
}
```

### Desugaring (ES6)

```js
var Foo = (function () {
  class Foo {
    bar() { }
  }

  var _temp;
  _temp = F("color")(Foo.prototype, "bar",
    _temp = G(Foo.prototype, "bar",
      _temp = Object.getOwnPropertyDescriptor(Foo.prototype, "bar")) || _temp) || _temp;
  if (_temp) Object.defineProperty(Foo.prototype, "bar", _temp);
  return Foo;
})();
```

### Desugaring (ES5)

```js
var Foo = (function () {
  function Foo() {
  }
  Foo.prototype.bar = function () { }

  var _temp;
  _temp = F("color")(Foo.prototype, "bar",
    _temp = G(Foo.prototype, "bar",
      _temp = Object.getOwnPropertyDescriptor(Foo.prototype, "bar")) || _temp) || _temp;
  if (_temp) Object.defineProperty(Foo.prototype, "bar", _temp);
  return Foo;
})();
```

## Class Accessor Declaration

### Syntax

```js
class Foo {
  @F("color")
  @G
  get bar() { }
  set bar(value) { }
}
```

### Desugaring (ES6)

```js
var Foo = (function () {
  class Foo {
    get bar() { }
    set bar(value) { }
  }

  var _temp;
  _temp = F("color")(Foo.prototype, "bar",
    _temp = G(Foo.prototype, "bar",
      _temp = Object.getOwnPropertyDescriptor(Foo.prototype, "bar")) || _temp) || _temp;
  if (_temp) Object.defineProperty(Foo.prototype, "bar", _temp);
  return Foo;
})();
```

### Desugaring (ES5)

```js
var Foo = (function () {
  function Foo() {
  }
  Object.defineProperty(Foo.prototype, "bar", {
    get: function () { },
    set: function (value) { },
    enumerable: true, configurable: true
  });

  var _temp;
  _temp = F("color")(Foo.prototype, "bar",
    _temp = G(Foo.prototype, "bar",
      _temp = Object.getOwnPropertyDescriptor(Foo.prototype, "bar")) || _temp) || _temp;
  if (_temp) Object.defineProperty(Foo.prototype, "bar", _temp);
  return Foo;
})();
```

## Object Literal Method Declaration

### Syntax

```js
var o = {
  @F("color")
  @G
  bar() { }
}
```

### Desugaring (ES6)

```js
var o = (function () {
  var _obj = {
    bar() { }
  }

  var _temp;
  _temp = F("color")(_obj, "bar",
    _temp = G(_obj, "bar",
      _temp = void 0) || _temp) || _temp;
  if (_temp) Object.defineProperty(_obj, "bar", _temp);
  return _obj;
})();
```

### Desugaring (ES5)

```js
var o = (function () {
    var _obj = {
        bar: function () { }
    }

    var _temp;
    _temp = F("color")(_obj, "bar",
        _temp = G(_obj, "bar",
            _temp = void 0) || _temp) || _temp;
    if (_temp) Object.defineProperty(_obj, "bar", _temp);
    return _obj;
})();
```

## Object Literal Accessor Declaration

### Syntax

```js
var o = {
  @F("color")
  @G
  get bar() { }
  set bar(value) { }
}
```

### Desugaring (ES6)

```js
var o = (function () {
  var _obj = {
    get bar() { }
    set bar(value) { }
  }

  var _temp;
  _temp = F("color")(_obj, "bar",
    _temp = G(_obj, "bar",
      _temp = void 0) || _temp) || _temp;
  if (_temp) Object.defineProperty(_obj, "bar", _temp);
  return _obj;
})();
```

### Desugaring (ES5)

```js
var o = (function () {
  var _obj = {
  }
  Object.defineProperty(_obj, "bar", {
    get: function () { },
    set: function (value) { },
    enumerable: true, configurable: true
  });

  var _temp;
  _temp = F("color")(_obj, "bar",
    _temp = G(_obj, "bar",
      _temp = void 0) || _temp) || _temp;
  if (_temp) Object.defineProperty(_obj, "bar", _temp);
  return _obj;
})();
```

# Grammar

&emsp;&emsp;*DecoratorList*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp; *Decorator*<sub> [?Yield]</sub>

&emsp;&emsp;*Decorator*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`@`&emsp;*LeftHandSideExpression*<sub> [?Yield]</sub>

&emsp;&emsp;*PropertyDefinition*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*IdentifierReference*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*CoverInitializedName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*PropertyName*<sub> [?Yield]</sub>&emsp; `:`&emsp;*AssignmentExpression*<sub> [In, ?Yield]</sub>  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*MethodDefinition*<sub> [?Yield]</sub>

&emsp;&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`[`&emsp;*Expression*<sub> [In, ?Yield]</sub>&emsp;`]`

NOTE	The production *CoverMemberExpressionSquareBracketsAndComputedPropertyName* is used to cover parsing a *MemberExpression* that is part of a *Decorator* inside of an *ObjectLiteral* or *ClassBody*, to avoid lookahead when parsing a decorator against a *ComputedPropertyName*. 

&emsp;&emsp;*PropertyName*<sub> [Yield, GeneratorParameter]</sub>&emsp;:  
&emsp;&emsp;&emsp;*LiteralPropertyName*  
&emsp;&emsp;&emsp;[+GeneratorParameter] *CoverMemberExpressionSquareBracketsAndComputedPropertyName*  
&emsp;&emsp;&emsp;[~GeneratorParameter] *CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>

&emsp;&emsp;*MemberExpression*<sub> [Yield]</sub>&emsp; :  
&emsp;&emsp;&emsp;[Lexical goal *InputElementRegExp*] *PrimaryExpression*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;`.`&emsp;*IdentifierName*  
&emsp;&emsp;&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*TemplateLiteral*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*SuperProperty*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*NewSuper*&emsp;*Arguments*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;`new`&emsp;*MemberExpression*<sub> [?Yield]</sub>&emsp;*Arguments*<sub> [?Yield]</sub>

&emsp;&emsp;*SuperProperty*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;`super`&emsp;*CoverMemberExpressionSquareBracketsAndComputedPropertyName*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;`super`&emsp;`.`&emsp;*IdentifierName*

&emsp;&emsp;*ClassDeclaration*<sub> [Yield, Default]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*BindingIdentifier*<sub> [?Yield]</sub>&emsp;*ClassTail*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;[+Default] *DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*ClassTail*<sub> [?Yield]</sub>

&emsp;&emsp;*ClassExpression*<sub> [Yield, GeneratorParameter]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`class`&emsp;*BindingIdentifier*<sub> [?Yield]opt</sub>&emsp;*ClassTail*<sub> [?Yield, ?GeneratorParameter]</sub>

&emsp;&emsp;*ClassElement*<sub> [Yield]</sub>&emsp;:  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;*MethodDefinition*<sub> [?Yield]</sub>  
&emsp;&emsp;&emsp;*DecoratorList*<sub> [?Yield]opt</sub>&emsp;`static`&emsp;*MethodDefinition*<sub> [?Yield]</sub>

# Notes

In order to more directly support metadata-only decorators, a desired feature
for static analysis, the TypeScript project has made it possible for its users
to define [ambient decorators](https://github.com/jonathandturner/brainstorming/blob/master/README.md#c6-ambient-decorators)
that support a restricted syntax that can be properly analyzed without evaluation.
