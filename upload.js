// Using the same Firebase configuration from app.js
const firebaseConfig = {
  apiKey: "AIzaSyDGCfXQLUTaOY9o58pIiDxrNnl8yY6M-gU",
  authDomain: "findmyaid.firebaseapp.com",
  projectId: "findmyaid",
  storageBucket: "findmyaid.firebasestorage.app",
  messagingSenderId: "58355251229",
  appId: "1:58355251229:web:bdf4279b8a49b12700eef4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const collectionNameInput = document.getElementById('collectionName');
const jsonDataTextarea = document.getElementById('jsonData');
const uploadButton = document.getElementById('uploadButton');
const loader = document.getElementById('loader');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const statusCount = document.getElementById('statusCount');

// Add event listener to the upload button
uploadButton.addEventListener('click', uploadData);

async function uploadData() {
  // Get input values
  const collectionName = collectionNameInput.value.trim();
  const jsonDataStr = jsonDataTextarea.value.trim();
  
  // Validate inputs
  if (!collectionName) {
    alert('Please enter a collection name');
    return;
  }
  
  if (!jsonDataStr) {
    alert('Please enter JSON data');
    return;
  }
  
  // Parse JSON data
  let jsonData;
  try {
    jsonData = JSON.parse(jsonDataStr);
    
    // Ensure data is an array
    if (!Array.isArray(jsonData)) {
      throw new Error('Input must be a JSON array');
    }
    
    // Ensure array is not empty
    if (jsonData.length === 0) {
      throw new Error('JSON array cannot be empty');
    }
  } catch (error) {
    alert('Invalid JSON format: ' + error.message);
    return;
  }
  
  // Show loader, hide messages
  loader.style.display = 'block';
  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';
  statusCount.textContent = '';
  
  // Disable the upload button during processing
  uploadButton.disabled = true;
  
  try {
    // Batch write to Firestore for better performance
    const totalRecords = jsonData.length;
    let processedCount = 0;
    let successCount = 0;
    
    // Process in batches of 500 (Firestore batch write limit)
    for (let i = 0; i < jsonData.length; i += 500) {
      const batch = db.batch();
      const chunk = jsonData.slice(i, i + 500);
      
      for (const item of chunk) {
        // Use custom ID if provided, otherwise let Firestore generate one
        let docRef;
        
        if (item.id) {
          docRef = db.collection(collectionName).doc(item.id.toString());
        } else {
          docRef = db.collection(collectionName).doc();
        }
        
        batch.set(docRef, item);
        processedCount++;
        statusCount.textContent = `Processing: ${processedCount}/${totalRecords}`;
      }
      
      // Commit the batch
      await batch.commit();
      successCount += chunk.length;
    }
    
    // Show success message
    successMessage.textContent = `Success! ${successCount} records uploaded to collection "${collectionName}".`;
    successMessage.style.display = 'block';
    
  } catch (error) {
    // Show error message
    errorMessage.textContent = 'Error uploading data: ' + error.message;
    errorMessage.style.display = 'block';
    console.error('Upload error:', error);
  } finally {
    // Hide loader and re-enable button
    loader.style.display = 'none';
    uploadButton.disabled = false;
  }
}

// Add example data to help users
document.addEventListener('DOMContentLoaded', () => {
  jsonDataTextarea.placeholder = `Paste your JSON array here...

Example format:
[
  {
    "id": "001",
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": "002",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]`;
});
