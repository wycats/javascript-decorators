type MirrorState = "decorating" | "decorated";

interface Mirror {
    // Gets the kind of mirror:
    //   "object" -> ObjectMirror
    //   "function" -> FunctionMirror
    //   "class" -> ClassMirror
    //   "side" -> ClassSideMirror
    //   "property" -> DataPropertyMirror
    //   "method" -> MethodPropertyMirror
    //   "accessor" -> AccessorPropertyMirror
    //   "parameter" -> ParameterMirror
    kind: string;
    // Gets the current state of the mirror:
    //   "decorating" - The declaration that the mirror represents is in 
    //                  the process of initializing and decorators are 
    //                  currently being applied.
    //   "decorated"  - The declaration that the mirror represents has 
    //                  completed initialization and is available to
    //                  the runtime.
    state: MirrorState;
}

// kind: "object" | "function"
interface ObjectMirror extends Mirror {
    target: Object; // rb: Is this a good idea for an object mirror? For 
                    //     a FunctionMirror you replace the inner function
                    //     body but end up with the same outer declaration.
                    //     For an object literal, would the value exist at
                    //     any point during decoration?

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

// kind: "function"
export interface FunctionMirror extends ObjectMirror {
    // Gets the name of the function.
    name: string;
    // Gets the arity of the function.
    length: number;
    // Gets the parameter mirrors for function, including rest parameters.
    parameters: ParameterMirror[];
    // Gets or sets the function body for the function.
    target: Function;
    // 26.1.1
    apply(thisArg: any, argumentsList: any[]): any;
    // 26.1.2
    construct(argumentsList: any[], newTarget: typeof Object): any;
}

// kind: "class"
export interface ClassMirror extends Mirror {
    // Gets the name of the class.
    name: string;
    // Gets the arity of the class constructor.
    length: number;
    // Gets the parameter mirrors for the class, including rest parameters.
    parameters: ParameterMirror[];
    // Gets a mirror for the static side of the class.
    statics: ClassSideMirror;
    // Gets a mirror for the prototype side of the class.
    prototype: ClassSideMirror;
    // Gets a reference to the superclass for this class.
    superClass: ClassMirror;
    // Gets or sets the constructor function for the class.
    // Setting this property throws a TypeError if the mirror's "state" is not "decorating".
    constructFunction: Function;
    // Constructs a new instance of the class.
    // Calling this method throws a TypeError if the mirror's "state" is "decorating".
    construct(argumentsList: any[], newTarget: Object): any;
}

export type ClassSide = "static" | "prototype";

// kind: "side"
export interface ClassSideMirror extends Mirror {
    // Gets a string that indicates the class side of the mirror.
    side: ClassSide;
    // Gets the containing class to which this class side belongs.
    parent: ClassMirror;
    // Defines a property on this class side, returning a mirror for the property.
    // Calling this method throws a TypeError if the mirror's "state" is not "decorating".
    defineProperty(propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyMirror;
    // Deletes a property on this class side.
    deleteProperty(propertyKey: PropertyKey): boolean;
    // Gets a PropertyMirror for an own property on this class side with the provided property key.
    getOwnProperty(propertyKey: PropertyKey): PropertyMirror;
    // Gets an array of PropertyMirror objects for each own property on this class side.
    getOwnProperties(): PropertyMirror[];
    // Gets a value indicting whether this class side has defined an own property with the provided property key.
    hasOwnProperty(propertyKey: PropertyKey): boolean;
}

// kind: "property" | "method" | "accessor"
export interface PropertyMirror extends Mirror {
    // Gets the parent object or class-side that contains this property.
    parent: ObjectMirror | ClassSideMirror;
    // Gets a string that indicates to which class-side this property belongs.
    side?: ClassSide;
    // Gets the name of the property.
    name: PropertyKey;
    // Gets or sets a value indicating whether the property is enumerable.
    enumerable: boolean;
    // Gets or sets a value indicating whether the property is configurable.
    configurable: boolean;
}

// kind: "property"
export interface DataPropertyMirror extends PropertyMirror {
    // Gets or sets a value indicating whether the property is writable.
    writable: boolean;
    // Gets or sets the value for this property.
    value: any;
}

// kind: "method"
export interface MethodPropertyMirror extends PropertyMirror {
    // Gets the arity of the method.
    length: number;
    // Gets the parameter mirrors for the method, including rest parameters.
    parameters: ParameterMirror[];
    // Gets or sets a value indicating whether the property is writable.
    writable: boolean;
    // Gets or sets the function for this method.
    value: Function;
}

// kind: "accessor"
export interface AccessorPropertyMirror extends PropertyMirror {
    // Gets the arity of the accessor.
    length: number;
    // Gets the parameter mirrors for the accessor.
    parameters: ParameterMirror[];
    // Gets or sets the getter function for the accessor.
    get: () => any;
    // Gets or sets the setter function for the accessor.
    set: (value: any) => void;
}

// kind: "parameter"
export interface ParameterMirror extends Mirror {
    // Gets the mirror for the parent function, class, method, or accessor to which this parameter belongs.
    parent: FunctionMirror | ClassMirror | MethodPropertyMirror | AccessorPropertyMirror;
    // Gets the ordinal position of the parameter in its parent's parameter list.
    index: number;
    // Gets the name of the parameter, if available.
    name: string;
    // Gets a value indicating whether the parameter is a binding pattern.
    pattern: boolean;
    // Gets a value indicating whether the parameter is a rest parameter.
    rest: boolean;
    // Gets a value indicating whether the parameter has an initializer.
    optional: boolean;
}
