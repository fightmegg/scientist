import { shuffle } from "../shuffle";
import isequal from "lodash.isequal";

describe("Shuffle", () => {
  test("does not always return the same ordering", () => {
    const arr = [1, 2];

    while (true) {
      const output = shuffle(arr);
      if (isequal(arr, [2, 1])) break;
      else expect(output).toEqual(arr);
    }
  });
});
