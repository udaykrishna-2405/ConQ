# ConQ ML Service

A minimal Flask API that acts as the machine-learning inference layer for the ConQ platform.

## Local Development

```bash
cd ml
pip install -r requirements.txt
python app.py
# → Listening on http://localhost:8000
```

## Endpoints

| Method | Path       | Description                     |
|--------|------------|---------------------------------|
| GET    | `/`        | Health check                    |
| POST   | `/predict` | Run model inference (stub demo) |

### Example

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [0.1, 0.5, 0.9]}'
```

## Render Deployment

| Setting       | Value                        |
|---------------|------------------------------|
| Root directory | `ml`                        |
| Build command  | `pip install -r requirements.txt` |
| Start command  | `python app.py`             |
| Environment    | `PORT` (auto-injected by Render) |
