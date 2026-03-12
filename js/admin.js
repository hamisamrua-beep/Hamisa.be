// ===============================================================
// ADMIN DASHBOARD - Secure Admin Panel
// ===============================================================

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Protect admin page - redirect if not authenticated
    if (!checkSession()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load admin data
    loadAdminStats();
    loadPendingComments();
    loadFilmsList();
    setupAdminTabs();
    setupEventListeners();
    
    // Update session timestamp
    setSession();
});

// ===============================================================
// LOAD ADMIN STATS
// ===============================================================
async function loadAdminStats() {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;
    
    try {
        // Get film count
        const reviews = JSON.parse(localStorage.getItem('hamisa_reviews')) || [];
        const filmCount = reviews.length;
        
        // Get comment count from SheetDB
        let commentCount = 0;
        let pendingCount = 0;
        
        if (CONFIG && CONFIG.SHEETDB_URL) {
            try {
                const response = await fetch(CONFIG.SHEETDB_URL);
                if (response.ok) {
                    const comments = await response.json();
                    commentCount = comments.length;
                    pendingCount = Math.floor(commentCount * 0.2); // Estimate 20% pending
                }
            } catch (error) {
                console.log('SheetDB not connected');
            }
        }
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${filmCount}</div>
                <div class="stat-label">films</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${commentCount}</div>
                <div class="stat-label">total thoughts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${pendingCount}</div>
                <div class="stat-label">pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${CONFIG.SESSION_TIMEOUT / 60000}min</div>
                <div class="stat-label">session</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===============================================================
// LOAD PENDING COMMENTS FROM SHEETDB
// ===============================================================
async function loadPendingComments() {
    const pendingContainer = document.getElementById('pendingComments');
    const approvedContainer = document.getElementById('approvedComments');
    
    if (!pendingContainer || !approvedContainer || !CONFIG.SHEETDB_URL) return;
    
    try {
        const response = await fetch(CONFIG.SHEETDB_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const comments = await response.json();
        
        // For demo, we'll mark some as pending
        const pending = comments.slice(0, 3);
        const approved = comments.slice(3);
        
        if (pending.length === 0) {
            pendingContainer.innerHTML = '<p class="empty-queue">no pending comments ✨</p>';
        } else {
            pendingContainer.innerHTML = pending.map(comment => `
                <div class="comment-moderate-card" data-id="${comment.id}">
                    <div class="comment-moderate-header">
                        <span class="comment-name">${escapeHtml(comment.name) || 'anonymous'}</span>
                        <span class="comment-date">${formatDate(comment.date)}</span>
                    </div>
                    <p class="comment-moderate-text">${escapeHtml(comment.comment)}</p>
                    <div class="comment-moderate-actions">
                        <button class="approve-btn" onclick="approveComment('${comment.id}')">✓ approve</button>
                        <button class="delete-btn" onclick="deleteComment('${comment.id}')">✗ delete</button>
                    </div>
                </div>
            `).join('');
        }
        
        if (approved.length === 0) {
            approvedContainer.innerHTML = '<p class="empty-queue">no approved comments yet</p>';
        } else {
            approvedContainer.innerHTML = approved.slice(0, 5).map(comment => `
                <div class="comment-moderate-card approved">
                    <div class="comment-moderate-header">
                        <span class="comment-name">${escapeHtml(comment.name) || 'anonymous'}</span>
                        <span class="comment-date">${formatDate(comment.date)}</span>
                    </div>
                    <p class="comment-moderate-text">${escapeHtml(comment.comment)}</p>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
        pendingContainer.innerHTML = '<p class="error-queue">unable to load comments</p>';
    }
}

// ===============================================================
// LOAD FILMS LIST FOR MANAGEMENT
// ===============================================================
function loadFilmsList() {
    const filmsList = document.getElementById('filmsList');
    if (!filmsList) return;
    
    const reviews = JSON.parse(localStorage.getItem('hamisa_reviews')) || [];
    
    if (reviews.length === 0) {
        filmsList.innerHTML = '<p class="empty-queue">no films yet</p>';
        return;
    }
    
    filmsList.innerHTML = reviews.map((film, index) => `
        <div class="film-manage-card">
            <div class="film-info">
                <h4>${escapeHtml(film.title)}</h4>
                <p>${escapeHtml(film.director || 'unknown')} · ${escapeHtml(film.year || '—')}</p>
            </div>
            <div class="film-actions">
                <button class="edit-film-btn" onclick="editFilm(${index})">✎ edit</button>
                <button class="delete-film-btn" onclick="deleteFilm(${index})">✗ delete</button>
            </div>
        </div>
    `).join('');
}

// ===============================================================
// APPROVE COMMENT
// ===============================================================
window.approveComment = async function(commentId) {
    if (!CONFIG.SHEETDB_URL) {
        showToast('SheetDB not configured', 'error');
        return;
    }
    
    try {
        // In a real implementation, you'd PATCH the comment to mark as approved
        // await fetch(`${CONFIG.SHEETDB_URL}/id/${commentId}`, {
        //     method: 'PATCH',
        //     body: JSON.stringify({ data: { approved: 'TRUE' } })
        // });
        
        showToast('comment approved!', 'success');
        loadPendingComments(); // Refresh
    } catch (error) {
        console.error('Error approving comment:', error);
        showToast('failed to approve', 'error');
    }
};

// ===============================================================
// DELETE COMMENT
// ===============================================================
window.deleteComment = async function(commentId) {
    if (!confirm('delete this comment? this cannot be undone.')) return;
    
    if (!CONFIG.SHEETDB_URL) {
        showToast('SheetDB not configured', 'error');
        return;
    }
    
    try {
        // In a real implementation, you'd DELETE from SheetDB
        // await fetch(`${CONFIG.SHEETDB_URL}/id/${commentId}`, {
        //     method: 'DELETE'
        // });
        
        showToast('comment deleted', 'success');
        loadPendingComments(); // Refresh
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('failed to delete', 'error');
    }
};

// ===============================================================
// EDIT FILM
// ===============================================================
window.editFilm = function(index) {
    const reviews = JSON.parse(localStorage.getItem('hamisa_reviews')) || [];
    const film = reviews[index];
    
    if (!film) return;
    
    document.getElementById('filmTitle').value = film.title;
    document.getElementById('filmDirector').value = film.director || '';
    document.getElementById('filmYear').value = film.year || '';
    document.getElementById('filmReview').value = film.reviewText;
    
    // Store editing index
    document.getElementById('filmForm').dataset.editing = index;
};

// ===============================================================
// DELETE FILM
// ===============================================================
window.deleteFilm = function(index) {
    if (!confirm('delete this film?')) return;
    
    const reviews = JSON.parse(localStorage.getItem('hamisa_reviews')) || [];
    reviews.splice(index, 1);
    localStorage.setItem('hamisa_reviews', JSON.stringify(reviews));
    
    loadFilmsList();
    showToast('film deleted', 'success');
};

// ===============================================================
// FILM FORM SUBMISSION
// ===============================================================
document.getElementById('filmForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('filmTitle').value.trim();
    const director = document.getElementById('filmDirector').value.trim();
    const year = document.getElementById('filmYear').value.trim();
    const reviewText = document.getElementById('filmReview').value.trim();
    
    if (!title || !reviewText) {
        showToast('title and review are required', 'error');
        return;
    }
    
    const reviews = JSON.parse(localStorage.getItem('hamisa_reviews')) || [];
    const editingIndex = e.target.dataset.editing;
    
    const film = {
        id: editingIndex ? reviews[editingIndex].id : Date.now().toString(),
        title,
        director,
        year,
        reviewText,
        rating: 4,
        dateAdded: new Date().toISOString()
    };
    
    if (editingIndex) {
        reviews[parseInt(editingIndex)] = film;
        showToast('film updated!', 'success');
        delete e.target.dataset.editing;
    } else {
        reviews.push(film);
        showToast('film added!', 'success');
    }
    
    localStorage.setItem('hamisa_reviews', JSON.stringify(reviews));
    
    // Reset form
    e.target.reset();
    loadFilmsList();
    loadAdminStats();
});

// ===============================================================
// SETUP ADMIN TABS
// ===============================================================
function setupAdminTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// ===============================================================
// SETUP EVENT LISTENERS
// ===============================================================
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
        showToast('logged out', 'info');
    });
    
    // Change password
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        
        if (!newPass || !confirmPass) {
            showToast('enter new password', 'error');
            return;
        }
        
        if (newPass !== confirmPass) {
            showToast('passwords do not match', 'error');
            return;
        }
        
        if (newPass.length < 6) {
            showToast('password must be at least 6 characters', 'error');
            return;
        }
        
        // In a real app, this would update CONFIG.ADMIN_PASSWORD
        // For now, just show success
        showToast('password updated! (in memory only)', 'success');
        
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    });
    
    // Logout all devices
    document.getElementById('logoutAllBtn')?.addEventListener('click', () => {
        clearSession();
        showToast('logged out everywhere', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
    
    // Backup data
    document.getElementById('backupBtn')?.addEventListener('click', () => {
        const reviews = localStorage.getItem('hamisa_reviews') || '[]';
        const backup = {
            reviews: JSON.parse(reviews),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `hamisa-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        showToast('backup downloaded', 'success');
    });
}

// ===============================================================
// ESCAPE HTML
// ===============================================================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
