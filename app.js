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

// Enable console logs for Firestore
firebase.firestore.setLogLevel('debug');

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
  
  console.log('Searching for record with ID:', id);
  
  // Show loader, hide previous results and error messages
  loader.style.display = 'block';
  resultContainer.style.display = 'none';
  errorMessage.style.display = 'none';
  
  // Query Firestore for the ID
  db.collection('SampleList').doc(id).get()
    .then((doc) => {
      // Hide loader
      loader.style.display = 'none';
      
      console.log('Query returned document:', doc.exists ? 'exists' : 'does not exist');
      
      if (doc.exists) {
        // Display the result
        const data = doc.data();
        console.log('Document data:', data);
        displayResult(data);
      } else {
        // Show error message
        errorMessage.style.display = 'block';
        
        // Let's try querying by where clause to see if the ID exists as a field
        console.log('Trying alternative search method...');
        db.collection('SampleList').where('id', '==', id).get()
          .then((querySnapshot) => {
            if (!querySnapshot.empty) {
              console.log('Found via field search!');
              const doc = querySnapshot.docs[0];
              const data = doc.data();
              console.log('Document data:', data);
              displayResult(data);
              errorMessage.style.display = 'none';
              
              // Show the correct method to use
              console.log('Note: Your ID is stored as a field, not as the document ID');
            } else {
              console.log('No results found via field search either');
            }
          })
          .catch(error => {
            console.error('Error with field search:', error);
          });
      }
    })
    .catch((error) => {
      // Hide loader, show error
      loader.style.display = 'none';
      console.error('Error searching for record:', error);
      alert('An error occurred while searching. Please try again.');
    });
}

// Function to display the result
function displayResult(data) {
  // Clear previous results
  resultContent.innerHTML = '';
  
  // Create a table to display the data
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  
  // Loop through all properties in the data object
  for (const [key, value] of Object.entries(data)) {
    const row = table.insertRow();
    
    // Create cells for property name and value
    const keyCell = row.insertCell(0);
    keyCell.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
    keyCell.style.padding = '8px';
    keyCell.style.borderBottom = '1px solid #ddd';
    keyCell.style.fontWeight = 'bold';
    keyCell.style.width = '30%';
    
    const valueCell = row.insertCell(1);
    valueCell.textContent = value;
    valueCell.style.padding = '8px';
    valueCell.style.borderBottom = '1px solid #ddd';
  }
  
  // Add the table to the result content
  resultContent.appendChild(table);
  
  // Show the result container
  resultContainer.style.display = 'block';
}
