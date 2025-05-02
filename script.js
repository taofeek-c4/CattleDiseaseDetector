document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("fileInput");
  const previewImg = document.getElementById("previewImg");
  const uploadBtn = document.getElementById("uploadBtn");
  const loader = document.getElementById("loader");
  const modalBody = document.getElementById("modalBody");
  const resultModal = new bootstrap.Modal(document.getElementById("resultModal"));

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
      fetch("https://cattle-disease-detector-backend.onrender.com/predict/", {
        method: "POST",
        body: formData
      })
      .then(async (response) => {
        const data = await response.json().catch(err => {
          console.error("Error parsing JSON:", err);
          throw new Error("Invalid response from server.");
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
        resultModal.show();
      })
      .catch((error) => {
        loader.style.display = "none";
        uploadBtn.disabled = false;
        modalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        resultModal.show();
      });
    }, 1000);
  });
});
