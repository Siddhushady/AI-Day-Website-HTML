// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Loading animation
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.visibility = 'hidden';
        }, 500);
    }, 3000);

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Slideshow for contribution section
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    
    function changeSlide() {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Initial slide
    slides[0].classList.add('active');
    
    // Change slide every 5 seconds
    setInterval(changeSlide, 5000);

    // Project cards hover effect with smooth expansion
    const projectCards = document.querySelectorAll('.project-card');
    const projectsGrid = document.getElementById('projects-grid');
    const overlay = document.getElementById('overlay');
    
    projectCards.forEach(card => {
        // Mouse enter event
        card.addEventListener('mouseenter', () => {
            // Add active class to the card
            card.classList.add('active');
            // Add class to the grid to blur other cards
            projectsGrid.classList.add('has-active-card');
        });
        
        // Mouse leave event
        card.addEventListener('mouseleave', () => {
            // Remove active class from the card
            card.classList.remove('active');
            // Remove class from the grid
            projectsGrid.classList.remove('has-active-card');
        });
        
        // Click event
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url && url !== '#') {
                window.open(url, '_blank');
            }
        });
    });

    // Add scroll reveal animation
    const revealElements = document.querySelectorAll('.section-content');
    
    function checkReveal() {
        const triggerBottom = window.innerHeight * 0.8;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Set initial styles for reveal animation
    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Check on load and scroll
    window.addEventListener('load', checkReveal);
    window.addEventListener('scroll', checkReveal);

    // Create floating particles animation
    const particlesContainer = document.querySelector('.floating-particles');
    
    if (particlesContainer) {
        for (let i = 0; i < 50; i++) {
            createParticle(particlesContainer);
        }
    }
    
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random styles
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = Math.random() > 0.5 ? 
            'var(--accent-color)' : 'var(--accent-color-2)';
        particle.style.borderRadius = '50%';
        particle.style.opacity = Math.random() * 0.5;
        particle.style.boxShadow = '0 0 10px rgba(110, 66, 245, 0.5)';
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Animation
        particle.style.animation = `float ${Math.random() * 15 + 10}s linear infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        
        // Add to container
        container.appendChild(particle);
    }
    
    // Add float animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0) translateX(0);
            }
            25% {
                transform: translateY(-20px) translateX(10px);
            }
            50% {
                transform: translateY(-40px) translateX(0);
            }
            75% {
                transform: translateY(-20px) translateX(-10px);
            }
            100% {
                transform: translateY(0) translateX(0);
            }
        }
        
        .particle {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // Fluid animation for hero section
    const canvas = document.getElementById('fluidCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Fluid simulation parameters
    const particleCount = 100;
    const particles = [];
    const colorStops = [
        { color: '#6e42f5', pos: 0 },
        { color: '#8a56ff', pos: 0.3 },
        { color: '#42a5f5', pos: 0.6 },
        { color: '#6e42f5', pos: 1 }
    ];
    
    // Create fluid particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 100 + 50,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            opacity: Math.random() * 0.2 + 0.1
        });
    }
    
    // Animation loop
    function animate() {
        // Clear canvas with slight fade effect
        ctx.fillStyle = 'rgba(5, 5, 16, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off edges
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Create gradient
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            for (const stop of colorStops) {
                gradient.addColorStop(stop.pos, stop.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0'));
            }
            
            // Draw fluid blob
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        // Blend particles
        ctx.globalCompositeOperation = 'screen';
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
});