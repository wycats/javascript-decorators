import {
  ObjectMirror as IObjectMirror,
  PropertyMirror as IPropertyMirror,
  DataPropertyMirror as IDataPropertyMirror,
  AccessorPropertyMirror as IAccessorPropertyMirror
} from "../mirror";

import {
  Mirror
} from "./mirror";

import {
  ObjectMirror
} from "./object";

import {
  Getter,
  Setter,
  PropertyKey,
  DataOrAccessorDescriptor,
  isDataDescriptor,
  isAccessorDescriptor
} from "../utils";

export interface PropertyMirrorOptions {
  name: PropertyKey;
  enumerable: boolean;
  configurable: boolean;
  parent: IObjectMirror;
}

export abstract class PropertyMirror extends Mirror implements IPropertyMirror {
  kind: "data";
  mutable = true;

  parent: IObjectMirror;
  name: PropertyKey;
  enumerable: boolean;
  configurable: boolean;

  constructor({ name, enumerable, configurable, parent }: PropertyMirrorOptions) {
    super({ kind: "data", state: "decorating" });

    this.name = name;
    this.enumerable = enumerable;
    this.configurable = configurable;
    this.parent = parent;
  }
}

export function createPropertyMirror({ object, name, descriptor }: { object: Object, name: PropertyKey, descriptor: DataOrAccessorDescriptor }): PropertyMirror {
  let { enumerable, configurable } = descriptor;
  let objectMirror = new ObjectMirror({ object });

  if (isDataDescriptor(descriptor)) {
    let { writable, value } = descriptor;
    return new DataPropertyMirror({ name, enumerable, configurable, writable, value, object: objectMirror });
  } else if (isAccessorDescriptor(descriptor)) {
    let { get, set } = descriptor;
    return new AccessorPropertyMirror({ name, enumerable, configurable, get, set, object: objectMirror });
  }
}

export interface DataPropertyOptions extends PropertyMirrorOptions {
  writable: boolean;
  value: any;
}

export class DataPropertyMirror extends PropertyMirror implements IDataPropertyMirror {
  writable: boolean;
  value: any;

  constructor({ parent, name, enumerable, configurable, writable, value }: DataPropertyOptions) {
    super({ parent, name, enumerable, configurable });
    this.writable = writable;
    this.value = value;
  }
}

export interface AccessorPropertyOptions extends PropertyMirrorOptions {
  get: Getter;
  set: Setter;
}

export class AccessorPropertyMirror extends PropertyMirror implements IAccessorPropertyMirror {
  get: Getter;
  set: Setter;

  constructor(options: AccessorPropertyOptions) {
    let { get, set } = options;

    super(options);
    this.get = get;
    this.set = set;
  }
}