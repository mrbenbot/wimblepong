import * as tf from "@tensorflow/tfjs";
import { GetPlayerActionsFunction } from "../types";

// Load weights from JSON file
async function loadWeights() {
  const response = await fetch("/weights.json");
  const weights = await response.json();
  return weights;
}

// Construct the model in TensorFlow.js
function createModel() {
  const input = tf.input({ shape: [8], name: "input_layer" });

  // Policy network
  const dense1Policy = tf.layers.dense({ units: 64, activation: "tanh", name: "dense1_policy" }).apply(input);
  const dense2Policy = tf.layers.dense({ units: 64, activation: "tanh", name: "dense2_policy" }).apply(dense1Policy);
  const actionOutput = tf.layers.dense({ units: 2, name: "action_output" }).apply(dense2Policy);

  // Value network
  const dense1Value = tf.layers.dense({ units: 64, activation: "tanh", name: "dense1_value" }).apply(input);
  const dense2Value = tf.layers.dense({ units: 64, activation: "tanh", name: "dense2_value" }).apply(dense1Value);
  const valueOutput = tf.layers.dense({ units: 1, name: "value_output" }).apply(dense2Value);

  return tf.model({ inputs: input, outputs: [actionOutput as tf.SymbolicTensor, valueOutput as tf.SymbolicTensor] });
}

// Assign weights to the model
async function assignWeights(model: tf.LayersModel, weights: Record<string, number[]>) {
  model
    .getLayer("dense1_policy")
    .setWeights([tf.tensor(weights["mlp_extractor.policy_net.0.weight"]).transpose(), tf.tensor(weights["mlp_extractor.policy_net.0.bias"])]);
  model
    .getLayer("dense2_policy")
    .setWeights([tf.tensor(weights["mlp_extractor.policy_net.2.weight"]).transpose(), tf.tensor(weights["mlp_extractor.policy_net.2.bias"])]);

  model
    .getLayer("dense1_value")
    .setWeights([tf.tensor(weights["mlp_extractor.value_net.0.weight"]).transpose(), tf.tensor(weights["mlp_extractor.value_net.0.bias"])]);
  model
    .getLayer("dense2_value")
    .setWeights([tf.tensor(weights["mlp_extractor.value_net.2.weight"]).transpose(), tf.tensor(weights["mlp_extractor.value_net.2.bias"])]);

  model.getLayer("action_output").setWeights([tf.tensor(weights["action_net.weight"]).transpose(), tf.tensor(weights["action_net.bias"])]);
  model.getLayer("value_output").setWeights([tf.tensor(weights["value_net.weight"]).transpose(), tf.tensor(weights["value_net.bias"])]);
}

// Main function to load weights and create model
export async function loadModel() {
  const weights = await loadWeights();
  model = createModel();
  await assignWeights(model, weights);

  const normalizationParams = await fetch("/normalization_params.json").then((response) => response.json());

  mean = tf.tensor(normalizationParams.mean);
  std = tf.tensor(normalizationParams.std);

  console.log("Model loaded successfully");
}

let model: tf.LayersModel | null = null;
let mean: tf.Tensor<tf.Rank> | null = null;
let std: tf.Tensor<tf.Rank> | null = null;

function preprocessObservation(obs: tf.Tensor<tf.Rank>) {
  if (!mean || !std) return obs;
  // const normalizedObs = tf.sub(obs, mean).div(std);
  const normalizedObs = obs.sub(mean).div(std);
  return normalizedObs;
}

// export const loadModel = async (): Promise<void> => {
//   // Load normalization parameters
//   const normalizationParams = await fetch("/normalization_params.json").then((response) => response.json());

//   mean = tf.tensor(normalizationParams.mean);
//   std = tf.tensor(normalizationParams.std);

//   model = await tf.loadLayersModel("/model.json");
// };

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
    gameState.server === player ? 1 : 0,
  ];

  const inputTensor = tf.tensor([features]); // Expand dimensions to match the expected input shape [1, 8]
  const normalizedObs = preprocessObservation(inputTensor);
  const prediction = model.predict(normalizedObs) as tf.Tensor<tf.Rank>[];
  const paddleDirection = prediction[0].dataSync()[1];

  // console.log(buttonPressed, paddleDirection);

  return { paddleDirection: paddleDirection, buttonPressed: true };
};
