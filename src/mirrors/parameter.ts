import {
  ParameterMirror as IParameterMirror,
  FunctionMirror as IFunctionMirror
} from "../mirror";

interface ParameterMirrorOptions {
  index: number;
  parent: IFunctionMirror;
}

export class ParameterMirror implements IParameterMirror {
  kind = "parameter";
  mutable = true;

  index: number;
  parent: IFunctionMirror;

  constructor({ index, parent }: ParameterMirrorOptions) {
    this.index = index;
    this.parent = parent;
  }
}