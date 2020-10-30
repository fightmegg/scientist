declare module '@fightmegg/scientist' {
  class Scientist<TControl = any, TCandidate = TControl, TCleaned = TControl> {
    constructor(name: string, options?: ScientistOptions);

    enabled(enabledFn: () => boolean): void;
    publish(publishFn: (results: ExperimentResults<TControl, TCandidate, TCleaned>) => void): void;
    clean(cleanFn: (value: TControl | TCandidate) => TCleaned): void;

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

  export interface ExperimentResults<TControl = any, TCandidate = TControl, TCleaned = TControl> {
    control?: ExperimentValue<TControl, TCleaned>;
    candidate?: ExperimentValue<TCandidate, TCleaned>;
    execution_order: ControlOrCandidate[];
    error: boolean;
    name: string;
    matched: boolean;
  }

  export interface ExperimentValue<TResult = any, TCleaned = TResult> {
    value?: TResult;
    cleaned_value?: TCleaned;
    error?: Error;
    duration: number;
    start_time: number;
    end_time: number;
  }

  export default Scientist;
}