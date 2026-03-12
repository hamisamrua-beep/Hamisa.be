// ===============================================================
// THOUGHTS PAGE - With SheetDB Integration
// ===============================================================

// Get SheetDB URL from main config
const SHEETDB_URL = CONFIG.SHEETDB_URL;

// ===============================================================
// FETCH COMMENTS FROM SHEETDB
// ===============================================================
async function getComments() {
    try {
        const response = await fetch(SHEETDB_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        return data.map(row => ({
            id: row.id,
            name: sanitizeInput(row.name) || 'anonymous',
            comment: sanitizeInput(row.comment) || '',
            date: row.date || new Date().toISOString(),
            likes: parseInt(row.likes) || 0,
            anonymous: row.anonymous === 'TRUE' || row.anonymous === 'true',
            parent_id: row.parent_id && row.parent_id !== 'undefined' ? row.parent_id : null
        }));
    } catch (error) {
        console.error('Error fetching comments:', error);
        showToast('🤔 having trouble connecting...', 'error');
        return [];
    }
}

// ===============================================================
// SAVE COMMENT TO SHEETDB
// ===============================================================
async function saveComment(comment) {
    try {
        // Rate limiting
        if (!canPostComment()) {
            showToast('🐌 slow down! wait a few seconds', 'error');
            return false;
        }
        
        const now = new Date();
        const formattedDate = now.toISOString();
        
        const response = await fetch(SHEETDB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [{
                    name: sanitizeInput(comment.name) || 'anonymous',
                    comment: sanitizeInput(comment.comment),
                    date: formattedDate,
                    likes: '0',
                    anonymous: comment.anonymous ? 'TRUE' : 'FALSE',
                    parent_id: comment.parent_id || ''
                }]
            })
        });
        
        if (response.ok) {
            showToast('✨ thought sent to the universe!');
            return true;
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving comment:', error);
        showToast('🌈 thought got lost... try again?', 'error');
        return false;
    }
}

// ===============================================================
// UPDATE LIKES IN SHEETDB
// ===============================================================
async function updateLikes(commentId, newLikes) {
    try {
        await fetch(`${SHEETDB_URL}/id/${commentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    likes: newLikes.toString()
                }
            })
        });
    } catch (error) {
        console.error('Error updating likes:', error);
    }
}

// ===============================================================
// DISPLAY COMMENTS
// ===============================================================
async function displayComments() {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-thoughts">
            <span class="loading-flourish">☁️</span>
            <p>gathering thoughts...</p>
        </div>
    `;
    
    const comments = await getComments();
    
    // Separate top-level comments from replies
    const topLevelComments = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    
    const sortBy = document.getElementById('sortComments')?.value || 'newest';
    
    // Sort comments
    if (sortBy === 'popular') {
        topLevelComments.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'oldest') {
        topLevelComments.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
        topLevelComments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    if (topLevelComments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-flourish">🫧</span>
                <p>no thoughts yet... be the first!</p>
            </div>
        `;
        updateStats(0);
        return;
    }
    
    let html = '';
    for (const comment of topLevelComments) {
        const commentReplies = replies.filter(r => r.parent_id === comment.id);
        
        html += `
            <div class="thought-card" data-id="${escapeHtml(comment.id)}">
                <div class="thought-header">
                    <span class="thought-name">${comment.anonymous ? '🕵️‍♀️ sneaky friend' : escapeHtml(comment.name)}</span>
                    <span class="thought-date">${formatDate(comment.date)}</span>
                </div>
                <div class="thought-content">${escapeHtml(comment.comment)}</div>
                <div class="thought-footer">
                    <div class="like-section">
                        <button class="like-btn ${localStorage.getItem(`liked-${comment.id}`) ? 'liked' : ''}" 
                                onclick="toggleLike('${comment.id}', ${comment.likes})">❤️</button>
                        <span id="likes-${comment.id}">${comment.likes}</span>
                    </div>
                    <button class="reply-btn" onclick="showReplyForm('${comment.id}')">💬 reply</button>
                    ${comment.anonymous ? '<span class="sneaky-badge">sneaky mode</span>' : ''}
                </div>
                <div class="reply-form" id="reply-form-${comment.id}">
                    <input type="text" class="reply-input" id="reply-name-${comment.id}" 
                           placeholder="your name (or stay sneaky)" maxlength="50">
                    <input type="text" class="reply-input" id="reply-text-${comment.id}" 
                           placeholder="type your reply..." maxlength="500">
                    <button class="reply-submit" onclick="postReply('${comment.id}')">send reply ✨</button>
                </div>
                ${renderReplies(commentReplies)}
            </div>
        `;
    }
    
    container.innerHTML = html;
    updateStats(topLevelComments.length);
}

// ===============================================================
// RENDER REPLIES
// ===============================================================
function renderReplies(replies) {
    if (!replies || replies.length === 0) return '';
    
    let html = '<div class="replies">';
    replies.forEach(reply => {
        html += `
            <div class="reply-card">
                <span class="reply-name">${reply.anonymous ? '🕵️‍♀️' : escapeHtml(reply.name)}</span>
                <span class="reply-time">${formatDate(reply.date)}</span>
                <p>${escapeHtml(reply.comment)}</p>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ===============================================================
// POST NEW COMMENT
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) return;
    
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name')?.value.trim() || 'anonymous';
        const comment = document.getElementById('comment')?.value.trim();
        const anonymous = document.getElementById('anonymousCheck')?.checked || false;
        const captcha = document.getElementById('captcha')?.value;
        
        // Validate CAPTCHA
        if (parseInt(captcha) !== 4) {
            showToast('🧸 2+2 is 4! try again', 'error');
            return;
        }
        
        // Validate comment
        if (!comment) {
            showToast('🌸 write something sweet first!', 'error');
            return;
        }
        
        if (comment.length > 1000) {
            showToast('📝 that\'s a long thought! keep it under 1000 characters', 'error');
            return;
        }
        
        const success = await saveComment({
            name: name,
            comment: comment,
            anonymous: anonymous
        });
        
        if (success) {
            e.target.reset();
            if (document.getElementById('anonymousCheck')) {
                document.getElementById('anonymousCheck').checked = true;
            }
            await displayComments();
        }
    });
});

