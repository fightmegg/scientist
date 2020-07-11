import Scientist from "../index";
import { shuffle } from "../shuffle";
import { executeSyncAndTime, executeAsyncAndTime } from "../executor";
import { formatResultsForPublish } from "../format";

// Mocks
jest.mock("../shuffle", () => ({
  __esModule: true,
  shuffle: jest.fn(),
}));

jest.mock("../format", () => ({
  __esModule: true,
  formatResultsForPublish: jest.fn(),
}));

jest.mock("../executor", () => ({
  __esModule: true,
  executeSyncAndTime: jest.fn(),
  executeAsyncAndTime: jest.fn(),
}));

describe("Scientist", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("constructor", () => {
    test("It throws an error if no experiment name is given", () => {
      expect(() => new Scientist()).toThrowErrorMatchingSnapshot();
    });

    test("It sets name", () => {
      const experiment = new Scientist("test");
      expect(experiment.name).toEqual("test");
    });
  });

  describe("run", () => {
    let syncExperiment;
    let asyncExperiment;

    beforeEach(() => {
      syncExperiment = new Scientist("sync test");
      asyncExperiment = new Scientist("async test", { async: true });
    });

    test("it should throw ERROR if control nor candidate is set", () => {
      expect(() => syncExperiment.run()).toThrowErrorMatchingSnapshot();
    });

    test("it should throw ERROR if candidate set but not enabled", () => {
      syncExperiment.try(jest.fn());
      expect(() => syncExperiment.run()).toThrowErrorMatchingSnapshot();
    });

    test("it should return the control result", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
      }));

      const control = jest.fn(() => 20);
      syncExperiment.use(control);

      const experimentControl = { fn: control, tag: "control" };
      expect(syncExperiment.run()).toEqual(20);
      expect(shuffle).toHaveBeenCalledWith([experimentControl]);
      expect(executeSyncAndTime).toHaveBeenCalledWith(
        experimentControl,
        0,
        expect.anything()
      );
      expect(control).toHaveBeenCalledTimes(1);
      expect(formatResultsForPublish).toHaveBeenCalledWith([20]);
    });

    test("it should run control only if candidate is not enabled and return control result", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);
      syncExperiment.use(control);
      syncExperiment.try(candidate);
      expect(syncExperiment.run()).toEqual(20);

      const experimentControl = { fn: control, tag: "control" };
      expect(shuffle).toHaveBeenCalledWith([experimentControl]);
      expect(formatResultsForPublish).toHaveBeenCalledWith([20]);
    });

    test("it should run both control & candidate if enabled and return control result", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
        candidate: { value: 12 },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);
      syncExperiment.use(control);
      syncExperiment.try(candidate);
      syncExperiment.enabled(() => true);
      expect(syncExperiment.run()).toEqual(20);

      const experimentControl = { fn: control, tag: "control" };
      const experimentCandidate = { fn: candidate, tag: "candidate" };
      expect(shuffle).toHaveBeenCalledWith([
        experimentControl,
        experimentCandidate,
      ]);
      expect(formatResultsForPublish).toHaveBeenCalledWith([20, 12]);
    });

    test("it should run control and publish results", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
      }));

      const publish = jest.fn();
      const control = jest.fn(() => 20);

      syncExperiment.use(control);
      syncExperiment.publish(publish);
      expect(syncExperiment.run()).toEqual(20);

      expect(publish).toHaveBeenCalledWith({
        name: "sync test",
        execution_order: ["control"],
        control: { value: 20 },
        matched: false,
      });
    });

    test("it should publish results with matched = true if control + candidate results equal", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
        candidate: { value: 20 },
      }));

      const publish = jest.fn();
      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 20);

      syncExperiment.use(control);
      syncExperiment.try(candidate);
      syncExperiment.enabled(() => true);
      syncExperiment.publish(publish);
      expect(syncExperiment.run()).toEqual(20);

      expect(publish).toHaveBeenCalledWith({
        name: "sync test",
        execution_order: ["control", "candidate"],
        control: { value: 20 },
        candidate: { value: 20 },
        matched: true,
      });
    });

    test("it should throw an error if control throws an error", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20, error: new Error("error") },
        candidate: { value: 20 },
      }));

      const control = jest.fn(() => 20);

      syncExperiment.use(control);
      expect(() => syncExperiment.run()).toThrowErrorMatchingSnapshot();
    });

    test("it should swallow the error if candidate throws", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
        candidate: { value: 20, error: new Error("error") },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 20);

      syncExperiment.use(control);
      syncExperiment.try(candidate);
      syncExperiment.enabled(() => true);
      expect(syncExperiment.run()).toEqual(20);
    });

    test("it should call publish before throwing control error", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20, error: new Error("error") },
        error: true,
      }));

      const publish = jest.fn();
      const control = jest.fn(() => 20);
      syncExperiment.publish(publish);
      syncExperiment.use(control);

      expect(() => syncExperiment.run()).toThrowErrorMatchingSnapshot();
      expect(publish).toHaveBeenCalledWith({
        name: "sync test",
        error: true,
        execution_order: ["control"],
        control: { value: 20, error: new Error("error") },
        matched: false,
      });
    });

    test("it should call custom compare fn for testing equality", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
        candidate: { value: 12 },
      }));

      const publish = jest.fn();
      const compare = jest.fn(() => true);
      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);

      syncExperiment.publish(publish);
      syncExperiment.compare(compare);
      syncExperiment.use(control);
      syncExperiment.try(candidate);
      syncExperiment.enabled(() => true);

      expect(syncExperiment.run()).toEqual(20);
      expect(compare).toHaveBeenCalledWith(20, 12);
      expect(publish).toHaveBeenCalledWith({
        name: "sync test",
        execution_order: ["control", "candidate"],
        control: { value: 20 },
        candidate: { value: 12 },
        matched: true,
      });
    });

    test("it should call custom clean fn and publish both value & cleaned_value", () => {
      shuffle.mockImplementation((f) => f);
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
        candidate: { value: 12 },
      }));

      const publish = jest.fn();
      const clean = jest.fn((f) => f + 10);
      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);

      syncExperiment.publish(publish);
      syncExperiment.clean(clean);
      syncExperiment.use(control);
      syncExperiment.try(candidate);
      syncExperiment.enabled(() => true);

      expect(syncExperiment.run()).toEqual(20);
      expect(clean).toHaveBeenNthCalledWith(1, 20);
      expect(clean).toHaveBeenNthCalledWith(2, 12);
      expect(publish).toHaveBeenCalledWith({
        name: "sync test",
        execution_order: ["control", "candidate"],
        control: { value: 20, cleaned_value: 30 },
        candidate: { value: 12, cleaned_value: 22 },
        matched: false,
      });
    });

    describe("async", () => {
      test("it should call the async runner and return control result", async () => {
        shuffle.mockImplementation((f) => f);
        executeAsyncAndTime.mockImplementation(async (f) => await f.fn());
        formatResultsForPublish.mockImplementation(() => ({
          control: { value: 20 },
        }));

        const control = jest.fn().mockResolvedValue(20);
        asyncExperiment.use(control);
        await expect(asyncExperiment.run()).resolves.toEqual(20);
        expect(control).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("run_only", () => {
    let syncExperiment;
    let asyncExperiment;

    beforeEach(() => {
      syncExperiment = new Scientist("sync test");
      asyncExperiment = new Scientist("async test", { async: true });
    });

    test("it should throw ERROR if invalid run type", () => {
      expect(() =>
        syncExperiment.run_only("random")
      ).toThrowErrorMatchingSnapshot();
    });

    test("it should throw ERROR if no experiment to run", () => {
      expect(() =>
        syncExperiment.run_only("control")
      ).toThrowErrorMatchingSnapshot();
    });

    test("it should only run the control and return result", () => {
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        control: { value: 20 },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);

      syncExperiment.use(control);
      syncExperiment.try(candidate);

      expect(syncExperiment.run_only("control")).toEqual(20);
      expect(control).toHaveBeenCalledTimes(1);
      expect(candidate).not.toHaveBeenCalled();
    });

    test("it should only run candidate, ignoring enabled=false and return candidate result", () => {
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        candidate: { value: 12 },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);

      syncExperiment.enabled(() => false);
      syncExperiment.use(control);
      syncExperiment.try(candidate);

      expect(syncExperiment.run_only("candidate")).toEqual(12);
      expect(control).not.toHaveBeenCalled();
      expect(candidate).toHaveBeenCalledTimes(1);
    });

    test("it should throw ERROR if candidate throws error", () => {
      executeSyncAndTime.mockImplementation((f) => f.fn());
      formatResultsForPublish.mockImplementation(() => ({
        candidate: { value: 12, error: new Error("error") },
      }));

      const control = jest.fn(() => 20);
      const candidate = jest.fn(() => 12);

      syncExperiment.enabled(() => false);
      syncExperiment.use(control);
      syncExperiment.try(candidate);

      expect(() =>
        syncExperiment.run_only("candidate")
      ).toThrowErrorMatchingSnapshot();
      expect(control).not.toHaveBeenCalled();
      expect(candidate).toHaveBeenCalledTimes(1);
    });

    describe("async", () => {
      test("it should call the async runner and return control result", async () => {
        executeAsyncAndTime.mockImplementation(async (f) => await f.fn());
        formatResultsForPublish.mockImplementation(() => ({
          control: { value: 20 },
        }));

        const control = jest.fn().mockResolvedValue(20);
        const candidate = jest.fn().mockResolvedValue(12);
        asyncExperiment.use(control);
        asyncExperiment.try(candidate);

        await expect(asyncExperiment.run_only("control")).resolves.toEqual(20);
        expect(control).toHaveBeenCalledTimes(1);
        expect(candidate).not.toHaveBeenCalled();
      });
    });
  });
});
