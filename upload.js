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
    alert('الرجاء إدخال اسم المجموعة');
    return;
  }
  
  if (!jsonDataStr) {
    alert('الرجاء إدخال بيانات JSON');
    return;
  }
  
  // Parse JSON data
  let jsonData;
  try {
    jsonData = JSON.parse(jsonDataStr);
    
    // Ensure data is an array
    if (!Array.isArray(jsonData)) {
      throw new Error('يجب أن تكون المدخلات مصفوفة JSON');
    }
    
    // Ensure array is not empty
    if (jsonData.length === 0) {
      throw new Error('لا يمكن أن تكون مصفوفة JSON فارغة');
    }
  } catch (error) {
    alert('تنسيق JSON غير صالح: ' + error.message);
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
        // Find the ID field regardless of casing or whitespace
        let idField = Object.keys(item).find(key => 
          key.toLowerCase().trim() === 'id' || 
          key.trim() === ' id' || 
          key.trim() === 'id '
        );
        
        let docRef;
        let docData = {...item}; // Create a copy of the item
        
        if (idField) {
          // Use the found ID field value as the document ID
          const idValue = item[idField].toString().trim();
          docRef = db.collection(collectionName).doc(idValue);
          
          // Add a standardized 'id' field to the document if it doesn't exist
          if (idField !== 'id') {
            docData.id = idValue;
          }
        } else {
          // No ID field found, let Firestore generate an ID
          docRef = db.collection(collectionName).doc();
          // Add the generated ID to the document data
          docData.id = docRef.id;
        }
        
        batch.set(docRef, docData);
        processedCount++;
        statusCount.textContent = `جاري المعالجة: ${processedCount}/${totalRecords}`;
      }
      
      // Commit the batch
      await batch.commit();
      successCount += chunk.length;
    }
    
    // Show success message
    successMessage.textContent = `تم بنجاح! تم رفع ${successCount} سجل إلى المجموعة "${collectionName}".`;
    successMessage.style.display = 'block';
    
  } catch (error) {
    // Show error message
    errorMessage.textContent = 'خطأ في رفع البيانات: ' + error.message;
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
  jsonDataTextarea.placeholder = `الصق مصفوفة JSON هنا...

مثال على التنسيق:
[
  {
    "id": "001",
    "Name": "محمد أحمد",
    "Status": "تم الاستلام"
  },
  {
    "id": "002",
    "Name": "سارة محمد",
    "Status": "لم يتم الاستلام"
  }
]`;
});
