import { Mirror } from "../mirror";

export interface MirrorWithMetadata extends Mirror {
  defineMetadata(key: any, value: any): void;
  deleteMetadata(key: any): boolean;
  hasMetadata(key: any, options?: { inherited?: boolean; }): boolean;
  getMetadata(key: any, options?: { inherited?: boolean; }): any;
  getMetadataKeys(options?: { inherited?: boolean; }): any[];
}