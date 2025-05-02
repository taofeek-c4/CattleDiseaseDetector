document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded!");
  window.addEventListener("beforeunload", (e) => {
    console.log("Page is about to reload");
  });
  
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("fileInput");
  const previewImg = document.getElementById("previewImg");
  const uploadBtn = document.getElementById("uploadBtn");
  const loader = document.getElementById("loader");
  const modalBody = document.getElementById("modalBody");
  const recommendationBody = document.getElementById("recommendationBody"); // New div for recommendations
  const resultModal = new bootstrap.Modal(document.getElementById("resultModal"));

  console.log("dropArea:", dropArea);
  console.log("uploadBtn:", uploadBtn);

  let selectedFile = null;

  dropArea.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        previewImg.src = reader.result;
        previewImg.style.display = "block";
        uploadBtn.disabled = false;
      };
      reader.readAsDataURL(selectedFile);
    }
  });

  uploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
  
    if (!selectedFile) return;
  
    const formData = new FormData();
    formData.append("file", selectedFile);
  
    loader.style.display = "block";
    uploadBtn.disabled = true;
  
    setTimeout(() => {
      console.log("📤 Upload button clicked. Sending image to backend...");
      fetch("https://cattle-disease-detector-backend.onrender.com/predict/", {
        method: "POST",
        body: formData
      })
      .then(async (response) => {
        const data = await response.json().catch(err => {
          console.error("Error parsing JSON:", err);
          throw new Error("Invalid JSON response from server");
        });
  
        loader.style.display = "none";
        uploadBtn.disabled = false;
  
        if (!response.ok) {
          throw new Error(data.message || "Prediction failed");
        }
  
        const predicted = data.data.predicted_disease;
        const confidence = data.data.confidence;
  
        modalBody.innerHTML = `
          <p><strong style="color: #1ABC9C;">Disease:</strong> ${predicted}</p>
          <p><strong style="color: #1ABC9C;">Confidence:</strong> ${(confidence * 100).toFixed(2)}%</p>
        `;

        // Add recommendations based on the prediction result
        let recommendation = "";
        if (predicted === "Healthy") {
          if (confidence < 0.7) {
            recommendation = "Although the cow seems healthy, you may want to monitor its condition closely.";
          } else {
            recommendation = "Cow is healthy. Continue to provide regular care.";
          }
        } else if (predicted === "Mastitis") {
          if (confidence > 0.7) {
            recommendation = "This is a high probability of Mastitis. Immediate veterinary consultation is recommended.";
          } else if (confidence < 0.4) {
            recommendation = "The result shows a low probability of Mastitis. Consider further observation.";
          } else {
            recommendation = "The cow may have Mastitis. Monitor closely and consult a vet if needed.";
          }
        } else if (predicted === "Foot and Mouth Disease") {
          if (confidence > 0.7) {
            recommendation = "This is a high probability of Foot and Mouth Disease. Quarantine and consult a veterinarian immediately.";
          } else if (confidence < 0.4) {
            recommendation = "The result shows a low probability of Foot and Mouth Disease. Observe the cow for any symptoms.";
          } else {
            recommendation = "Foot and Mouth Disease is suspected. Immediate veterinary consultation is recommended.";
          }
        } else if (predicted === "Lumpy Skin Disease") {
          if (confidence > 0.7) {
            recommendation = "This is a high probability of Lumpy Skin Disease. Quarantine and consult a veterinarian immediately.";
          } else if (confidence < 0.4) {
            recommendation = "The result shows a low probability of Lumpy Skin Disease. Further monitoring is suggested.";
          } else {
            recommendation = "Lumpy Skin Disease is suspected. Consult a veterinarian for further guidance.";
          }
        }

        recommendationBody.innerHTML = `<p><strong>Recommendation:</strong> ${recommendation}</p>`;
        resultModal.show();
      })
      .catch((error) => {
        loader.style.display = "none";
        uploadBtn.disabled = false;
        console.error("Fetch error:", error);
        modalBody.innerHTML = `<p style="color: red;"> ${error.message}</p>`;
        recommendationBody.innerHTML = ""; // Clear recommendations
        resultModal.show();
      });
    }, 3500);
  });
}); 
