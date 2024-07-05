import React, { useState, useEffect, ChangeEvent, DragEvent } from "react";
import { clearItem, loadItem, saveItem } from "../libs/localStorage";
import { readFileAsArrayBuffer, readFileAsText } from "../libs/fileReader";
import Navigation from "./Navigation";
import { GITHUB_COLAB_LINK } from "../config";

const ModelUploader: React.FC = () => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [customObservationsFile, setCustomObservationsFile] = useState<File | null>(null);

  const [modelName, setModelName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [manifest, setManifest] = useState<string[]>([]);

  useEffect(() => {
    const storedManifest = loadItem("model-manifest") || [];
    setManifest(storedManifest);
  }, []);

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFiles(files);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const processFiles = (files: FileList) => {
    let newModelFile: File | null = null;
    let newWeightsFile: File | null = null;
    let customObservationsFile: File | null = null;
    let error = "";

    Array.from(files).forEach((file) => {
      if (file.name.endsWith(".json")) {
        if (newModelFile) {
          error = "Multiple model files detected. Please upload only one model.json file.";
        } else {
          newModelFile = file;
        }
      } else if (file.name.endsWith(".bin")) {
        if (newWeightsFile) {
          error = "Multiple weights files detected. Please upload only one weights.bin file.";
        } else {
          newWeightsFile = file;
        }
      } else if (file.name.endsWith(".js")) {
        if (customObservationsFile) {
          error = "Multiple custom observation files detected. Please upload only one weights.bin file.";
        } else {
          customObservationsFile = file;
        }
      } else {
        error = "Unsupported file type detected. Please upload .json and .bin files only.";
      }
    });

    if (error) {
      setErrorMessage(error);
    } else {
      setModelFile(newModelFile);
      setWeightsFile(newWeightsFile);
      setCustomObservationsFile(customObservationsFile);
      setErrorMessage("");
    }
  };

  const handleSave = async () => {
    if (!modelFile || !weightsFile || !modelName) {
      setErrorMessage("Please provide a model name and upload both model.json and weights.bin files.");
      return;
    }

    try {
      const modelJson = await readFileAsText(modelFile).then((file) => JSON.parse(file));
      const weightsArrayBuffer = await readFileAsArrayBuffer(weightsFile);

      saveItem(`${modelName}-model.json`, modelJson);
      saveItem(`${modelName}-weights.bin`, Array.from(new Uint8Array(weightsArrayBuffer)));

      if (customObservationsFile) {
        const observationFunctionString = await readFileAsText(customObservationsFile);
        saveItem(`${modelName}-observations.js`, observationFunctionString);
      }

      updateManifest(modelName);

      alert(`Model and weights ${customObservationsFile ? "and observation function " : ""}saved to local storage.`);
    } catch (error) {
      console.error("Error saving model and weights:", error);
      setErrorMessage("Error saving model and weights. Please try again.");
    }
  };

  const updateManifest = (modelName: string) => {
    const updatedManifest = [...manifest, modelName];
    setManifest(updatedManifest);
    saveItem("model-manifest", updatedManifest);
  };

  const handleDelete = (modelName: string) => {
    const updatedManifest = manifest.filter((name) => name !== modelName);
    setManifest(updatedManifest);
    clearItem(`${modelName}-model.json`);
    clearItem(`${modelName}-weights.bin`);
    saveItem("model-manifest", updatedManifest);
  };

  const preventDefault = (event: DragEvent<HTMLDivElement>) => event.preventDefault();

  return (
    <div style={{ display: "flex", justifyContent: "center", fontSize: "1.5em" }}>
      <div>
        <Navigation />
        <h2>Upload Model and Weights</h2>
        <div style={{ maxWidth: "800px", textAlign: "justify" }}>
          <p>
            Upload your Tensorflow JS models here. You need a .json file for the model description and a .bin file for the model weights. First, train
            your model and export it in the TFJS saved model format. This <a href={GITHUB_COLAB_LINK}>Google Colab</a> will guide you through the
            process.
          </p>
          <p>Uploaded models are saved to local storage and can be selected as an input type when starting a game.</p>
        </div>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <div
          onDrop={handleFileDrop}
          onDragOver={preventDefault}
          onDragEnter={preventDefault}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
          }}
          aria-label="Drag and drop area"
        >
          Drag and drop your model.json, weights.bin and (optionally) observations.js files here
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5px" }}>
          <input type="file" accept=".json,.bin" multiple onChange={handleFileSelect} aria-label="File input for model and weights" />
          <input
            type="text"
            placeholder="Enter model name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            aria-label="Model name input"
            style={{ fontSize: "inherit" }}
          />
          <button onClick={handleSave} disabled={!modelFile || !weightsFile || !modelName} aria-label="Save to Local Storage">
            Save to Local Storage
          </button>
        </div>
        {modelFile && <p>Selected model file: {modelFile.name}</p>}
        {weightsFile && <p>Selected weights file: {weightsFile.name}</p>}
        {customObservationsFile && <p>Selected observation function file: {customObservationsFile.name}</p>}
        <h2>Saved Models</h2>
        {manifest.length === 0 ? (
          <p>No models saved.</p>
        ) : (
          <ul style={{ listStyle: "none" }}>
            {manifest.map((model, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  borderBottom: "2px dashed",
                  paddingBottom: "10px",
                  paddingTop: "10px",
                }}
              >
                <span>{model}</span>
                <button onClick={() => handleDelete(model)} aria-label={`Delete ${model}`} style={{ borderColor: "red " }}>
                  Delete "{model}"
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ModelUploader;
