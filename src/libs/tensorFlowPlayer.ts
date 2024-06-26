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

  function getPredictionIndex(model: GraphModel) {
    const inputTensor = tf.tensor([getObservation(Player.Player1, initialGameState)]);
    console.log("Performing test prediction");
    const prediction = model.predict(inputTensor) as Tensor<Rank>[];
    for (let i = 0; i < prediction.length; i++) {
      const data = prediction[i].dataSync();
      console.log(`prediction index ${i}:`, [...data]);
      if (data.length === 2) {
        console.log("prediction length matches action space");
        return i;
      }
    }
    throw new Error("could not find prediction to match action space length");
  }

  console.log(`loading model - ${modelName}`);
  const model = await loadModel();
  const predictionIndex = getPredictionIndex(model);

  return (player, gameState) => {
    if (!model) {
      console.error(`Model "${modelName}" not loaded yet`);
      return { paddleDirection: 0, buttonPressed: false };
    }
    const inputTensor = tf.tensor([getObservation(player, gameState)]); // Expand dimensions to match the expected input shape [1, 8]
    const prediction = model.predict(inputTensor) as Tensor<Rank>[];
    const data = prediction[predictionIndex].dataSync();
    return { buttonPressed: data[0] > 0.5, paddleDirection: data[1] * 60 };
  };
}
