import {
  ObjectMirror as IObjectMirror,
  ClassMirror as IClassMirror,
  ClassPropertyMirror as IClassPropertyMirror
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
  instanceSide: IObjectMirror;
  staticSide: IObjectMirror;
}

class ClassMirror extends ObjectMirror implements IClassMirror {
  public name: string;
  public length: number;
  public parameters: ParameterMirror[];

  public staticSide: ObjectMirror;
  public instanceSide: ObjectMirror;

  constructor(options: ClassMirrorOptions) {
    let { instanceSide, staticSide } = options;
    super(options);

    this.staticSide = staticSide;
    this.instanceSide = instanceSide;
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