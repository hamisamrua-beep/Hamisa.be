// ===============================================================
// REVIEWS PAGE - Display and Manage Film Reviews
// ===============================================================

// Storage key for reviews
const REVIEWS_KEY = 'hamisa_reviews';

// Default sample reviews
const defaultReviews = [
    {
        id: '1',
        title: "Sore",
        director: "Yandy Laurens",
        year: "2025",
        reviewText: "A beautiful meditation on time and connection. The scene where she teaches him to cook Croatian stew while explaining future habits brought tears to my eyes. The future-wife concept is handled with such tenderness — it's less about sci-fi and more about the small moments that shape us.",
        rating: 4.5,
        dateAdded: new Date().toISOString()
    },
    {
        id: '2',
        title: "Sanctuary",
        director: "Zach Wigon",
        year: "2024",
        reviewText: "Tense, claustrophobic, and brilliantly acted. It's a two-hander that never lets you breathe. The power dynamics shift so constantly that you leave the cinema feeling like you've been in a boxing ring. Absolutely electric.",
        rating: 4,
        dateAdded: new Date().toISOString()
    },
    {
        id: '3',
        title: "Limonov",
        director: "Kirill Serebrennikov",
        year: "2024",
        reviewText: "A punk rock biopic that captures the chaotic essence of its subject. Serebrennikov directs with his trademark energy — it's messy, loud, and sometimes contradictory, just like Limonov himself. Essential for anyone interested in counterculture.",
        rating: 4,
        dateAdded: new Date().toISOString()
    },
    {
        id: '4',
        title: "Drive My Car",
        director: "Ryusuke Hamaguchi",
        year: "2021",
        reviewText: "Three hours long but feels like a single, perfect breath. The play within a film, the car conversations, the grief that never fully heals — it's a masterpiece about art as a way to keep living. The Uncle Vanya performance at the end is transcendent.",
        rating: 5,
        dateAdded: new Date().toISOString()
    }
];

// Initialize reviews
if (!localStorage.getItem(REVIEWS_KEY)) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(defaultReviews));
}

// ===============================================================
// GET REVIEWS FROM STORAGE
// ===============================================================
function getReviews() {
    try {
        return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || defaultReviews;
    } catch {
        return defaultReviews;
    }
}

// ===============================================================
// DISPLAY REVIEWS GRID
// ===============================================================
function displayReviews() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    
    const reviews = getReviews();
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';
    
    // Filter reviews
    let filteredReviews = reviews;
    
    if (searchTerm) {
        filteredReviews = filteredReviews.filter(review => 
            review.title.toLowerCase().includes(searchTerm) ||
            (review.director && review.director.toLowerCase().includes(searchTerm))
        );
    }
    
    if (yearFilter && yearFilter !== 'all') {
        filteredReviews = filteredReviews.filter(review => review.year === yearFilter);
    }
    
    // Show loading state
    grid.innerHTML = '<div class="loading-reviews">✨ loading reviews...</div>';
    
    setTimeout(() => {
        if (filteredReviews.length === 0) {
            grid.innerHTML = `
                <div class="empty-reviews">
                    <span class="empty-flourish">🎬</span>
                    <p>no reviews found</p>
                    ${searchTerm ? '<p class="empty-sub">try a different search</p>' : ''}
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filteredReviews.map(review => `
            <div class="review-card" data-id="${escapeHtml(review.id)}">
                <div class="review-card-inner">
                    <div class="review-year">${escapeHtml(review.year || '—')}</div>
                    <h3 class="review-title">${escapeHtml(review.title)}</h3>
                    <p class="review-director">${escapeHtml(review.director || 'unknown director')}</p>
                    <p class="review-excerpt">${escapeHtml(review.reviewText.substring(0, 100))}${review.reviewText.length > 100 ? '...' : ''}</p>
                    <div class="review-footer">
                        <span class="review-rating">${'★'.repeat(Math.floor(review.rating || 3))}</span>
                        <button class="read-more-btn" onclick="openReviewModal('${review.id}')">read more →</button>
                    </div>
                </div>
            </div>
        `).join('');
    }, 500);
}

// ===============================================================
// OPEN REVIEW MODAL
// ===============================================================
function openReviewModal(reviewId) {
    const reviews = getReviews();
    const review = reviews.find(r => r.id === reviewId);
    
    if (!review) return;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('reviewModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reviewModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content review-modal-content">
            <span class="modal-flourish">🎬</span>
            <h2 class="review-modal-title">${escapeHtml(review.title)}</h2>
            <p class="review-modal-director">${escapeHtml(review.director || 'unknown director')} · ${escapeHtml(review.year || '—')}</p>
            <div class="review-modal-text">${escapeHtml(review.reviewText).replace(/\n/g, '<br>')}</div>
            <div class="review-modal-rating">${'★'.repeat(Math.floor(review.rating || 3))}</div>
            <div class="modal-actions">
                <button class="modal-btn" onclick="closeReviewModal()">close</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ===============================================================
// CLOSE REVIEW MODAL
// ===============================================================
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===============================================================
// POPULATE YEAR FILTER
// ===============================================================
function populateYearFilter() {
    const filter = document.getElementById('yearFilter');
    if (!filter) return;
    
    const reviews = getReviews();
    const years = [...new Set(reviews.map(r => r.year).filter(Boolean))].sort().reverse();
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filter.appendChild(option);
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

// ===============================================================
// EVENT LISTENERS
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    populateYearFilter();
    displayReviews();
    
    const searchInput = document.getElementById('searchInput');
    const yearFilter = document.getElementById('yearFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', displayReviews);
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', displayReviews);
    }
});

// Make functions global for onclick handlers
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
