 // Global variables
let ebooks = [];
let currentBooks = [];
let selectedBook = null;
let downloadStats = {
    totalDownloads: 0,
    downloadsToday: 0,
    lastDownloadDate: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadEbookData();
    loadDownloadStats();
    renderBooks();
    loadUserPreferences();
});

// Load ebook data from JSON script tag
function loadEbookData() {
    const ebookDataScript = document.getElementById('ebookData');
    const data = JSON.parse(ebookDataScript.textContent);
    ebooks = data.books;
    currentBooks = [...ebooks];
    
    // Update hero book count
    document.getElementById('heroBookCount').textContent = ebooks.length;
}

// Load download statistics from localStorage
function loadDownloadStats() {
    const saved = localStorage.getItem('downloadStats');
    if (saved) {
        downloadStats = JSON.parse(saved);
    }
}

// Render books grid
function renderBooks() {
    const booksGrid = document.getElementById('booksGrid');
    
    if (currentBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-books">
                <i class="fas fa-search"></i>
                <h3>No books found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    booksGrid.innerHTML = currentBooks.map(book => {
        const discountPercent = Math.round(((parseInt(book.originalPrice.replace('₹', '')) - parseInt(book.discountPrice.replace('₹', ''))) / parseInt(book.originalPrice.replace('₹', ''))) * 100);
        
        return `
            <div class="book-card fade-in" onclick="openBookDetailModal(${book.id})">
                <div class="book-image">
                    ${book.thumbnail}
                </div>
                <div class="book-content">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="book-subject">${capitalizeFirst(book.subject)}</p>
                    <p class="book-description">${book.description}</p>
                    
                    <div class="book-rating">
                        <div class="stars">${generateStars(book.rating)}</div>
                        <span class="rating-text">${book.rating}</span>
                        <span class="reviews-count">(${book.reviews.toLocaleString()} reviews)</span>
                    </div>
                    
                    <div class="book-price-section">
                        <span class="current-price">${book.discountPrice}</span>
                        <span class="original-price">${book.originalPrice}</span>
                        <span class="discount">${discountPercent}% OFF</span>
                    </div>
                    
                    <div class="book-stats">
                        <div class="book-stat">
                            <i class="fas fa-file-alt"></i>
                            <span>${book.pages} pages</span>
                        </div>
                        <div class="book-stat">
                            <i class="fas fa-download"></i>
                            <span>${book.downloadCount.toLocaleString()}</span>
                        </div>
                        <div class="book-stat">
                            <i class="fas fa-eye"></i>
                            <span>${book.previewPages} preview</span>
                        </div>
                    </div>
                    
                    <div class="book-actions">
                        <button class="unlock-btn" onclick="event.stopPropagation(); openUnlockModal(${book.id})">
                            <i class="fas fa-unlock"></i>
                            Unlock eBook
                        </button>
                        <button class="view-details-btn" onclick="event.stopPropagation(); openBookDetailModal(${book.id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '⭐';
    }
    
    if (hasHalfStar) {
        starsHTML += '⭐';
    }
    
    return starsHTML;
}

// Open book detail modal
function openBookDetailModal(bookId) {
    selectedBook = ebooks.find(book => book.id === bookId);
    if (!selectedBook) return;
    
    // Populate modal with book details
    document.getElementById('detailBookThumbnail').textContent = selectedBook.thumbnail;
    document.getElementById('detailBookTitle').textContent = selectedBook.title;
    document.getElementById('detailBookAuthor').textContent = selectedBook.author;
    document.getElementById('detailStars').innerHTML = generateStars(selectedBook.rating);
    document.getElementById('detailRating').textContent = selectedBook.rating;
    document.getElementById('detailReviews').textContent = selectedBook.reviews.toLocaleString();
    
    // Price information
    document.getElementById('detailCurrentPrice').textContent = selectedBook.discountPrice;
    document.getElementById('detailOriginalPrice').textContent = selectedBook.originalPrice;
    const discountPercent = Math.round(((parseInt(selectedBook.originalPrice.replace('₹', '')) - parseInt(selectedBook.discountPrice.replace('₹', ''))) / parseInt(selectedBook.originalPrice.replace('₹', ''))) * 100);
    document.getElementById('detailDiscount').textContent = `${discountPercent}% OFF`;
    
    // Book stats
    document.getElementById('detailPages').textContent = selectedBook.pages.toLocaleString();
    document.getElementById('detailLanguage').textContent = selectedBook.language;
    document.getElementById('detailDownloads').textContent = selectedBook.downloadCount.toLocaleString();
    document.getElementById('detailYear').textContent = selectedBook.publishYear;
    document.getElementById('detailPreviewPages').textContent = selectedBook.previewPages;
    
    // Features
    const featuresHTML = selectedBook.features.map(feature => `<li>${feature}</li>`).join('');
    document.getElementById('detailFeatures').innerHTML = featuresHTML;
    
    // Full description
    document.getElementById('detailFullDescription').textContent = selectedBook.fullDescription;
    
    // Details tab information
    document.getElementById('detailPublisher').textContent = selectedBook.publisher;
    document.getElementById('detailISBN').textContent = selectedBook.isbn;
    document.getElementById('detailChapters').textContent = selectedBook.chapters;
    document.getElementById('detailLastUpdated').textContent = new Date(selectedBook.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Badges
    document.getElementById('detailDifficulty').textContent = selectedBook.difficulty;
    
    // Generate table of contents
    generateTableOfContents(selectedBook.chapters);
    
    // Show modal
    document.getElementById('bookDetailModal').style.display = 'block';
    
    // Reset to first tab
    showTab('details');
}

// Generate table of contents
function generateTableOfContents(chapterCount) {
    const tableOfContents = document.getElementById('tableOfContents');
    let contentsHTML = '';
    
    for (let i = 1; i <= chapterCount; i++) {
        const chapterTitle = getChapterTitle(i, selectedBook.subject);
        const startPage = Math.floor((i - 1) * (selectedBook.pages / chapterCount)) + 1;
        const endPage = Math.floor(i * (selectedBook.pages / chapterCount));
        
        contentsHTML += `
            <div class="chapter-item">
                <span class="chapter-number">Ch ${i}</span>
                <span class="chapter-title">${chapterTitle}</span>
                <span class="chapter-pages">pp. ${startPage}-${endPage}</span>
            </div>
        `;
    }
    
    tableOfContents.innerHTML = contentsHTML;
}

// Get chapter title based on subject
function getChapterTitle(chapterNum, subject) {
    const chapterTitles = {
        mathematics: [
            'Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices',
            'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives',
            'Integrals', 'Applications of Integrals', 'Differential Equations',
            'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming',
            'Probability', 'Statistics', 'Complex Numbers', 'Sequences and Series',
            'Limits', 'Mathematical Reasoning'
        ],
        physics: [
            'Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity',
            'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction',
            'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics',
            'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics',
            'Communication Systems', 'Mechanical Properties', 'Thermal Properties',
            'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves', 'Work Energy Power'
        ],
        chemistry: [
            'Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics',
            'Surface Chemistry', 'General Principles of Metallurgy', 'p-Block Elements',
            'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes',
            'Alcohols Phenols Ethers', 'Aldehydes Ketones', 'Carboxylic Acids',
            'Amines', 'Biomolecules', 'Polymers'
        ],
        biology: [
            'Reproduction in Organisms', 'Sexual Reproduction in Plants', 'Human Reproduction',
            'Reproductive Health', 'Principles of Inheritance', 'Molecular Basis of Inheritance',
            'Evolution', 'Human Health and Disease', 'Microbes in Human Welfare',
            'Biotechnology Principles', 'Biotechnology Applications', 'Organisms and Populations',
            'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues',
            'Breathing and Exchange of Gases', 'Body Fluids and Circulation',
            'Excretory Products', 'Locomotion and Movement', 'Neural Control'
        ],
        computer: [
            'Programming Fundamentals', 'Data Types and Variables', 'Control Structures',
            'Functions and Modules', 'Data Structures', 'File Handling',
            'Object Oriented Programming', 'Database Concepts', 'SQL Queries',
            'Web Development Basics', 'Algorithms', 'Sorting and Searching',
            'Computer Networks', 'Internet Technologies'
        ],
        english: [
            'Reading Comprehension', 'Grammar and Usage', 'Vocabulary Building',
            'Essay Writing', 'Letter Writing', 'Poetry Analysis',
            'Prose Analysis', 'Drama and Theatre', 'Creative Writing',
            'Communication Skills', 'Public Speaking', 'Literary Devices'
        ]
    };
    
    const titles = chapterTitles[subject] || ['Chapter ' + chapterNum];
    return titles[chapterNum - 1] || 'Chapter ' + chapterNum;
}

// Close book detail modal
function closeBookDetailModal() {
    document.getElementById('bookDetailModal').style.display = 'none';
}

// Open unlock modal from detail view
function openUnlockModalFromDetail() {
    closeBookDetailModal();
    openUnlockModal(selectedBook.id);
}

// Show tab content
function showTab(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab pane
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to selected tab button
    event.target.classList.add('active');
}

// Preview book function
function previewBook() {
    showNotification(`📖 Preview of "${selectedBook.title}" - First ${selectedBook.previewPages} pages available for viewing.`);
    
    // In a real application, this would open a PDF viewer with limited pages
    // For demo purposes, we'll show a notification
    setTimeout(() => {
        if (selectedBook.downloadLink) {
            window.open(selectedBook.downloadLink, '_blank');
        }
    }, 1000);
}

// Search books
function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        currentBooks = [...ebooks];
    } else {
        currentBooks = ebooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.subject.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderBooks();
}

// Filter books by subject
function filterBooks(subject) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (subject === 'all') {
        currentBooks = [...ebooks];
    } else {
        currentBooks = ebooks.filter(book => book.subject === subject);
    }
    
    renderBooks();
}

// Sort books
function sortBooks() {
    const sortBy = document.getElementById('sortSelect').value;
    
    switch (sortBy) {
        case 'title':
            currentBooks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'rating':
            currentBooks.sort((a, b) => b.rating - a.rating);
            break;
        case 'price':
            currentBooks.sort((a, b) => {
                const priceA = parseInt(a.discountPrice.replace('₹', ''));
                const priceB = parseInt(b.discountPrice.replace('₹', ''));
                return priceA - priceB;
            });
            break;
        case 'downloads':
            currentBooks.sort((a, b) => b.downloadCount - a.downloadCount);
            break;
        case 'newest':
            currentBooks.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
            break;
        default:
            break;
    }
    
    renderBooks();
}

// Open unlock modal
function openUnlockModal(bookId) {
    selectedBook = ebooks.find(book => book.id === bookId);
    if (!selectedBook) return;
    
    // Populate modal with book info
    document.getElementById('modalBookTitle').textContent = selectedBook.title;
    document.getElementById('modalBookAuthor').textContent = `by ${selectedBook.author}`;
    document.getElementById('modalBookSubject').textContent = capitalizeFirst(selectedBook.subject);
    document.getElementById('modalBookThumbnail').textContent = selectedBook.thumbnail;
    
    // Clear previous input and error
    document.getElementById('passwordInput').value = '';
    hideError();
    
    // Show modal
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('passwordInput').focus();
}

// Check password
function checkPassword() {
    const enteredPassword = document.getElementById('passwordInput').value;
    
    if (!enteredPassword) {
        showError('Please enter a password');
        return;
    }
    
    // Show loading
    showLoading();
    
    // Simulate API call delay
    setTimeout(() => {
        hideLoading();
        
        if (enteredPassword === selectedBook.password) {
            // Password correct
            closeModal();
            showSuccessModal();
            updateDownloadStats();
        } else {
            // Password incorrect
            showError('Incorrect password. Please try again.');
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }
    }, 1000);
}

// Handle password input key press
function handlePasswordKeyPress(event) {
    if (event.key === 'Enter') {
        checkPassword();
    }
}

// Show success modal
function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
    
    // Set up view PDF button
    const viewPdfBtn = document.getElementById('viewPdfBtn');
    viewPdfBtn.onclick = function() {
        viewPdf();
    };
}

// Convert Google Drive link to embeddable format
function convertGoogleDriveLink(originalLink) {
    // Extract file ID from Google Drive link
    const fileIdMatch = originalLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Return embeddable Google Drive link
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return originalLink; // Return original if not a Google Drive link
}

// View PDF function (replaces download)
function viewPdf() {
    // Show loading
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Convert Google Drive link to embeddable format if needed
        let pdfLink = selectedBook.downloadLink;
        if (pdfLink.includes('drive.google.com')) {
            pdfLink = convertGoogleDriveLink(pdfLink);
        }
        
        // Open the PDF link in a new tab for viewing
        if (pdfLink) {
            window.open(pdfLink, '_blank');
        }
        
        // Show success message
        showNotification(`📚 "${selectedBook.title}" is now open for viewing!`);
        
        // Close modal
        closeSuccessModal();
        
        // Update stats
        updateDownloadStats();
    }, 1500);
}

// Update download statistics
function updateDownloadStats() {
    const today = new Date().toDateString();
    
    if (downloadStats.lastDownloadDate !== today) {
        downloadStats.downloadsToday = 0;
        downloadStats.lastDownloadDate = today;
    }
    
    downloadStats.totalDownloads++;
    downloadStats.downloadsToday++;
    
    localStorage.setItem('downloadStats', JSON.stringify(downloadStats));
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Show loading
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// Hide loading
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Close modal
function closeModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    selectedBook = null;
}

// Navigation functions
function showHome() {
    // Hide all sections
    document.getElementById('aboutSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'none';
    
    // Show home sections
    document.querySelector('.books-section').style.display = 'block';
    document.querySelector('.search-section').style.display = 'block';
    document.querySelector('.hero').style.display = 'block';
    
    // Update active nav link
    updateActiveNavLink('[onclick="showHome()"]');
}

function showAbout() {
    // Hide all sections
    document.getElementById('contactSection').style.display = 'none';
    document.querySelector('.books-section').style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    
    // Show about section
    document.getElementById('aboutSection').style.display = 'block';
    
    // Update active nav link
    updateActiveNavLink('[onclick="showAbout()"]');
}

function showContact() {
    // Hide all sections
    document.getElementById('aboutSection').style.display = 'none';
    document.querySelector('.books-section').style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    
    // Show contact section
    document.getElementById('contactSection').style.display = 'block';
    
    // Update active nav link
    updateActiveNavLink('[onclick="showContact()"]');
}

function updateActiveNavLink(selector) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(selector);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Scroll to books section
function scrollToBooks() {
    showHome();
    setTimeout(() => {
        document.getElementById('booksSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

// Contact form submission
function submitContactForm(event) {
    event.preventDefault();
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showNotification('✅ Thank you for your message! We\'ll get back to you soon.');
        event.target.reset();
    }, 2000);
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #000000;
        color: #ffffff;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 500;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadUserPreferences() {
    const preferences = localStorage.getItem('userPreferences');
    if (preferences) {
        const prefs = JSON.parse(preferences);
        // Load any saved preferences
    }
}

function saveUserPreferences() {
    const preferences = {
        lastVisit: new Date().toISOString()
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

// Close modals when clicking outside
window.onclick = function(event) {
    const passwordModal = document.getElementById('passwordModal');
    const successModal = document.getElementById('successModal');
    const bookDetailModal = document.getElementById('bookDetailModal');
    
    if (event.target === passwordModal) {
        closeModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
    if (event.target === bookDetailModal) {
        closeBookDetailModal();
    }
}

// Handle escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeSuccessModal();
        closeBookDetailModal();
    }
});

// Save preferences before page unload
window.addEventListener('beforeunload', function() {
    saveUserPreferences();
});

// Welcome message
setTimeout(() => {
    if (!localStorage.getItem('welcomeShown')) {
        showNotification('🎉 Welcome to CS Store! Your premium destination for Class 12 eBooks.');
        localStorage.setItem('welcomeShown', 'true');
    }
}, 2000);