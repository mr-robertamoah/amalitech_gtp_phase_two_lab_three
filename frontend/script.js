// File selection handling
document.getElementById("uploadFile").addEventListener("change", function(e) {
    const file = e.target.files[0];
    handleFileSelection(file);
});

// Drag and drop functionality
const dropZone = document.body;

dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const fileInput = document.getElementById("uploadFile");
        fileInput.files = files;
        handleFileSelection(file);
    }
});

function handleFileSelection(file) {
    const fileNameElement = document.getElementById("fileName");
    const uploadButton = document.getElementById("uploadButton");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    
    if (file) {
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        
        fileNameElement.textContent = `Selected: ${file.name}`;
        uploadButton.disabled = false;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreviewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        fileNameElement.textContent = "No file selected";
        uploadButton.disabled = true;
        imagePreviewContainer.style.display = "none";
    }
}

// Handle image removal
document.getElementById("removeImage").addEventListener("click", function() {
    const fileInput = document.getElementById("uploadFile");
    const fileNameElement = document.getElementById("fileName");
    const uploadButton = document.getElementById("uploadButton");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    
    fileInput.value = "";
    fileNameElement.textContent = "No file selected";
    uploadButton.disabled = true;
    imagePreviewContainer.style.display = "none";
});

async function uploadImage() {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) errorMessage.style.display = "none";
    
    const fileInput = document.getElementById("uploadFile");
    const file = fileInput.files[0];
    const uploadButton = document.getElementById("uploadButton");
    
    if (!file) {
        if (errorMessage) {
            errorMessage.textContent = "Please select a file first.";
            errorMessage.style.display = "block";
        } else {
            alert("Please select a file.");
        }
        return;
    }
    
    // Update UI to show uploading state
    if (uploadButton) {
        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
    }
    
    const progressDisplay = document.getElementById("uploadProgress");
    if (progressDisplay) progressDisplay.style.display = "block";

    const fileName = encodeURIComponent(file.name);
    const uploadUrl = `https://amalitech-photo-sharing-app-202506.s3.eu-west-1.amazonaws.com/${fileName}`;

    try {
        const response = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
        });

        console.log("Upload response:", response);

        if (response.ok) {
            // Success handling
            if (typeof displaySuccessMessage === 'function') {
                displaySuccessMessage("Image uploaded successfully!");
            } else {
                alert("Uploaded successfully!");
            }
            
            // Reset form
            fileInput.value = "";
            const fileNameElement = document.getElementById("fileName");
            if (fileNameElement) fileNameElement.textContent = "No file selected";
            
            // Refresh the gallery after a delay
            setTimeout(displayImages, 3000);
        } else {
            // Error handling
            if (errorMessage) {
                errorMessage.textContent = `Upload failed with status: ${response.status}`;
                errorMessage.style.display = "block";
            } else {
                alert("Upload failed.");
            }
        }
    } catch (error) {
        console.error("Upload error:", error);
        if (errorMessage) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = "block";
        } else {
            alert("Upload failed due to a network error.");
        }
    } finally {
        // Reset UI
        if (typeof resetUploadUI === 'function') {
            resetUploadUI();
        } else if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = "Upload";
            if (progressDisplay) progressDisplay.style.display = "none";
        }
    }
}

function resetUploadUI() {
    const uploadButton = document.getElementById("uploadButton");
    uploadButton.disabled = true;
    uploadButton.textContent = "Upload";
    document.getElementById("uploadProgress").style.display = "none";
    document.getElementById("imagePreviewContainer").style.display = "none";
}

function displaySuccessMessage(message) {
    const alert = document.createElement("div");
    alert.textContent = message;
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.backgroundColor = "var(--secondary-color)";
    alert.style.color = "white";
    alert.style.padding = "15px 25px";
    alert.style.borderRadius = "4px";
    alert.style.zIndex = "1000";
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = "0";
        alert.style.transition = "opacity 0.5s";
        setTimeout(() => document.body.removeChild(alert), 500);
    }, 3000);
}

