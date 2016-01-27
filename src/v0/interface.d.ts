export type MirrorKind = "object" | "function" | "class" | "statics" | "data" | "accessor";

interface Mirror {
    kind: MirrorKind
}

interface ObjectMirror extends Mirror {
  kind: "object" | "function";

  // 26.1.1 and 26.1.2 are defined on FunctionMirror, below

  // 26.1.3
  defineProperty(propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyMirror;
  // 26.1.4
  deleteProperty(propertyKey: PropertyKey): boolean;
  // 26.1.5
  enumerate(): Iterator<any>;
  // 26.1.6
  get(propertyKey: PropertyKey, receiver?: any): any;
  // 26.1.7
  getOwnProperty(propertyKey: PropertyKey): PropertyMirror;
  // 26.1.8
  getPrototype(): Object;
  // 26.1.9
  has(propertyKey: PropertyKey): boolean;
  // 26.1.10
  isExtensible(): boolean;
  // 26.1.11
  ownKeys(): PropertyKey[];
  // 26.1.12
  preventExtensions(): boolean;
  // 26.1.13
  set(propertyKey: PropertyKey, value: any, receiver?: any);
  // 26.1.14
  setPrototype(value: Object): boolean;
}

export interface FunctionMirror extends ObjectMirror {
  kind: "function";

  // "name" and "length" are properties and should be
  // controlled using regular property mechanisms

  // 26.1.1
  apply(thisArg: any, argumentsList: any[]): any;
  // 26.1.2
  construct(argumentsList: any[], newTarget: typeof Object): any;
}

export interface ClassMirror {
  kind: "class";

  superclass: ClassMirror;
  prototype: ObjectMirror;
  statics: ObjectMirror;
  constructorFunction: FunctionMirror;

  setConstructorFunction(constructor: Function);
}

export interface PropertyMirror extends Mirror {
  kind: "data" | "accessor";

  name: PropertyKey;
  enumerable: boolean;
  configurable: boolean;
}

export interface DataPropertyMirror extends PropertyMirror {
  kind: "data";

  writable: boolean;
  value: any;
}

export interface AccessorPropertyMirror extends PropertyMirror {
  kind: "accessor";

  get: () => any;
  set: (value: any) => void;
}