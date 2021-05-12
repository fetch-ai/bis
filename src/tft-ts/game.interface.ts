import { IStage } from './stage.interface';

export type TMode = 'custom' | 'normal' | 'ranked';

export interface IGame {
  game_info: {
    mode?: TMode;
    match_id?: string;
  }
  summoner_name: string;
  stages: IStage[]
}