import streamlit as st
from ultralytics import YOLO
from PIL import Image
import numpy as np
import os

os.environ['STREAMLIT_SERVER_HEADLESS'] = 'true'
st.set_page_config(page_title="Urban Issues Detection", layout="wide")

# Load model
@st.cache_resource
def load_model():
    return YOLO('best.pt')

model = load_model()

CLASS_NAMES = [
    'Road cracks', 'Pothole', 'Illegal Parking', 'Broken Road Sign',
    'Fallen trees', 'Littering', 'Graffitti', 'Dead Animal',
    'Damaged concrete', 'Damaged Electric wires'
]

st.title("🏙️ Urban Issues Detection")
st.write("Upload an image to detect urban infrastructure issues")

uploaded_file = st.file_uploader("Choose an image", type=['jpg', 'jpeg', 'png'])

if uploaded_file:
    image = Image.open(uploaded_file)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("Original Image:")
        st.image(image)
    
    # Run inference
    results = model(image, conf=0.25)
    
    with col2:
        st.write("Predictions:")
        annotated_img = results[0].plot()
        st.image(annotated_img)
    
    # Display detections
    detections = []
    for result in results:
        if result.boxes:
            for box in result.boxes:
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())
                detections.append({
                    'Class': CLASS_NAMES[class_id],
                    'Confidence': f'{confidence*100:.2f}%'
                })
    
    if detections:
        st.write(f"**Found {len(detections)} objects:**")
        st.dataframe(detections, use_container_width=True)
    else:
        st.info("No objects detected")