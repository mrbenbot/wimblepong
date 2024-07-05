# Custom Observations

You can optionally upload a custom observations function along with your model if you want to change the observation space or the way it is normalised.

To do this simply upload a `.js` file with your custom function. Your file should contain a single expression which evaluates to be your custom function.

In the [code](src/libs/tensorFlowPlayer.ts), your file is handled like this:

```js
const getCustomObservation = new Function(`const getObservation = ${fileString}; return getObservation;`)();

const inputTensor = tf.tensor([getCustomObservation(player, gameState, COURT)]);
const prediction = model.predict(inputTensor) as Tensor<Rank>;
const [buttonPressed, paddleDirection] = prediction.dataSync();
const action = { buttonPressed: buttonPressed > 0.5, paddleDirection: Math.max(Math.min(paddleDirection, 1), -1) * 30 }
```

This means that what you name your function is inconsequential. If you want access to persistent state for whatever reason you can write an IIFE.

```js
// customObservations.js
(() => {
  let counter = 0;
  return function hopeForTheBest(player, gameState, court) {
    return [counter++ * Math.random()];
  };
})();
```

## What arguments will my function receive?

```ts
function getObservation(player: Player, gameState: MutableGameState, court: Court): number[];
```

```ts
const enum Player {
  Player1, // 0
  Player2, // 1
}

interface MutableGameState {
  server: Player;
  positionsReversed: boolean;
  [Player.Player1]: { x: number; y: number; dy: number; width: number; height: number; colour: { r: number; g: number; b: number } };
  [Player.Player2]: { x: number; y: number; dy: number; width: number; height: number; colour: { r: number; g: number; b: number } };
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    speed: number;
    serveMode: boolean;
    scoreMode: boolean;
    scoreModeTimeout: number;
  };
  stats: {
    rallyLength: number;
    serveSpeed: number;
    server: Player;
  };
}

type Court = {
  width: number;
  height: number;
};
```

There is nothing stopping you mutating the args and cheating. Code will be reviewed before each match!

The default function is as follows:

```ts
function getObservation(player: Player, gameState: MutableGameState, court: Court) {
  return [
    gameState.ball.x / court.width,
    gameState.ball.y / court.height,
    gameState.ball.dx / 40,
    gameState.ball.dy / 40,
    gameState[player].x > court.width / 2 ? 1 : 0,
    gameState[player].y / court.height,
    gameState.ball.serveMode ? 1 : 0,
    gameState.server === player ? 1 : 0,
  ];
}
```
