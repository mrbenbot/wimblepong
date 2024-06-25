import { COURT } from "../config";
import { GetPlayerActionsFunction, MutableGameState, Player } from "../types";
import type { Tensor, Rank } from "@tensorflow/tfjs";

export async function getTensorFlowPlayer(modelName: string): Promise<GetPlayerActionsFunction> {
  console.log(modelName);
  const tf = await import("@tensorflow/tfjs");

  async function loadModel() {
    const model = await tf.loadGraphModel("/model.json");
    console.log("Model loaded successfully");
    return { model };
  }
  console.log("loading tf model");
  const { model } = await loadModel();

  function getObservation(player: Player, gameState: MutableGameState) {
    return [
      gameState.ball.x / COURT.width,
      gameState.ball.y / COURT.height,
      gameState.ball.dx / 40,
      gameState.ball.dy / 40,
      gameState[player].x > COURT.width / 2 ? 1 : 0,
      gameState[player].y / COURT.height,
      gameState.ball.serveMode ? 1 : 0,
      gameState.server === player ? 1 : 0,
    ];
  }

  return (player, gameState) => {
    if (!model) {
      console.error("Model not loaded yet");
      return { paddleDirection: 0, buttonPressed: false };
    }

    const inputTensor = tf.tensor([getObservation(player, gameState)]); // Expand dimensions to match the expected input shape [1, 8]
    const prediction = model.predict(inputTensor) as Tensor<Rank>[];
    const data = prediction[1].dataSync();
    return { buttonPressed: data[0] > 0.5, paddleDirection: data[1] * 60 };
  };
}
