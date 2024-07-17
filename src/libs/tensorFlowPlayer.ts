import { COURT } from "../config";
import { GetPlayerActionsFunction, MutableGameState, Player } from "../types";
import type { Tensor, Rank, io, GraphModel } from "@tensorflow/tfjs";
import { initialGameState } from "./game";

class LocalStorageIOHandler implements io.IOHandler {
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async load(): Promise<io.ModelArtifacts> {
    const modelJsonStr = localStorage.getItem(`${this.modelPath}-model.json`);
    const weightsBinStr = localStorage.getItem(`${this.modelPath}-weights.bin`);

    if (!modelJsonStr || !weightsBinStr) {
      throw new Error("Model or weights not found in local storage");
    }

    const modelJson = JSON.parse(modelJsonStr);
    const weightDataArray = JSON.parse(weightsBinStr) as number[];
    const weightData = new Uint8Array(weightDataArray).buffer;

    console.log("Loaded model JSON:", modelJson);
    console.log("Loaded weights data length:", weightData.byteLength);

    const modelArtifacts: io.ModelArtifacts = {
      modelTopology: modelJson.modelTopology,
      format: modelJson.format,
      generatedBy: modelJson.generatedBy,
      convertedBy: modelJson.convertedBy,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightData,
    };

    if (modelJson.trainingConfig) {
      modelArtifacts.trainingConfig = modelJson.trainingConfig;
    }

    if (modelJson.userDefinedMetadata) {
      modelArtifacts.userDefinedMetadata = modelJson.userDefinedMetadata;
    }

    console.log("Model artifacts created:", modelArtifacts);

    return modelArtifacts;
  }
}

function loadObservationFunction(modelName: string): typeof getObservation {
  console.log("Checking for custom observation function");
  const customObservationString = localStorage.getItem(`${modelName}-observations.js`);
  if (!customObservationString) {
    console.log("No custom observation function so using default");
    return getObservation;
  }
  const getCustomObservation = new Function(`const getObservation = ${JSON.parse(customObservationString)}; return getObservation;`)();
  console.log("Using custom observation function")
  try {
    const observation = getCustomObservation(Player.Player1, initialGameState, COURT);
    console.log("Test observation succeeded", observation);
    return getCustomObservation;
  } catch (err) {
    console.log("Test observation failed", err);
    return getObservation;
  }
}

function getObservation(player: Player, gameState: MutableGameState, court: typeof COURT) {
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

let tfPromise: Promise<typeof import("@tensorflow/tfjs")> | null = null;
const modelCache: { [key: string]: GraphModel } = {};

export async function getTensorFlowPlayer(modelName: string): Promise<GetPlayerActionsFunction> {
  if (!tfPromise) {
    tfPromise = import("@tensorflow/tfjs");
  }
  const tf = await tfPromise;

  async function loadModel() {
    if (modelCache[modelName]) {
      console.log(`Model - "${modelName}" loaded from cache`);
      return modelCache[modelName];
    }
    const model = await tf.loadGraphModel(new LocalStorageIOHandler(modelName));
    modelCache[modelName] = model;
    console.log(`Model - "${modelName}" loaded successfully`);
    return model;
  }

  console.log(`loading model - ${modelName}`);
  const model = await loadModel();
  const getObservation = loadObservationFunction(modelName);

  return (player, gameState) => {
    if (!model) {
      console.error(`Model "${modelName}" not loaded yet`);
      return { paddleDirection: 0, buttonPressed: false };
    }
    const inputTensor = tf.tensor([getObservation(player, gameState, COURT)]);
    const prediction = model.predict(inputTensor) as Tensor<Rank>;
    const [buttonPressed, paddleDirection] = prediction.dataSync();

    inputTensor.dispose();
    prediction.dispose();

    return { buttonPressed: buttonPressed > 0.5, paddleDirection: Math.max(Math.min(paddleDirection, 1), -1) * 30 };
  };
}
