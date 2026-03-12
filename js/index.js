// ===============================================================
// DATA MANAGEMENT
// ===============================================================
const STORAGE_KEY = 'hamisa_shows';
const ADMIN_PASSWORD = 'hamisa123'; // Change this to your password

// Default sample data
const defaultShows = [
    {
        title: "Sore",
        director: "Yandy Laurens",
        year: "2025",
        reviewText: "A beautiful meditation on time and connection. The scene where she teaches him to cook Croatian stew while explaining future habits brought tears to my eyes."
    },
    {
        title: "Sanctuary",
        director: "Zach Wigon",
        year: "2024",
        reviewText: "Tense, claustrophobic, and brilliantly acted. It's a two-hander that never lets you breathe."
    },
    {
        title: "Limonov",
        director: "Kirill Serebrennikov",
        year: "2024",
        reviewText: "A punk rock biopic that captures the chaotic essence of its subject."
    },
    {
        title: "Persian Lessons",
        director: "Vadim Perelman",
        year: "2020",
        reviewText: "A Holocaust film that finds a fresh angle: inventing a language to survive."
    },
    {
        title: "Drive My Car",
        director: "Ryusuke Hamaguchi",
        year: "2021",
        reviewText: "Three hours long but feels like a single, perfect breath."
    }
];

// Initialize data
if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultShows));
}

function getShows() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveShows(shows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
    renderReviews();
    if (document.getElementById('admin-section').classList.contains('active')) {
        renderAdminList();
        updateStats();
    }
}

// ===============================================================
// TOAST NOTIFICATIONS
// ===============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===============================================================
// LANDING PAGE
// ===============================================================
const landingSection = document.getElementById('landing-section');
const reviewsSection = document.getElementById('reviews-section');
const landingCanvas = document.getElementById('landingCanvas');

setTimeout(() => {
    if (!landingSection.classList.contains('hidden')) {
        transitionToReviews();
    }
}, 3000);

landingCanvas.addEventListener('click', transitionToReviews);

function transitionToReviews() {
    landingSection.classList.add('hidden');
    setTimeout(() => {
        landingSection.style.display = 'none';
        reviewsSection.classList.add('visible');
        renderReviews();
    }, 800);
}

// ===============================================================
// AUTHENTICATION
// ===============================================================
let isAuthenticated = sessionStorage.getItem('hamisa_auth') === 'true';

const loginModal = document.getElementById('loginModal');
const openAdminBtn = document.getElementById('open-admin-btn');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const loginCancelBtn = document.getElementById('loginCancelBtn');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');

openAdminBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
    passwordInput.value = '';
    loginError.textContent = '';
    passwordInput.focus();
});

loginSubmitBtn.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
        isAuthenticated = true;
        sessionStorage.setItem('hamisa_auth', 'true');
        loginModal.style.display = 'none';
        showToast('welcome, admin', 'success');
        
        // Show admin section
        reviewsSection.classList.remove('visible');
        document.getElementById('admin-section').classList.add('active');
        renderAdminList();
        updateStats();
    } else {
        loginError.textContent = 'incorrect password';
        passwordInput.value = '';
        showToast('incorrect password', 'error');
    }
});

loginCancelBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    loginError.textContent = '';
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginSubmitBtn.click();
});

loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        loginError.textContent = '';
    }
});

// Back to reviews button
document.getElementById('back-to-reviews-btn').addEventListener('click', () => {
    document.getElementById('admin-section').classList.remove('active');
    reviewsSection.classList.add('visible');
});

// ===============================================================
// REVIEWS PAGE
// ===============================================================
const grid = document.getElementById('reviewGrid');
const counterNote = document.getElementById('counterNote');
const modalOverlay = document.getElementById('reviewModal');
const modalTitle = document.getElementById('modalTitle');
const modalReview = document.getElementById('modalReview');
const closeModalBtn = document.getElementById('closeModalBtn');
const shareModalBtn = document.getElementById('shareModalBtn');
const searchInput = document.getElementById('searchInput');
const yearFilter = document.getElementById('yearFilter');
const sortFilter = document.getElementById('sortFilter');

