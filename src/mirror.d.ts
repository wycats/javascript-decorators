interface Mirror {
    kind: string;

    // YK: what's this for?
    mutable: boolean;

    // YK: punt for now
    // defineMetadata(key: any, value: any): void;
    // deleteMetadata(key: any): boolean;
    // hasMetadata(key: any, options?: { inherited?: boolean; }): boolean;
    // getMetadata(key: any, options?: { inherited?: boolean; }): any;
    // getMetadataKeys(options?: { inherited?: boolean; }): any[];
}

interface ObjectMirror extends Mirror {
    object: any;
    defineProperty(propertyKey: PropertyKey, descriptor: PropertyDescriptor, options?: { static?: boolean; }): PropertyMirror;
    deleteProperty(propertyKey: PropertyKey, options?: { static?: boolean; }): boolean;
    hasOwnProperty(propertyKey: PropertyKey, options?: { static?: boolean; }): boolean;
    getOwnProperty(propertyKey: PropertyKey, options?: { static?: boolean; }): PropertyMirror;
    getOwnProperties(options?: { static?: boolean; }): PropertyMirror[];
}

export interface FunctionMirror extends ObjectMirror {
  // should these be part of a FunctionMirror super-interface?
  name: string;
  length: number;
  parameters: ParameterMirror[];
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