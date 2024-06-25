import React, { useState, ChangeEvent, DragEvent, useEffect } from "react";

const ModelUploader: React.FC = () => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Clean up FileReader objects if needed
    return () => {
      setModelFile(null);
      setWeightsFile(null);
    };
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
      } else {
        error = "Unsupported file type detected. Please upload .json and .bin files only.";
      }
    });

    if (error) {
      setErrorMessage(error);
    } else {
      setModelFile(newModelFile);
      setWeightsFile(newWeightsFile);
      setErrorMessage("");
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSave = async () => {
    if (!modelFile || !weightsFile || !modelName) {
      setErrorMessage("Please provide a model name and upload both model.json and weights.bin files.");
      return;
    }

    try {
      const modelJson = await readFileAsText(modelFile);
      const weightsArrayBuffer = await readFileAsArrayBuffer(weightsFile);

      localStorage.setItem(`${modelName}-model.json`, modelJson);
      localStorage.setItem(`${modelName}-weights.bin`, JSON.stringify(Array.from(new Uint8Array(weightsArrayBuffer))));

      updateManifest(modelName);

      alert("Model and weights saved to local storage.");
    } catch (error) {
      console.error("Error saving model and weights:", error);
      setErrorMessage("Error saving model and weights. Please try again.");
    }
  };

  const updateManifest = (modelName: string) => {
    const manifest = JSON.parse(localStorage.getItem("model-manifest") || "[]");
    if (!manifest.includes(modelName)) {
      manifest.push(modelName);
      localStorage.setItem("model-manifest", JSON.stringify(manifest));
    }
  };

  const preventDefault = (event: DragEvent<HTMLDivElement>) => event.preventDefault();

  return (
    <div>
      <h1>Upload Model and Weights</h1>
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
        Drag and drop your model.json and weights.bin files here
      </div>
      <input type="file" accept=".json,.bin" multiple onChange={handleFileSelect} aria-label="File input for model and weights" />
      <input
        type="text"
        placeholder="Enter model name"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        aria-label="Model name input"
      />
      <button onClick={handleSave} disabled={!modelFile || !weightsFile || !modelName} aria-label="Save to Local Storage">
        Save to Local Storage
      </button>
      {modelFile && <p>Selected model file: {modelFile.name}</p>}
      {weightsFile && <p>Selected weights file: {weightsFile.name}</p>}
    </div>
  );
};

export default ModelUploader;
