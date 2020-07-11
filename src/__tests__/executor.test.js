import { executeSyncAndTime, executeAsyncAndTime } from "../executor";

describe("Executor", () => {
  describe("executeSyncAndTime", () => {
    test("It calls experiment fn and returns timing", () => {
      const exp = { tag: "control", fn: jest.fn(() => 12) };
      expect(executeSyncAndTime(exp)).toEqual({
        tag: "control",
        value: 12,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number),
        error: undefined,
      });
      expect(exp.fn).toHaveBeenCalledTimes(1);
    });

    test("It calls experiment fn and returns error if thrown", () => {
      const exp = {
        tag: "control",
        fn: jest.fn(() => {
          throw new Error("error");
        }),
      };
      expect(executeSyncAndTime(exp)).toEqual({
        tag: "control",
        value: undefined,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number),
        error: expect.any(Error),
      });
      expect(exp.fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("executeAsyncAndTime", () => {
    test("It calls experiment fn and returns timing", async () => {
      const exp = { tag: "control", fn: jest.fn().mockResolvedValue(20) };
      await expect(executeAsyncAndTime(exp)).resolves.toEqual({
        tag: "control",
        value: 20,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number),
        error: undefined,
      });
      expect(exp.fn).toHaveBeenCalledTimes(1);
    });

    test("It calls experiment fn and returns error if thrown", async () => {
      const exp = {
        tag: "control",
        fn: jest.fn().mockRejectedValue(new Error("error")),
      };
      await expect(executeAsyncAndTime(exp)).resolves.toEqual({
        tag: "control",
        value: undefined,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number),
        error: expect.any(Error),
      });
      expect(exp.fn).toHaveBeenCalledTimes(1);
    });
  });
});
