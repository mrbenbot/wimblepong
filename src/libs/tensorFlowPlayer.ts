import * as tf from "@tensorflow/tfjs";
import { GetPlayerActionsFunction } from "../types";

let model: tf.LayersModel | null = null;

export const loadModel = async (): Promise<void> => {
  model = await tf.loadLayersModel("/model.json");
};

export const getModelPlayerActions: GetPlayerActionsFunction = (player, gameState, _, positionsReversed) => {
  if (!model) {
    console.error("Model not loaded yet");
    return { paddleDirection: 0, buttonPressed: false };
  }

  const features = [
    gameState.ball.x,
    gameState.ball.y,
    gameState.ball.dx,
    gameState.ball.dy,
    gameState.paddle1.y,
    gameState.paddle1.height,
    gameState.paddle2.y,
    gameState.paddle2.height,
    positionsReversed ? 1 : 0,
    player === "Player1" ? 1 : 0,
  ];

  const inputTensor = tf.tensor2d([features]);

  const prediction = model.predict(inputTensor) as tf.Tensor[];
  const paddleDirection = prediction[0].dataSync()[0];
  const buttonPressed = prediction[1].dataSync()[0] > 0;

  return { paddleDirection, buttonPressed };
};
