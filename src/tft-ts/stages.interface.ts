export interface IStage {
  stage: string;
  type: 'PVP' | 'PVE';
  health: {
    before: number;
    after: number;
  };
}
