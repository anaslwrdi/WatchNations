// WatchNations - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌍 WatchNations loaded successfully!');
    
    // Add animation on scroll
    const cards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Future features placeholder
const WatchNations = {
    version: '1.0.0',
    init: function() {
        console.log('WatchNations initialized');
    },
    // TODO: Add live match fetching
    // TODO: Add user authentication
    // TODO: Add notifications system
};
