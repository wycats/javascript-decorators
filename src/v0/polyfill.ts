import {
  ObjectMirror as IObjectMirror,
  FunctionMirror as IFunctionMirror,
  PropertyMirror as IPropertyMirror,
  DataPropertyMirror as IDataPropertyMirror,
  AccessorPropertyMirror as IAccessorPropertyMirror,
  ClassMirror as IClassMirror
} from "./interface";

export class ObjectMirror implements IObjectMirror {
  protected target: Object;
  public kind: "object" | "function";

  constructor(target: Object) {
    this.kind = "object";
    this.target = target;
  }

  defineProperty(propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyMirror {
    Reflect.defineProperty(this.target, propertyKey, descriptor);

    // Open Question: Reference equality?
    return createPropertyMirror(propertyKey, descriptor);
  }

  deleteProperty(propertyKey: PropertyKey): boolean {
    return Reflect.deleteProperty(this.target, propertyKey);
  }

  enumerate(): IterableIterator<any> {
    return Reflect.enumerate(this.target);
  }

  get(propertyKey: PropertyKey, receiver?: any): any {
    return Reflect.get(this.target, propertyKey, receiver);
  }

  getOwnProperty(propertyKey: PropertyKey): PropertyMirror {
    let descriptor = Reflect.getOwnPropertyDescriptor(this.target, propertyKey);

    // Open Question: Reference equality?
    return createPropertyMirror(propertyKey, descriptor);
  }

  getPrototype(): Object {
    return Reflect.getPrototypeOf(this.target);
  }

  has(propertyKey: PropertyKey): boolean {
    return Reflect.has(this.target, propertyKey);
  }

  isExtensible(): boolean {
    return Reflect.isExtensible(this.target);
  }

  ownKeys(): PropertyKey[] {
    return Reflect.ownKeys(this.target);
  }

  preventExtensions(): boolean {
    return Reflect.preventExtensions(this.target);
  }

  set(propertyKey: PropertyKey, value: any, receiver?: any) {
    return Reflect.set(this.target, propertyKey, value, receiver);
  }

  setPrototype(proto: Object): boolean {
    return Reflect.setPrototypeOf(this.target, proto);
  }
}

export class FunctionMirror extends ObjectMirror implements IFunctionMirror {
  public kind: "function";
  protected target: Function;

  apply(thisArg: any, argumentsList: any[]): any {
    return Reflect.apply(this.target, thisArg, argumentsList);
  }

  construct(argumentsList: any[], newTarget: typeof Object): any {
    return Reflect.construct(this.target, argumentsList, newTarget);
  }
}

import {
  isAccessorDescriptor,
  isDataDescriptor
} from "./descriptors";


function createPropertyMirror(name: PropertyKey, descriptor: PropertyDescriptor): PropertyMirror {
  if (isDataDescriptor(descriptor)) {
    return new DataPropertyMirror(name, descriptor);
  } else if (isAccessorDescriptor(descriptor)) {
    return new AccessorPropertyMirror(name, descriptor);
  }
}

export abstract class PropertyMirror implements IPropertyMirror {
  public kind: "data" | "accessor";
  public name: PropertyKey;
  public enumerable: boolean;
  public configurable: any;

  constructor(name: PropertyKey, { enumerable, configurable }: PropertyDescriptor) {
    this.name = name;
    this.enumerable = enumerable;
    this.configurable = configurable;
  }
}

export class DataPropertyMirror extends PropertyMirror implements IDataPropertyMirror {
  public kind: "data";
  public writable: boolean;
  public value: any;

  constructor(name: PropertyKey, options: PropertyDescriptor) {
    super(name, options);

    let { writable, value } = options;

    this.kind = "data";
    this.writable = writable;
    this.value = value;
  }
}

export class AccessorPropertyMirror extends PropertyMirror implements IAccessorPropertyMirror {
  kind: "accessor";

  get: () => any;
  set: (value: any) => void;

  constructor(name: PropertyKey, options: PropertyDescriptor) {
    super(name, options);

    let { get, set } = options;

    this.kind = "accessor";
    this.get = get;
    this.set = set;
  }
}

let classes = new WeakMap<typeof Object, ClassMirror>();

class ClassMirror implements IClassMirror {
  public kind: "class";

  public superclass: ClassMirror;
  public prototype: ObjectMirror;
  public statics: ObjectMirror;
  public constructorFunction: FunctionMirror;

  constructor(superclass: typeof Object) {
    this.superclass = classMirrorFor(superclass);
    this.prototype = new ObjectMirror({});
    this.statics = new ObjectMirror({});
    this.constructorFunction = null;
  }

  setConstructorFunction(constructor: Function) {
    this.constructorFunction = new FunctionMirror(constructor);
  }
}

function classMirrorFor(klass: typeof Object): ClassMirror {
  return classes.get(klass);
}