import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// --- Initialize Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAQ-DyIX3OQAl33bRGez045wIl5PqBKzNc",
  authDomain: "stem-5f6b3.firebaseapp.com",
  projectId: "stem-5f6b3",
  storageBucket: "stem-5f6b3.firebasestorage.app",
  messagingSenderId: "144002373773",
  appId: "1:144002373773:web:025b876a78dcce79412ac4",
  measurementId: "G-YN2L2TMPRG"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- DOM Elements ---
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const messageEl = document.getElementById('message');

// Redirect if already logged in
if (localStorage.getItem('username')) {
  window.location.href = 'web.html';
}

signupBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !username || !password) {
    messageEl.textContent = 'Email, username, and password are required';
    messageEl.style.color = 'hsl(0, 100%, 50%)';
    return;
  }

  // --- 1. Try Local Backend ---
  try {
    const res = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      messageEl.textContent = 'Signed up locally! Syncing with Firebase...';
      messageEl.style.color = 'green';
    } else {
      messageEl.textContent = data.error || 'Local signup failed';
      messageEl.style.color = 'hsl(0, 100%, 50%)';
    }
  } catch (err) {
    console.warn('Local backend not reachable, continuing with Firebase...');
  }

  // --- 2. Register with Firebase ---
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem('username', username);
    messageEl.textContent = 'Signup successful! Redirecting...';
    messageEl.style.color = 'green';
    setTimeout(() => {
      window.location.href = 'web.html';
    }, 1000);
  } catch (firebaseErr) {
    console.error(firebaseErr);
    messageEl.textContent = firebaseErr.message || 'Firebase signup failed';
    messageEl.style.color = 'hsl(0, 100%, 50%)';
  }
});

// Enter key submits form
[emailInput, usernameInput, passwordInput].forEach(input => {
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') signupBtn.click();
  });
});
