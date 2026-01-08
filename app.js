// Import Firebase functions from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBxOeKt0SSZ9FfmwIvSc7culipNp_sWcU",
  authDomain: "hrhayat-e6954.firebaseapp.com",
  projectId: "hrhayat-e6954",
  storageBucket: "hrhayat-e6954.firebasestorage.app",
  messagingSenderId: "1012128984504",
  appId: "1:1012128984504:web:e3883ad6c332df777ab34d",
  measurementId: "G-RYVJY79XP5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const postsCollection = collection(db, "posts");

// --- PUBLIC USER FUNCTIONS ---

async function loadPublicPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return; // We are not on index.html

    container.innerHTML = ''; // Clear loading text
    const querySnapshot = await getDocs(postsCollection);
    
    querySnapshot.forEach((doc) => {
        const post = doc.data();
        const html = `
            <div class="card">
                <span class="category-tag">${post.category}</span>
                <h3>${post.title}</h3>
                <p style="white-space: pre-line;">${post.content}</p>
                <small>By: <strong>${post.author}</strong></small>
                <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                    <i class="fas fa-star" style="color:gold"></i> ${post.rating || 0}/5
                    <span style="float:right; color:#888;"><i class="fas fa-eye"></i> ${post.views || 0}</span>
                </div>
                <button onclick="window.viewPost('${doc.id}')" class="btn" style="width:100%; margin-top:10px; background:#f0f0f0;">Read More</button>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Function to simulate clicking a post (Increments View Count)
window.viewPost = async (id) => {
    const postRef = doc(db, "posts", id);
    // Atomically increment the view count in Firebase
    await updateDoc(postRef, {
        views: increment(1)
    });
    alert("Post viewed! (View count incremented in DB)");
    location.reload(); 
};

// --- ADMIN FUNCTIONS ---

async function handleAdminPanel() {
    const form = document.getElementById('addPostForm');
    if (!form) return; // We are not on admin.html

    // 1. Submit New Post
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const category = document.getElementById('category').value;
        const content = document.getElementById('content').value;

        try {
            await addDoc(postsCollection, {
                title, author, category, content,
                views: 0,
                rating: 5, // Default rating for now
                timestamp: new Date()
            });
            alert("Post Published Successfully!");
            form.reset();
            loadAdminPosts(); // Refresh list
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    });

    // 2. Load Analytics Graph
    loadAnalytics();
    
    // 3. Load Post List for Deletion
    loadAdminPosts();
}

async function loadAnalytics() {
    const querySnapshot = await getDocs(postsCollection);
    const titles = [];
    const views = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        titles.push(data.title.substring(0, 10) + "..."); // Shorten title
        views.push(data.views || 0);
    });

    // Draw Chart.js Graph
    const ctx = document.getElementById('viewsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: titles,
            datasets: [{
                label: 'Total Views',
                data: views,
                backgroundColor: 'rgba(108, 92, 231, 0.6)',
                borderColor: 'rgba(108, 92, 231, 1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

async function loadAdminPosts() {
    const container = document.getElementById('admin-posts-list');
    container.innerHTML = '';
    const querySnapshot = await getDocs(postsCollection);
    
    querySnapshot.forEach((docSnip) => {
        const post = docSnip.data();
        const html = `
            <div class="card" style="border-left: 5px solid var(--primary);">
                <h4>${post.title}</h4>
                <p>${post.category}</p>
                <button onclick="window.deletePost('${docSnip.id}')" class="btn btn-danger">Delete</button>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Expose Delete to Window object (needed for module script)
window.deletePost = async (id) => {
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDoc(doc(db, "posts", id));
        alert("Deleted!");
        location.reload();
    }
}

// --- INITIALIZATION ---
// Check which page we are on
if (document.getElementById('posts-container')) {
    loadPublicPosts();
}
if (document.getElementById('addPostForm')) {
    handleAdminPanel();
}
