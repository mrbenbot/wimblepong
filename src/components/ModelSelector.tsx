import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModelSelector: React.FC = () => {
  const [models, setModels] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const manifest = JSON.parse(localStorage.getItem("model-manifest") || "[]");
    setModels(manifest);
  }, []);

  const handleModelSelect = (modelName: string) => {
    navigate(`/mouse/${modelName}`);
  };

  return (
    <div>
      <h1>Select a Model</h1>
      {models.length > 0 ? (
        <ul>
          {models.map((model) => (
            <li key={model}>
              <button onClick={() => handleModelSelect(model)}>{model}</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No models available. Please upload a model first.</p>
      )}
    </div>
  );
};

export default ModelSelector;
