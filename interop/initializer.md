> This file is under active development. Refer to `interop/reusability.md` for the
> most up to date description.

This document is a high-level explainer of how property decorators
interoperate with the [class properties][class-properties] proposal.

First, it's important to remember that, in this proposal, property
decorators operate on property descriptors.

```js
class Person {
  constructor(first, last)  {
    this.firstName = first;
    this.lastName = last;
  }

  @memoize fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

// desugars to roughly:

class Person {
  constructor(first, last)  {
    this.firstName = first;
    this.lastName = last;
  }
}

let desc = {
  value() { return `${this.firstName} ${this.lastName}` },
  enumerable: false,
  configurable: true,
  writable: true
}

desc = memoize(Person.prototype, 'fullName', desc) || desc;
Object.defineProperty(Person.prototype, 'fullName', desc);
```

In other words, the decorator API allows a function to intercept the
descriptor that would be installed on a target object and make changes
to it before it is actually installed.

## Property Initializers

The current [property initializer proposal][class-properties] installs a
descriptor onto the target object representing the initializer.

```js
class Person {
  born = Date.now();
}

// desugars to roughly:

class Person {
  constructor() {
    let _born = Object.getPropertyDescriptor(this, 'born');
    this.born = _born.initializer.call(this);
  }
}

Object.defineProperty(Person.prototype, 'born', {
  initializer() { return Date.now() },
  enumerable: true,
  writable: true,
  configurable: true
});
```

The initializers are executed in the constructor of the class they were
defined in.

* If the class is a base class, they are invoked immediately before the
  constructor is entered (after the instance is allocated).
* If the class is a derived class, they are invoked immediately before
  their call to `super` returns (also after the intance is allocated).

In other words, they are always executed after the instance is
allocated, and before the constructor tries to access `this`.

## Harmony

Because property initializers are defined in terms of descriptors,
decorators work on property initializers in the same way that they work
on methods or accessors.

```js
class Person {
  @readonly
  born = Date.now();
}

// with this descriptor definition

function readonly(target, name, desc) {
  desc.writable = false;
  return desc;
}

// desugars to roughly

class Person {
  constructor() {
    let _born = Object.getPropertyDescriptor(this, 'born');
    this.born = _born.initializer.call(this);
  }
}

let desc = {
  initializer() { return Date.now() },
  enumerable: true,
  writable: true,
  configurable: true
});

desc = readonly(Person.prototype, 'born', desc) || desc;
Object.defineProperty(Person.prototype, 'born', desc);
```

## It Just Works

In general, if new syntactic features of classes are defined in terms of
descriptors, they will work seamlessly with this decorator proposal.

Defining features in terms of descriptors, where possible, is good for
another reason: it enables dynamic creation of classes (class-as-sugar)
and reflection on these features at runtime.

The fact that decorators are a declarative mechanism for working with
descriptors is a key part of the decorator proposal, and cuts with the
grain of the existing JavaScript reflection mechanism.

[class-properties]: https://gist.github.com/jeffmo/054df782c05639da2adb
