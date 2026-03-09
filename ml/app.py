"""
ConQ ML Service — app.py
========================
A minimal Flask API that exposes the ML model over HTTP.

Render deployment:
  Root directory : ml
  Build command  : pip install -r requirements.txt
  Start command  : python app.py

Environment variables:
  PORT  — port to listen on (default: 8000, Render injects this automatically)
"""

import os
from flask import Flask, request, jsonify

# joblib is imported here so the dependency is validated at startup.
# Replace the stub predict logic with real model loading as needed.
try:
    import joblib
    _joblib_available = True
except ImportError:
    _joblib_available = False

app = Flask(__name__)

# ── Optional: load a persisted model ─────────────────────────────────────────
# model = joblib.load("model.pkl")  # Uncomment when a real model is available


# ── Health check ─────────────────────────────────────────────────────────────
@app.route("/")
def health():
    return jsonify({
        "status": "ML service running",
        "joblib_available": _joblib_available,
    })


# ── Predict endpoint ─────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON payload and returns a prediction.

    Expected request body:
        { "features": [...] }   (schema is flexible for demo purposes)

    Returns:
        { "prediction": <result> }
    """
    data = request.json
    if data is None:
        return jsonify({"error": "JSON body required"}), 400

    # ── Stub prediction — replace with real model inference ──────────────────
    # result = model.predict([data["features"]])[0]
    prediction = "demo"

    return jsonify({"prediction": prediction, "input_received": data})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
