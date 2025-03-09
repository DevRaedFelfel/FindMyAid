// Firebase configuration - Same as other files for consistency
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
const auth = firebase.auth();

// DOM elements - Authentication
const authContainer = document.getElementById('authContainer');
const uploadContainer = document.getElementById('uploadContainer');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const loginError = document.getElementById('loginError');
const userInfo = document.getElementById('userInfo');

// DOM elements - Upload
const collectionNameInput = document.getElementById('collectionName');
const jsonDataTextarea = document.getElementById('jsonData');
const uploadButton = document.getElementById('uploadButton');
const loader = document.getElementById('loader');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const statusCount = document.getElementById('statusCount');

// Authentication state observer
auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in
    showUploadInterface(user);
  } else {
    // User is signed out
    showLoginInterface();
  }
});

// Show login interface
function showLoginInterface() {
  authContainer.style.display = 'block';
  uploadContainer.style.display = 'none';
  emailInput.value = '';
  passwordInput.value = '';
  loginError.style.display = 'none';
}

// Show upload interface
function showUploadInterface(user) {
  authContainer.style.display = 'none';
  uploadContainer.style.display = 'block';
  userInfo.textContent = `مسجل الدخول كـ: ${user.email}`;
  
  // Reset upload form
  collectionNameInput.value = '';
  jsonDataTextarea.value = '';
  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';
  statusCount.textContent = '';
}

// Login event
loginButton.addEventListener('click', function() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    loginError.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور';
    loginError.style.display = 'block';
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in successfully
      loginError.style.display = 'none';
      
      // Check if this user is in the admins collection
      db.collection('admins').doc(userCredential.user.uid).get()
        .then((doc) => {
          if (!doc.exists) {
            // Not an admin, sign them out
            auth.signOut();
            loginError.textContent = 'ليس لديك صلاحيات المسؤول للوصول إلى هذه الصفحة';
            loginError.style.display = 'block';
          }
        })
        .catch((error) => {
          console.error('Admin check error:', error);
          auth.signOut();
          loginError.textContent = 'حدث خطأ أثناء التحقق من صلاحيات المسؤول';
          loginError.style.display = 'block';
        });
    })
    .catch((error) => {
      // Handle errors
      let errorMessage = 'فشل تسجيل الدخول';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صالح';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'تم تعطيل الحساب مؤقتًا بسبب محاولات تسجيل دخول متكررة. حاول مرة أخرى لاحقًا';
      }
      
      loginError.textContent = errorMessage;
      loginError.style.display = 'block';
      console.error('Login error:', error);
    });
});

// Logout event
logoutButton.addEventListener('click', function() {
  auth.signOut().catch((error) => {
    console.error('Logout error:', error);
  });
});

// Upload event
uploadButton.addEventListener('click', async function() {
  // Check if user is authenticated
  const user = auth.currentUser;
  if (!user) {
    alert('يجب أن تكون مسجل الدخول لرفع البيانات');
    showLoginInterface();
    return;
  }
  
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
    // Add metadata about who uploaded the data
    const metadata = {
      uploadedBy: user.email,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
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
        let docData = {...item, ...metadata}; // Add metadata to each document
        
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
});

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