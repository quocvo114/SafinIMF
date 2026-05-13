import React, { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detections, setDetections] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:5000";

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
      setDetections(null);
      setAnnotatedImage(null);
    }
  };

  const handlePredict = async () => {
    if (!image) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data = await response.json();
      setDetections(data.detections);
      setAnnotatedImage(data.image);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Urban Issues Detection</h1>
        <p>Detect urban infrastructure issues using AI</p>
      </div>

      <div className="upload-section">
        <label className="file-input-label">
          📸 Choose Image
          <input type="file" accept="image/*" onChange={handleImageSelect} />
        </label>

        {preview && (
          <div className="preview">
            <img src={preview} alt="Preview" />
            <button
              onClick={handlePredict}
              disabled={loading}
              className="predict-btn"
            >
              {loading ? "⏳ Analyzing..." : "🔍 Predict"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error">
          <p>❌ {error}</p>
        </div>
      )}

      {annotatedImage && (
        <div className="results">
          <h2>Detection Results</h2>
          <img
            src={annotatedImage}
            alt="Annotated"
            className="annotated-image"
          />

          <div className="detections-list">
            <h3>Found {detections?.length || 0} objects:</h3>
            {detections && detections.length > 0 ? (
              <ul>
                {detections.map((detection, idx) => (
                  <li key={idx}>
                    <span className="class-name">{detection.class_name}</span>
                    <span className="confidence">
                      {(detection.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No objects detected</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
