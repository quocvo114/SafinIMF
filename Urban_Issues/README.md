# Urban Issues Detector UI

This project includes a Streamlit web UI to upload one image and predict urban issue objects using your trained YOLO model in `best.pt`.

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Run the UI

```bash
streamlit run app.py
```

## 3. Use the app

1. Upload an image (`jpg`, `jpeg`, `png`, or `webp`).
2. Tune confidence and IoU thresholds from the sidebar.
3. View:
   - Input image
   - Predicted image with bounding boxes
   - Detection summary table (object counts and confidence)
4. Download the predicted image.

## Notes

- The app expects `best.pt` to be in the same folder as `app.py`.
- Class names are loaded from the model metadata. If unavailable, the app uses fallback class names from your notebook.
