import {
  ObjectMirror as IObjectMirror
} from "../mirror";

import {
  PropertyMirror,
  DataPropertyMirror,
  AccessorPropertyMirror,
  createPropertyMirror
} from "./property";

import {
  PropertyKey,
  DataOrAccessorDescriptor,
  isDataDescriptor,
  isAccessorDescriptor
} from "../utils";

export interface ObjectMirrorOptions {
  object: Object;
}

export class ObjectMirror implements IObjectMirror {
  public object: Object;
  public kind = "object";
  public mutable = true;

  constructor({ object }: ObjectMirrorOptions) {
    this.object = object;
  }

  defineProperty(propertyKey: PropertyKey, descriptor: DataOrAccessorDescriptor): PropertyMirror {
    let property: PropertyMirror;
    let { enumerable, configurable } = descriptor;
    let object = this;

    if (isDataDescriptor(descriptor)) {
      let { writable, value } = descriptor;
      property = new DataPropertyMirror({ name: propertyKey, enumerable, configurable, writable, value, object });
    } else if (isAccessorDescriptor(descriptor)) {
      let { get, set } = descriptor;
      property = new AccessorPropertyMirror({ name: propertyKey, enumerable, configurable, get, set, object });
    }

    Object.defineProperty(this.object, propertyKey, descriptor);
    return property;
  }

  deleteProperty(propertyKey: PropertyKey): boolean {
    if (propertyKey in this.object) {
      delete this.object[propertyKey];
      return true;
    }

    return false;
  }

  hasOwnProperty(propertyKey: PropertyKey): boolean {
    return this.object.hasOwnProperty(propertyKey);
  }

  getOwnProperty(propertyKey: PropertyKey, options?: { static?: boolean; }): PropertyMirror {
    let { object } = this;

    let descriptor = Object.getOwnPropertyDescriptor(object, propertyKey);
    return createPropertyMirror({ object, name: propertyKey, descriptor });
  }

  getOwnProperties(): PropertyMirror[] {
    let { object } = this;

    let mirrors = [];

    Object.getOwnPropertyNames(object).forEach(name => {
      mirrors.push(createPropertyMirror({ object, name, descriptor: Object.getOwnPropertyDescriptor(object, name) }));
    });

    Object.getOwnPropertySymbols(object).forEach(symbol => {
      mirrors.push(createPropertyMirror({ object, name, descriptor: Object.getOwnPropertyDescriptor(object, name) }));
    });

    return mirrors;
  }
}
