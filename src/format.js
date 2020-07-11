const extractResult = (results, tag) => {
  const result = results.find((n) => n.tag === tag);
  if (!result) return null;

  const { tag: rTag, ...rest } = result;
  return rest;
};

export const formatResultsForPublish = (results) => {
  const output = {
    error: false,
    control: extractResult(results, "control"),
    candidate: extractResult(results, "candidate"),
  };

  // Check for Errors
  if (output.control?.error || output.candidate?.error) output.error = true;
  return output;
};
