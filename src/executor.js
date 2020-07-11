const getEpochTime = () => {
  if (window?.performance?.timing)
    return parseInt(
      window.performance.timing.navigationStart + window.performance.now(),
      10
    );
  return Date.now();
};

export const executeSyncAndTime = (experiment) => {
  const startTime = getEpochTime();
  let value, error;

  try {
    value = experiment.fn();
  } catch (e) {
    error = e;
  }

  const endTime = getEpochTime();
  return {
    tag: experiment.tag,
    startTime,
    endTime,
    value,
    error,
    duration: endTime - startTime,
  };
};

export const executeAsyncAndTime = async (experiment) => {
  const startTime = getEpochTime();
  let value, error;

  try {
    value = await experiment.fn();
  } catch (e) {
    error = e;
  }

  const endTime = getEpochTime();
  return {
    tag: experiment.tag,
    startTime,
    endTime,
    value,
    error,
    duration: endTime - startTime,
  };
};
