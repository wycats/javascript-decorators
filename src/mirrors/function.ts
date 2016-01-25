import {
  FunctionMirror as IFunctionMirror,
  ParameterMirror as IParameterMirror
} from "../mirror";

import {
  ObjectMirror,
  ObjectMirrorOptions
} from "./object";

import {
  ParameterMirror
} from "./parameter";

export interface FunctionMirrorOptions extends ObjectMirrorOptions {
  name: string;
  length: number;
  parameters: ParameterMirror[];
}

export class FunctionMirror extends ObjectMirror implements IFunctionMirror {
  public name: string;
  public length: number;
  public parameters: IParameterMirror[];

  constructor(options: FunctionMirrorOptions) {
    let { name, length, parameters } = options;
    super(options);

    this.name = name;
    this.length = length;
    this.parameters = parameters;
  }
}
