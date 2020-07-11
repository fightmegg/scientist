import isequal from "lodash.isequal";
import { shuffle } from "./shuffle";
import { formatResultsForPublish } from "./format";
import { executeSyncAndTime, executeAsyncAndTime } from "./executor";

class Scientist {
  #control;
  #candidate;
  #cleanFn;

  #options = {
    async: false,
  };

  constructor(name, options) {
    if (!name) throw new Error("an experiment requires a name");

    this.name = name;
    this.#options = { ...this.#options, ...options };
  }

  // Control
  use(fn) {
    if (fn) this.#control = { fn, tag: "control" };
  }

  // Candidate
  try(fn) {
    if (fn) this.#candidate = { fn, tag: "candidate" };
  }

  // Publish
  #publishFn = () => {};
  publish(fn) {
    if (fn) this.#publishFn = fn;
  }

  // compare
  #compareFn = (control, candidate) => {
    return isequal(control, candidate);
  };
  compare(fn) {
    if (fn) this.#compareFn = fn;
  }

  // Enabled
  #enabledFn = () => {
    return false;
  };
  enabled(fn) {
    if (fn) this.#enabledFn = fn;
  }

  // Clean
  clean(fn) {
    if (fn) this.#cleanFn = fn;
  }

  // Format
  #format(experiments, results) {
    const output = {
      name: this.name,
      execution_order: experiments.map((n) => n.tag),
      ...formatResultsForPublish(results),
    };

    output.matched = this.#compareFn(
      output.control?.value,
      output.candidate?.value
    );

    if (this.#cleanFn) {
      if (output.control)
        output.control.cleaned_value = this.#cleanFn(output.control?.value);
      if (output.candidate)
        output.candidate.cleaned_value = this.#cleanFn(output.candidate?.value);
    }
    return output;
  }

  // Async Runner
  #runAsync(experiments, type = "control") {
    return Promise.all(experiments.map(executeAsyncAndTime)).then((results) => {
      const formattedResults = this.#format(experiments, results);
      this.#publishFn(formattedResults);
      if (formattedResults[type]?.error) throw formattedResults[type].error;
      return formattedResults[type]?.value;
    });
  }

  // Sync Runner
  #runSync(experiments, type = "control") {
    const results = experiments.map(executeSyncAndTime);
    const formattedResults = this.#format(experiments, results);
    this.#publishFn(formattedResults);
    if (formattedResults[type]?.error) throw formattedResults[type].error;
    return formattedResults[type]?.value;
  }

  // Run
  run() {
    let experiments = [
      this.#control,
      this.#enabledFn() && this.#candidate,
    ].filter(Boolean);
    if (!experiments.length) throw new Error("no experiments to run");

    // Shuffle ordering
    experiments = shuffle(experiments);

    // run
    if (this.#options.async) return this.#runAsync(experiments);
    return this.#runSync(experiments);
  }

  // Run Only
  run_only(type) {
    if (type !== "control" && type !== "candidate")
      throw new Error("invalid run type");

    const experiments = [
      type === "control" ? this.#control : this.#candidate,
    ].filter(Boolean);
    if (!experiments.length) throw new Error("no experiments to run");

    // run
    if (this.#options.async) return this.#runAsync(experiments, type);
    return this.#runSync(experiments, type);
  }
}

export default Scientist;
