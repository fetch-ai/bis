import { IBoardPiece } from './board.interface';
export type TType = 'PVP' | 'PVE';

interface IBeforeIAfter {
  before?: number;
  after?: number;
}

export interface IGold extends IBeforeIAfter {};

export interface IXP extends IBeforeIAfter {};

export interface IStage {
  stage: string;
  type: TType;
  health?: number;
  gold?: IGold;
  xp?: IXP;
  board?: IBoardPiece[];
  didWin?: boolean;
}