from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
from PIL import Image
import io, os
from huggingface_hub import hf_hub_download

if not os.path.exists("best.pt"):
    hf_hub_download(
        repo_id="Alexvq/urban-issues-model",
        filename="best.pt",
        token=os.environ.get("HF_TOKEN"),
        local_dir="."
    )

app = FastAPI()
model = YOLO("best.pt")

CLASS_NAMES = [
    'Road cracks', 'Pothole', 'Illegal Parking', 'Broken Road Sign',
    'Fallen trees', 'Littering', 'Graffitti', 'Dead Animal',
    'Damaged concrete', 'Damaged Electric wires'
]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    image = Image.open(io.BytesIO(data))
    results = model(image, conf=0.25)
    detections = []
    for result in results:
        if result.boxes:
            for box in result.boxes:
                detections.append({
                    "class": CLASS_NAMES[int(box.cls.item())],
                    "confidence": round(float(box.conf.item()), 4)
                })
    return {"detections": detections}