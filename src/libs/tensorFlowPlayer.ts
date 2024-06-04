import * as tf from "@tensorflow/tfjs";
import { GetPlayerActionsFunction } from "../types";

let model: tf.GraphModel | null = null;

export const loadModel = async (): Promise<void> => {
  model = await tf.loadGraphModel("/model.json");
};

export const getModelPlayerActions: GetPlayerActionsFunction = (player, gameState, _) => {
  if (!model) {
    console.error("Model not loaded yet");
    return { paddleDirection: 0, buttonPressed: false };
  }

  const features = [
    gameState.ball.x,
    gameState.ball.y,
    gameState.ball.dx,
    gameState.ball.dy,
    gameState[player].x,
    gameState[player].y,
    gameState.ball.serveMode ? 1 : 0,
    player === "Player1" ? 1 : 0, // get rid!
    gameState.server === player ? 1 : 0,
  ];

  const inputTensor = tf.tensor([features]); // Expand dimensions to match the expected input shape [1, 9]

  const prediction = model.predict(inputTensor) as tf.Tensor<tf.Rank>[];
  const buttonPressed = tf.sigmoid(prediction[0]).dataSync()[0];
  const paddleDirection = prediction[1].dataSync()[0];

  // console.log(buttonPressed, paddleDirection);

  return { paddleDirection: paddleDirection, buttonPressed: buttonPressed > 0.5 };
};
