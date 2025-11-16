// Enhanced UI animations for DevDate using Lenis.js and Anime.js

// Initialize Lenis smooth scroll
let lenis;

function initSmoothScroll() {
    // Check if Lenis is loaded
    if (typeof Lenis === 'undefined') {
        console.warn('Lenis library not loaded, skipping smooth scroll');
        return;
    }
    
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
}

// Animate page transitions
function animatePageTransition(pageName) {
    const page = document.getElementById(`${pageName}-page`);
    
    if (!page) return;

    // Fade in animation
    anime({
        targets: page,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        easing: 'easeOutCubic'
    });
}

// Animate profile cards appearing
function animateProfileCard(cardElement) {
    anime({
        targets: cardElement,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutElastic(1, .8)',
        complete: function() {
            // Add floating animation
            anime({
                targets: cardElement,
                translateY: [-5, 5],
                duration: 3000,
                direction: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });
        }
    });
}

// Animate swipe action
function animateSwipeAction(direction) {
    const icon = direction === 'right' ? '❤️' : '✖️';
    const color = direction === 'right' ? '#ff6b6b' : '#4a4a4a';
    
    const indicator = document.createElement('div');
    indicator.innerHTML = icon;
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        ${direction === 'right' ? 'right: 50px' : 'left: 50px'};
        font-size: 4rem;
        z-index: 1000;
        pointer-events: none;
    `;
    document.body.appendChild(indicator);

    anime({
        targets: indicator,
        scale: [0, 1.5, 1],
        opacity: [0, 1, 0],
        duration: 800,
        easing: 'easeOutElastic(1, .6)',
        complete: () => indicator.remove()
    });
}

// Animate match modal
function animateMatchModal() {
    const modal = document.getElementById('match-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    anime({
        targets: modalContent,
        scale: [0.5, 1.05, 1],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutElastic(1, .8)'
    });

    // Animate match icon
    const icon = document.getElementById('match-icon');
    anime({
        targets: icon,
        scale: [0, 1.3, 1],
        rotate: [0, 360],
        duration: 1000,
        easing: 'easeOutElastic(1, .6)'
    });

    // Confetti effect
    createConfetti();
}

// Create confetti effect
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: 50%;
            left: 50%;
            z-index: 9999;
            border-radius: 50%;
            pointer-events: none;
        `;
        document.body.appendChild(confetti);

        anime({
            targets: confetti,
            translateX: anime.random(-300, 300),
            translateY: anime.random(-300, 300),
            rotate: anime.random(0, 360),
            scale: [1, 0],
            opacity: [1, 0],
            duration: anime.random(1000, 2000),
            easing: 'easeOutCubic',
            complete: () => confetti.remove()
        });
    }
}

// Animate message bubbles
function animateMessageBubble(bubbleElement) {
    anime({
        targets: bubbleElement,
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 400,
        easing: 'easeOutCubic'
    });
}

// Animate navigation
function animateNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    anime({
        targets: navItems,
        translateY: [-20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutCubic'
    });
}

// Animate skill tags
function animateSkillTags(container) {
    const tags = container.querySelectorAll('.tag');
    
    anime({
        targets: tags,
        scale: [0, 1],
        opacity: [0, 1],
        delay: anime.stagger(50),
        duration: 500,
        easing: 'easeOutElastic(1, .8)'
    });
}

// Pulse animation for like/pass buttons
function pulseButton(button) {
    anime({
        targets: button,
        scale: [1, 1.2, 1],
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

// Animate matches grid
function animateMatchesGrid() {
    const matchCards = document.querySelectorAll('.match-card');
    
    anime({
        targets: matchCards,
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(100, {start: 200}),
        duration: 600,
        easing: 'easeOutElastic(1, .8)'
    });
}

// Typing indicator animation
function animateTypingIndicator(element) {
    const dots = element.querySelectorAll('.dot');
    
    anime({
        targets: dots,
        translateY: [-5, 0],
        delay: anime.stagger(150),
        direction: 'alternate',
        loop: true,
        duration: 400,
        easing: 'easeInOutSine'
    });
}

// Loading spinner animation
function animateLoadingSpinner() {
    const spinner = document.querySelector('.spinner');
    
    if (spinner) {
        anime({
            targets: spinner,
            rotate: 360,
            duration: 1000,
            loop: true,
            easing: 'linear'
        });
    }
}

// Button click ripple effect
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    anime({
        targets: ripple,
        scale: [0, 2],
        opacity: [1, 0],
        duration: 600,
        easing: 'easeOutCubic',
        complete: () => ripple.remove()
    });
}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scroll
    initSmoothScroll();
    
    // Animate navigation
    setTimeout(() => animateNavigation(), 100);
    
    // Add ripple effect to all buttons
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Animate loading spinner
    animateLoadingSpinner();
});

// Export functions for use in other files
window.DevDateAnimations = {
    animatePageTransition,
    animateProfileCard,
    animateSwipeAction,
    animateMatchModal,
    animateMessageBubble,
    animateSkillTags,
    pulseButton,
    animateMatchesGrid,
    createConfetti
};