function renderReviews() {
    const shows = getShows();
    grid.innerHTML = '';

    if (shows.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#9b846d;">no shows yet</div>';
        counterNote.innerHTML = '<span>✦ 0 shows ✦</span>';
        return;
    }

    shows.forEach((show, index) => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        const previewText = show.reviewText.length > 70 
            ? show.reviewText.substring(0, 70) + '…' 
            : show.reviewText;

        card.innerHTML = `
            <div class="card-index">${String(index + 1).padStart(2, '0')} <span>${show.year || '—'}</span></div>
            <div class="film-title">${show.title}</div>
            <div class="film-director">${show.director || ''}</div>
            <div class="film-synopsis">${previewText}</div>
            <div class="film-meta">
                <span class="badge">review</span>
                ${show.year ? '<span class="badge">' + show.year + '</span>' : ''}
            </div>
        `;

        card.addEventListener('click', () => {
            modalTitle.textContent = show.title;
            modalReview.textContent = show.reviewText;
            modalOverlay.style.display = 'flex';
        });

        grid.appendChild(card);
    });

    counterNote.innerHTML = `<span>✦ ${shows.length} shows · click any card ✦</span>`;
}

// Modal handlers
closeModalBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
});

shareModalBtn.addEventListener('click', () => {
    const text = `${modalTitle.textContent}\n\n${modalReview.textContent}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('copied to clipboard', 'success');
    });
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
    }
});

// Search (simple)
searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.review-card');
    cards.forEach(card => {
        const title = card.querySelector('.film-title').textContent.toLowerCase();
        const director = card.querySelector('.film-director').textContent.toLowerCase();
        if (title.includes(term) || director.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// ===============================================================
// ADMIN PANEL
// ===============================================================
const showForm = document.getElementById('showForm');
const titleInput = document.getElementById('title');
const directorInput = document.getElementById('director');
const yearInput = document.getElementById('year');
const reviewInput = document.getElementById('reviewText');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const showsContainer = document.getElementById('showsContainer');
const showCount = document.getElementById('showCount');
const adminStatus = document.getElementById('adminStatus');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

let editingIndex = null;

function updateStats() {
    const shows = getShows();
    document.getElementById('statsDashboard').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${shows.length}</div>
            <div class="stat-label">total shows</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${new Set(shows.map(s => s.year)).size}</div>
            <div class="stat-label">years</div>
        </div>
    `;
}

function renderAdminList() {
    const shows = getShows();
    showCount.textContent = shows.length;

    showsContainer.innerHTML = shows.map((show, index) => `
        <div class="show-item">
            <div>
                <strong>${show.title}</strong> ${show.year ? '(' + show.year + ')' : ''}
                <br><small>${show.director || ''}</small>
            </div>
            <div class="show-actions">
                <button onclick="editShow(${index})">edit</button>
                <button onclick="deleteShow(${index})" style="background:#e8cfc0;">delete</button>
            </div>
        </div>
    `).join('');
}

window.editShow = function(index) {
    const shows = getShows();
    const show = shows[index];
    titleInput.value = show.title;
    directorInput.value = show.director || '';
    yearInput.value = show.year || '';
    reviewInput.value = show.reviewText;
    editingIndex = index;
    saveBtn.textContent = '✎ update show';
};

window.deleteShow = function(index) {
    if (confirm('delete this show?')) {
        const shows = getShows();
        shows.splice(index, 1);
        saveShows(shows);
        renderAdminList();
        updateStats();
        showToast('show deleted', 'success');
        if (editingIndex === index) clearForm();
    }
};

function clearForm() {
    titleInput.value = '';
    directorInput.value = '';
    yearInput.value = '';
    reviewInput.value = '';
    editingIndex = null;
    saveBtn.textContent = '➕ add show';
}

showForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const shows = getShows();
    const newShow = {
        title: titleInput.value.trim(),
        director: directorInput.value.trim(),
        year: yearInput.value.trim(),
        reviewText: reviewInput.value.trim()
    };
    
    if (editingIndex !== null) {
        shows[editingIndex] = newShow;
        showToast('show updated', 'success');
    } else {
        shows.push(newShow);
        showToast('show added', 'success');
    }
    
    saveShows(shows);
    renderAdminList();
    updateStats();
    clearForm();
});

clearBtn.addEventListener('click', clearForm);

// Export
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(getShows(), null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hamisa_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast('exported', 'success');
});

// Import
importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const shows = JSON.parse(e.target.result);
                saveShows(shows);
                renderAdminList();
                updateStats();
                showToast(`imported ${shows.length} shows`, 'success');
            } catch {
                showToast('invalid file', 'error');
            }
        };
        reader.readAsText(file);
    }
});

// ===============================================================
// BACK TO TOP
// ===============================================================
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 300);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===============================================================
// INIT
// ===============================================================
renderReviews();
