import { formatResultsForPublish } from "../format";

describe("Format", () => {
  describe("formatResultsForPublish", () => {
    test("It returns empty output if 0 or invalid results", () => {
      const output = { error: false, control: null, candidate: null };
      expect(formatResultsForPublish([])).toEqual(output);
      expect(formatResultsForPublish([{ tag: "invalid" }])).toEqual(output);
    });

    test("It extracts control and formats the results", () => {
      const output = { error: false, control: { value: 10 }, candidate: null };
      expect(formatResultsForPublish([{ tag: "control", value: 10 }])).toEqual(
        output
      );
    });

    test("It extracts candidate and formats the results", () => {
      const output = { error: false, candidate: { value: 10 }, control: null };
      expect(
        formatResultsForPublish([{ tag: "candidate", value: 10 }])
      ).toEqual(output);
    });

    test("It sets error if there is a control error", () => {
      const output = {
        error: true,
        control: { value: 10, error: "yes" },
        candidate: null,
      };
      expect(
        formatResultsForPublish([{ tag: "control", value: 10, error: "yes" }])
      ).toEqual(output);
    });

    test("It sets error if there is a candidate error", () => {
      const output = {
        error: true,
        candidate: { value: 10, error: "yes" },
        control: null,
      };
      expect(
        formatResultsForPublish([{ tag: "candidate", value: 10, error: "yes" }])
      ).toEqual(output);
    });
  });
});
