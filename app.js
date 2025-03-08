// Firebase configuration - REPLACE WITH YOUR OWN CONFIG FROM FIREBASE CONSOLE
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
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');

// Add event listener to the search button
searchButton.addEventListener('click', searchRecord);

// Allow pressing Enter key to search
searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    searchRecord();
  }
});

// Function to search for a record
function searchRecord() {
  const id = searchInput.value.trim();
  
  if (id === '') {
    alert('Please enter an ID');
    return;
  }
  
  // Show loader, hide previous results and error messages
  loader.style.display = 'block';
  resultContainer.style.display = 'none';
  errorMessage.style.display = 'none';
  
  // Query Firestore for the ID
  db.collection('records').doc(id).get()
    .then((doc) => {
      // Hide loader
      loader.style.display = 'none';
      
      if (doc.exists) {
        // Display the result
        const data = doc.data();
        displayResult(data);
      } else {
        // Show error message
        errorMessage.style.display = 'block';
      }
    })
    .catch((error) => {
      // Hide loader, show error
      loader.style.display = 'none';
      console.error('Error searching for record:', error);
      alert('An error occurred while searching. Please try again.');
    });
}

// Function to