async function displayImages() {
    const gallery = document.getElementById("gallery");
    const loading = document.getElementById("loading");
    
    loading.style.display = "block";
    
    try {
        // Get image list from API Gateway endpoint
        const apiUrl = 'https://amlngmq685.execute-api.eu-west-1.amazonaws.com/prod/images';
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response:", data);
        
        // Clear the gallery
        gallery.innerHTML = "";
        
        // Parse body if it's a string (API Gateway proxy integration format)
        let imageData = data;
        if (data.body && typeof data.body === 'string') {
            try {
                imageData = JSON.parse(data.body);
            } catch (e) {
                console.error("Error parsing response body:", e);
            }
        }
        
        // Check if we have Contents array (S3 list objects format)
        if (imageData.Contents && Array.isArray(imageData.Contents) && imageData.Contents.length > 0) {
            // Process S3 bucket objects
            const bucketName = imageData.Name || 'amalitech-photo-sharing-app-202506';
            const region = 'eu-west-1'; // Your bucket's region
            
            imageData.Contents.forEach(item => {
                // Only process image files
                if (!isImageFile(item.Key)) return;
                
                const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${item.Key}`;
                console.log("Image URL:", imageUrl);
                const fileName = item.Key.split('/').pop(); // Get the file name from the Key
                const lastModified = new Date(item.LastModified);
                const formattedDate = lastModified.toLocaleDateString();
                
                const imageCard = document.createElement("div");
                imageCard.className = "image-card";
                
                imageCard.innerHTML = `
                    <img src="${imageUrl}" alt="${fileName}" loading="lazy">
                    <div class="image-info">
                        <div class="image-name">${fileName}</div>
                        <div class="image-date">${formattedDate}</div>
                    </div>
                `;
                
                gallery.appendChild(imageCard);
            });
            
            // If no images were added (all items might be non-image files)
            if (gallery.children.length === 0) {
                gallery.innerHTML = "<p>No images found. Upload some!</p>";
            }
        } 
        // Check for custom response format
        else if (imageData.images && Array.isArray(imageData.images)) {
            if (imageData.images.length === 0) {
                gallery.innerHTML = "<p>No images found. Upload some!</p>";
            } else {
                imageData.images.forEach(image => {
                    const date = new Date(image.timestamp || image.lastModified);
                    const formattedDate = date.toLocaleDateString();
                    console.log("Image:", image);
                    const imageCard = document.createElement("div");
                    imageCard.className = "image-card";
                    
                    imageCard.innerHTML = `
                        <img src="${image.url}" alt="${image.name}" loading="lazy">
                        <div class="image-info">
                            <div class="image-name">${image.name}</div>
                            <div class="image-date">${formattedDate}</div>
                        </div>
                    `;
                    
                    gallery.appendChild(imageCard);
                });
            }
        }
        // Handle unexpected response format
        else {
            gallery.innerHTML = "<p>No images found or unrecognized response format.</p>";
            console.log("Unexpected response format:", data);
        }
    } catch (error) {
        console.error("Error fetching images:", error);
        // For minor errors, show inline
        if (error.name === 'SyntaxError' || error.message.includes('parsing')) {
            gallery.innerHTML = `<p>Error loading images: ${error.message}</p>`;
        } else {
            // For serious errors (network issues, server problems), show inline error
            gallery.innerHTML = `<p>Failed to load images: ${error.message}. Please try again later.</p>`;
        }
    } finally {
        loading.style.display = "none";
    }
}

/**
 * Redirects to the error page with a custom message and error code
 * @param {string} message - The error message to display
 * @param {string|number} [code] - Optional error code to display
 */
function redirectToErrorPage(message, code = '') {
    let url = `error.html?message=${encodeURIComponent(message)}`;
    if (code) {
        url += `&code=${encodeURIComponent(code)}`;
    }
    // Redirect to error page
    window.location.href = url;
    console.log("Redirecting to:", url);
}

/**
 * Checks if a filename has an image extension
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if the file is an image
 */
function isImageFile(filename) {
    if (!filename) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowerCaseFilename = filename.toLowerCase();
    
    return imageExtensions.some(ext => lowerCaseFilename.endsWith(ext));
}

// Initialize the gallery on page load
window.onload = displayImages;
