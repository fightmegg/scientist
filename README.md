# Scientist

[![Version](https://img.shields.io/npm/v/@fightmegg/scientist.svg)](https://www.npmjs.com/package/@fightmegg/scientist)
[![Downloads](https://img.shields.io/npm/dm/@fightmegg/scientist.svg)](https://www.npmjs.com/package/@fightmegg/scientist)
[![CircleCI](https://circleci.com/gh/fightmegg/scientist/tree/master.svg?style=svg)](https://circleci.com/gh/fightmegg/scientist/tree/master)

> A JavaScript library for carefully refactoring critical paths, port of [GitHub Scientist](https://github.com/github/scientist)

## Installation

`npm install @fightmegg/scientist`


## Usage

```js
import Scientist from '@fightmegg/scientist'

const experiment = new Scientist('experiment #1');
experiment.use(() => 12); // old way
experiment.try(() => 10 - 8); // new way
experiment.publish(results => console.log(results)); // publish
const result = experiment.run();

// Sometimes we need to go Async
const experiment = new Scientist('experiment #1', { async: true });
experiment.use(async () => 12); // old way (async or promise)
experiment.try(async () => 10 - 8); // new way (async or promise)
experiment.publish(results => console.log(results)); // publish
const result = await experiment.run();
```


## How to Science

Let's pretend you are changing how the result of a calculation is obtained. Tests can help you refactor, but really you want to compare the current and refactored behaviours under load.

Pass your original code to the `use` function, and pass your new code / behaviour to the `try` function. `experiment.run` will always return whatever the `use` function returns, but it does some stuff behind the scenes:

* It decided whether or not to run the try block
* Randomizes the order in which `use` and `try` functions are run
* Measures the duration of all behaviours
* Compares the result of `try` and the result of `use`
* Swallow and record errors thrown in the `try` block
* Publishes all of this information


The `use` function is called the **control**. The `try` function is called the **candidate**

If you do not declare a **candidate**, then the control is always ran and returned.


## Creating useful experiments

The examples above are rather basic, the `try` blocks don't run yet, and none of the results get published, lets improve upon that:

```js
const experiment = new Scientist('experiment #1', { async: true });

experiment.enabled(() => {
    // see "Ramping up experiments" below
    return true;
})

experiment.publish(results => {
   // see "Publishing results" below
   console.log(results)
});

experiment.use(async () => 12);
experiment.try(async () => 10 - 8);

const result = await experiment.run();
```

#### Controlling comparison

Scientist compares control and candidate values using `lodash.isequal`. To override this behaviour, use `compare` to define how to compared observed values instead:

```js
const experiment = new Scientist('experiment #1', { async: true });

experiment.use(async () => 12);
experiment.try(async () => 10 - 8);

experiment.compare((control, candidate) => {
    return control.id === candidate.id
})

const result = await experiment.run();
```


#### Keeping it clean

Sometimes you dont want to store the full value for later analysis. For example an experiment may return a whole object instance, but you only care about a specific property. You can define how to clean these values in an experiment:

```js
const experiment = new Scientist('experiment #1', { async: true });

experiment.use(async () => 12);
experiment.try(async () => 10 - 8);

experiment.clean((value) => {
    return value.map(n => n.id).sort()
})

const result = await experiment.run();
```

And this cleaned value is available in observations in the final published result:

```js
const experiment = new Scientist('experiment #1', { async: true });

// ...

experiment.publish((result) => {
    console.log(result.control.value)           // [<User Bob>, <User alice>]
    console.log(result.control.cleaned_value)   // [alice, Bob]
})
```


#### Ramping up experiments

As a scientist, you know its always important to be able to turn your experiment off, lest it run wild. In order to control whether or not an experiment is enabled, you must include the `enabled` method in your implementation:

```js
let percentEnabled = 100;

const experiment = new Scientist('experiment #1', { async: true });

// ...

experiment.enabled(() => {
    return percentEnabled > 0 && (Math.random() * 100) < percentEnabled
})

const result = await experiment.run();
```

This code will be invoked for every method with an experiment every time, so be sensitive about its performance


#### Publishing results

Whats the point of being a Scientist if you can't publish your results?

You must implement the `publish(result)` method, and you can publish the data however you like. For example timing data could be sent to graphite, and mismatches coule be sent to a debugging service.

The structure of `result` is:

```json
{
    "name": "<Experiment Name>",
    "matched": true,
    "execution_order": ["control", "candidate"],
    "error": false,
    "control": {
        "duration": 100,
        "value": 20, 
        "cleaned_value": 20, 
        "startTime": 100002320,
        "endTime": 1000021000, 
        "error": "error ...",
    },
    "candidate": {
        "duration": 100,
        "value": 20, 
        "cleaned_value": 20, 
        "startTime": 100002320, 
        "endTime": 1000021000,
        "error": "error ...",
    },
}
```

## Breaking the rules

Sometimes it can be useful to break the rules.

### Run Control or Candidate only

There will be times when you cannot have both the control and candidate running sequentially (such as performing a database update, but l would not advise using this library for that).

In order to get around that, we can use the `run_only` method, this will either run the candidate or control, and return the result from whatever function you ran:

```js
const experiment = new Scientist('experiment #1', { async: true });

experiment.use(async () => 12);
experiment.try(async () => 10 - 8);

const candidateResult = await experiment.run_only('candidate');

// OR

const controlResult = await experiment.run_only('control');
```

In both scenarios above, the `publish` method will still be invovked, but the `control` or `candidate` properties will be `null` depending on which one you ran.


### A/B Testing

Similar to the above, we can utilize the `run_only` method to perform **A/B** testing:

```js
const experiment = new Scientist('experiment #1', { async: true });

experiment.use(async () => 12);
experiment.try(async () => 10 - 8);

const result = experiment.run_only(['control', 'candidate'][Math.round(Math.random())]);
```

## Maintainers

[@olliejennings](https://github.com/olliejennings)