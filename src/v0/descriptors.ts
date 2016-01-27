export type Getter = () => any;
export type Setter = (value: any) => void;

export interface GenericDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
}

export interface DataDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
  writable?: boolean;
  value?: boolean;
}

export interface AccessorDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
  get?: Getter;
  set?: Setter;
}

export type DataOrAccessorDescriptor = DataDescriptor | PropertyDescriptor;

/// see http://www.ecma-international.org/ecma-262/6.0/index.html#sec-isdatadescriptor
export function isDataDescriptor(descriptor: PropertyDescriptor): descriptor is DataDescriptor {
  if (descriptor === undefined) return false;
  return ("value" in descriptor) || ("writable" in descriptor);
}

/// see http://www.ecma-international.org/ecma-262/6.0/index.html#sec-isaccessordescriptor
export function isAccessorDescriptor(descriptor: PropertyDescriptor): descriptor is AccessorDescriptor {
  if (descriptor === undefined) return false;
  return ("get" in descriptor) || ("set" in descriptor);
}

/// see http://www.ecma-international.org/ecma-262/6.0/index.html#sec-isgenericdescriptor
///
/// "generic descriptor" means "not a data descriptor or accessor descriptor"
export function isGenericDescriptor(descriptor: PropertyDescriptor): descriptor is GenericDescriptor {
  return !isDataDescriptor(descriptor) && !isAccessorDescriptor(descriptor);
}