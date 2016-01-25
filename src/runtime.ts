import {
  ObjectMirror as IObjectMirror,
  ClassMirror as IClassMirror,
  PropertyMirror as IPropertyMirror,
  DataPropertyMirror as IDataPropertyMirror,
  AccessorPropertyMirror as IAccessorPropertyMirror,
  ClassPropertyMirror as IClassPropertyMirror,
  ParameterMirror as IParameterMirror,
  FunctionMirror as IFunctionMirror
} from "./mirror";



///
/// HELPERS
///


///
/// PROOF OF CONCEPT RUNTIME
///

/**
  class Person {
    constructor(first: string, last: string) {
      this.first = first;
      this.last = last;
    }

    @nonconfigurable fullName(): string {
      return `${this.first} ${this.last}`;
    }
  }

  function nonconfigurable() {
    return function(mirror: ClassPropertyMirror) {
      mirror.configurable = false;
    }
  }
*/

///
/// TRANSPILATION USING THE PROOF OF CONCEPT RUNTIME
///

class Person {
  constructor(first: string, last: string) {
    this["first"] = first;
    this["last"] = last;
  }

  fullName(): string {
    return `${this["first"]} ${this["last"]}`;
  }
}