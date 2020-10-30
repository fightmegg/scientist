declare module '@fightmegg/scientist' {
  class Scientist<TControl = any, TCandidate = TControl, TCleanResult = TControl> {
    constructor(name: string, options?: ScientistOptions);

    enabled(enabledFn: () => boolean): void;
    publish(publishFn: (results: ExperimentResults<TControl, TCandidate, TCleanResult>) => void): void;
    clean(cleanFn: (value: TControl | TCandidate) => TCleanResult): void;
    
    use(controlFn: () => any): void;
    try(candidateFn: () => any): void;

    run(): void;
    run(): Promise<void>;

    run_only(which: ControlOrCandidate): void;
    run_only(which: ControlOrCandidate): Promise<void>;
  }

  export interface ScientistOptions {
    async?: boolean;
  }

  export type ControlOrCandidate = 'control' | 'candidate';

  export interface ExperimentResults<TControl = any, TCandidate = TControl, TCleanResult = TControl> {
    control: ExperimentValue<TControl, TCleanResult>;
    candidate: ExperimentValue<TCandidate, TCleanResult>;
    execution_order: ControlOrCandidate[];
    error: boolean;
    name: string;
    matched: boolean;
  }

  export interface ExperimentValue<TResult = any, TCleanResult = TResult> {
    value: TResult;
    cleaned_value: TCleanResult;
    duration: number;
    start_time: number;
    end_time: number;
    error?: any;
  }

  export default Scientist;
}