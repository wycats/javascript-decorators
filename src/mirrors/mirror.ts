import { MirrorKind, MirrorState } from "../mirror";

export interface MirrorOptions {
  kind: MirrorKind;
  state: MirrorState;
}

export abstract class Mirror {
  kind: MirrorKind;
  state: MirrorState;

  constructor({ kind, state }: MirrorOptions) {
    this.kind = kind;
    this.state = state;
  }
}