// ===============================================================
// TOGGLE LIKE
// ===============================================================
window.toggleLike = async function(commentId, currentLikes) {
    const liked = localStorage.getItem(`liked-${commentId}`);
    let newLikes;
    
    if (liked) {
        newLikes = currentLikes - 1;
        localStorage.removeItem(`liked-${commentId}`);
        showToast('💔 un-liked');
    } else {
        newLikes = currentLikes + 1;
        localStorage.setItem(`liked-${commentId}`, 'true');
        showToast('❤️ liked!');
    }
    
    // Update UI immediately
    const likesSpan = document.getElementById(`likes-${commentId}`);
    if (likesSpan) {
        likesSpan.textContent = newLikes;
    }
    
    // Update button class
    const likeBtn = event.target;
    if (likeBtn) {
        if (liked) {
            likeBtn.classList.remove('liked');
        } else {
            likeBtn.classList.add('liked');
        }
    }
    
    // Update in SheetDB
    await updateLikes(commentId, newLikes);
};

// ===============================================================
// SHOW REPLY FORM
// ===============================================================
window.showReplyForm = function(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (form) {
        form.classList.toggle('show');
    }
};

// ===============================================================
// POST REPLY
// ===============================================================
window.postReply = async function(parentId) {
    const nameInput = document.getElementById(`reply-name-${parentId}`);
    const textInput = document.getElementById(`reply-text-${parentId}`);
    
    if (!nameInput || !textInput) return;
    
    const name = nameInput.value.trim() || 'sneaky friend';
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('🤔 write something first!');
        return;
    }
    
    if (text.length > 500) {
        showToast('📝 keep reply under 500 characters', 'error');
        return;
    }
    
    const success = await saveComment({
        name: name,
        comment: text,
        anonymous: name === 'sneaky friend',
        parent_id: parentId
    });
    
    if (success) {
        document.getElementById(`reply-form-${parentId}`).classList.remove('show');
        nameInput.value = '';
        textInput.value = '';
        await displayComments();
        showToast('✨ reply posted!');
    }
};

// ===============================================================
// UPDATE STATS
// ===============================================================
async function updateStats(totalComments) {
    const totalElement = document.getElementById('totalComments');
    const todayElement = document.getElementById('todayComments');
    const activeElement = document.getElementById('activeUsers');
    
    if (totalElement) totalElement.textContent = totalComments;
    
    if (todayElement || activeElement) {
        const comments = await getComments();
        const today = new Date().toDateString();
        const todayComments = comments.filter(c => {
            if (!c.date) return false;
            return new Date(c.date).toDateString() === today;
        }).length;
        
        if (todayElement) todayElement.textContent = todayComments;
        if (activeElement) activeElement.textContent = Math.floor(Math.random() * 10) + 4;
    }
}

// ===============================================================
// SORT COMMENTS
// ===============================================================
document.getElementById('sortComments')?.addEventListener('change', displayComments);

// ===============================================================
// INITIAL LOAD
// ===============================================================
displayComments();

// ===============================================================
// REFRESH EVERY 30 SECONDS
// ===============================================================
setInterval(displayComments, 30000);
