import {
  ObjectMirror as IObjectMirror,
  ClassMirror as IClassMirror,
  ClassPropertyMirror as IClassPropertyMirror,
  FunctionMirror as IFunctionMirror
} from "../mirror";

import {
  PropertyMirrorOptions,
  DataPropertyOptions,
  DataPropertyMirror,
  AccessorPropertyMirror,
  AccessorPropertyOptions
} from "./property";

import {
  ObjectMirror
} from "./object";

import {
  ParameterMirror
} from "./parameter";

import {
  FunctionMirrorOptions
} from "./function";

interface ClassMirrorOptions extends FunctionMirrorOptions {
  prototype: IObjectMirror;
  statics: IObjectMirror;
  superclass: IClassMirror;
  constructorFunction: IFunctionMirror;
}

class ClassMirror implements IClassMirror {
  public kind: "class" = "class";
  public name: string;
  public length: number;
  public parameters: ParameterMirror[];

  public statics: IObjectMirror;
  public prototype: IObjectMirror;
  public superclass: IClassMirror;
  public constructorFunction: IFunctionMirror;

  constructor({ prototype, statics, superclass, constructorFunction }: ClassMirrorOptions) {
    this.statics = statics;
    this.prototype = prototype;
    this.superclass = superclass;
    this.constructorFunction = constructorFunction;
  }
}

///
/// CLASS PROPERTIES
///

export interface ClassPropertyOptions extends PropertyMirrorOptions {
  isStatic: boolean;
}

export class ClassAccessorPropertyMirror extends AccessorPropertyMirror implements IClassPropertyMirror {
  isStatic: boolean;
  object: IClassMirror;

  constructor(options: AccessorPropertyOptions & ClassPropertyOptions) {
    let { isStatic } = options;
    super(options);

    this.isStatic = isStatic;
  }
}

export class ClassDataPropertyMirror extends DataPropertyMirror implements IClassPropertyMirror {
  isStatic: boolean;
  object: IClassMirror;

  constructor(options: DataPropertyOptions & ClassPropertyOptions) {
    let { isStatic } = options;
    super(options);

    this.isStatic = isStatic;
  }
}