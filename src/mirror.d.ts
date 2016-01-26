type MirrorState = "decorating" | "decorated";

interface Mirror {
  kind: string;
  state: MirrorState;
}

interface ObjectMirror extends Mirror {
    target: Object;

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
  // "name" and "length" are properties and should be
  // controlled using regular property mechanisms

  parameters: ParameterMirror[];

  // 26.1.1
  apply(thisArg: any, argumentsList: any[]): any;
  // 26.1.2
  construct(argumentsList: any[], newTarget: typeof Object): any;
}

export interface ClassMirror extends ObjectMirror, FunctionMirror {
    instanceSide: ObjectMirror;
    staticSide: ObjectMirror;
}

export interface PropertyMirror extends Mirror {
    name: PropertyKey;
    enumerable: boolean;
    configurable: boolean;
    object: ObjectMirror;

    // YK: what are these for?
    // length: number;
    // parameters: ParameterMirror[];
}

export interface ClassPropertyMirror extends PropertyMirror {
    isStatic: boolean;
    object: ClassMirror;
}

export interface DataPropertyMirror extends PropertyMirror {
    writable: boolean;
    value: any;
}

export interface AccessorPropertyMirror extends PropertyMirror {
    get: () => any;
    set: (value: any) => void;
}

export interface ParameterMirror extends Mirror {
    index: number;

    // YK: what is this?
    parent: FunctionMirror;
}