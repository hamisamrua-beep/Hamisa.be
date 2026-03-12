// ===============================================================
// LANDING PAGE - Animations & Dynamic Stats
// ===============================================================

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
    loadLandingStats();
    setupFloatingAnimations();
    setupSmoothScroll();
});

// ===============================================================
// LOAD STATS FROM SHEETDB
// ===============================================================
async function loadLandingStats() {
    try {
        // Get total films from localStorage or default
        const films = JSON.parse(localStorage.getItem('hamisa_shows')) || [
            { title: "Sore" }, { title: "Sanctuary" }, { title: "Drive My Car" }
        ];
        
        // Get total thoughts from SheetDB
        let thoughtsCount = 0;
        if (CONFIG && CONFIG.SHEETDB_URL) {
            try {
                const response = await fetch(CONFIG.SHEETDB_URL);
                if (response.ok) {
                    const data = await response.json();
                    thoughtsCount = data.length;
                }
            } catch (error) {
                console.log('SheetDB not connected yet');
                thoughtsCount = 12; // Fallback
            }
        } else {
            thoughtsCount = 12; // Fallback
        }
        
        // Animate stats counting up
        animateNumber('totalFilmsStat', films.length, 1500);
        animateNumber('totalThoughtsStat', thoughtsCount, 2000);
        
        // Random "active now" number
        const activeNow = Math.floor(Math.random() * 24) + 7;
        document.getElementById('activeNowStat').textContent = activeNow;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===============================================================
// ANIMATE NUMBERS COUNTING UP
// ===============================================================
function animateNumber(elementId, finalNumber, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startNumber = 0;
    const increment = finalNumber > 100 ? Math.ceil(finalNumber / 60) : 1;
    let currentNumber = startNumber;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= finalNumber) {
            element.textContent = finalNumber;
            clearInterval(timer);
        } else {
            element.textContent = currentNumber;
        }
    }, duration / (finalNumber / increment));
}

// ===============================================================
// FLOATING ANIMATIONS
// ===============================================================
function setupFloatingAnimations() {
    // Add random delays to floating elements
    document.querySelectorAll('.float-star, .float-circle, .float-circle-small').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Parallax effect on mouse move
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const floatCircles = document.querySelectorAll('.float-circle, .float-circle-small');
        floatCircles.forEach((circle, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            circle.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

// ===============================================================
// SMOOTH SCROLL FOR BUTTONS
// ===============================================================
function setupSmoothScroll() {
    document.querySelectorAll('.landing-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // If it's a hash link, smooth scroll
            if (btn.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(btn.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// ===============================================================
// RANDOM QUOTE ROTATION (Optional)
// ===============================================================
const quotes = [
    { text: "sometimes you just gotta say what you're thinking — even if it's silly", author: "a very wise potato" },
    { text: "every thought is like a little hug for the internet", author: "cozy cloud" },
    { text: "movies are just dreams we all agree to have together", author: "sleepy film nerd" },
    { text: "the best conversations happen after the credits roll", author: "reel talker" }
];

function rotateQuote() {
    const quoteEl = document.querySelector('.landing-quote');
    if (!quoteEl) return;
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    quoteEl.innerHTML = `"${quote.text}" <span class="quote-author">— ${quote.author}</span>`;
}

// Change quote every 30 seconds
setInterval(rotateQuote, 30000);
