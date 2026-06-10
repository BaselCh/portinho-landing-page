import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------------------------
    // 0. GSAP STORY SCROLL SYSTEM (STACKING DECK + CARD ROTATION)
    // --------------------------------------------------------------------------
    const mm = gsap.matchMedia();

    mm.add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => {
        const sections = gsap.utils.toArray('.story-section');
        
        // Dynamically set z-index for correct card stacking order
        sections.forEach((section, i) => {
            section.style.zIndex = i + 1;
        });

        sections.forEach((section, i) => {
            // Pin all sections except the last one (which contains the form and footer)
            if (i < sections.length - 1) {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: '+=100%',
                    pin: true,
                    pinSpacing: false,
                    invalidateOnRefresh: true,
                });
            }

            // Rotate entering sections from bottom (i > 0)
            const inner = section.querySelector('.flow-art-container');
            if (i > 0 && inner) {
                gsap.fromTo(inner,
                    {
                        rotation: 30,
                        transformOrigin: 'left bottom',
                    },
                    {
                        rotation: 0,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top bottom', // starts when section top enters viewport bottom
                            end: 'top top',      // ends when section top reaches viewport top
                            scrub: true,
                            invalidateOnRefresh: true,
                        }
                    }
                );
            }
        });
    });


    // --------------------------------------------------------------------------
    // 1. CAROUSEL SYSTEM
    // --------------------------------------------------------------------------
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const carouselTrack = document.getElementById('carousel-track');
    
    // We have three carousel items defined in HTML
    const carouselItems = Array.from(carouselTrack.children);
    
    // Original images array matching the mockups
    const imagesData = [
        { src: 'assets/structure_left.jpg', alt: 'Piscina/Prainha do Portinho' },
        { src: 'assets/structure_center.png', alt: 'Crianças na sala de aula/ateliê' },
        { src: 'assets/structure_right.png', alt: 'Crianças brincando ao ar livre' }
    ];
    
    let currentIndex = 1; // Start with the center image active (Index 1)

    function updateCarousel() {
        const len = imagesData.length;
        
        // Calculate indices for left, center, right
        const leftIdx = (currentIndex - 1 + len) % len;
        const centerIdx = currentIndex;
        const rightIdx = (currentIndex + 1) % len;
        
        // Add a class for fade effect during transition
        carouselItems.forEach(item => {
            item.style.opacity = '0.3';
            item.style.transform = 'scale(0.9)';
        });
        
        setTimeout(() => {
            // Update image sources and alts
            carouselItems[0].querySelector('img').src = imagesData[leftIdx].src;
            carouselItems[0].querySelector('img').alt = imagesData[leftIdx].alt;
            
            carouselItems[1].querySelector('img').src = imagesData[centerIdx].src;
            carouselItems[1].querySelector('img').alt = imagesData[centerIdx].alt;
            
            carouselItems[2].querySelector('img').src = imagesData[rightIdx].src;
            carouselItems[2].querySelector('img').alt = imagesData[rightIdx].alt;
            
            // Restore visual layout scales
            carouselItems.forEach((item, index) => {
                item.style.opacity = index === 1 ? '1' : '0.5';
                item.style.transform = index === 1 ? 'scale(1)' : 'scale(0.95)';
            });
        }, 200);
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + imagesData.length) % imagesData.length;
        updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % imagesData.length;
        updateCarousel();
    });

    // Initialize carousel states
    updateCarousel();

    // --------------------------------------------------------------------------
    // 2. SCROLL REVEAL (INTERSECTION OBSERVER)
    // --------------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --------------------------------------------------------------------------
    // 3. PARALLAX SCROLL FALLBACK (FOR BROWSERS LACKING SUPPORT)
    // --------------------------------------------------------------------------
    const parallaxImg = document.getElementById('hero-parallax-img');
    const heroSection = document.getElementById('hero');

    // Check if browser supports CSS Scroll-Driven Animations
    const supportsScrollAnimations = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

    if (!supportsScrollAnimations && parallaxImg && heroSection) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroHeight = heroSection.offsetHeight;
            
            if (scrollY <= heroHeight) {
                const speed = 0.4;
                const yPos = -(scrollY * speed);
                parallaxImg.style.transform = `translateY(${yPos}px)`;
            }
        });
    }

    // --------------------------------------------------------------------------
    // 4. FORM FLOATING LABELS & VALIDATION
    // --------------------------------------------------------------------------
    const form = document.getElementById('contact-form');
    const inputs = form.querySelectorAll('input[required], select[required]');
    const fileInput = document.getElementById('documento');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Update custom file upload button display on select
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
                fileNameDisplay.style.color = 'var(--color-teal)';
                fileNameDisplay.style.fontWeight = '600';
            } else {
                fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
                fileNameDisplay.style.color = 'var(--color-gray-text)';
                fileNameDisplay.style.fontWeight = '400';
            }
        });
    }

    // Live validation feedback on blur
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('is-invalid')) {
                validateField(input);
            }
        });
    });

    function validateField(input) {
        const errorMsg = input.parentNode.querySelector('.error-msg');
        
        if (input.type === 'checkbox') {
            // Checkbox error is structural, check parent
            const checkboxError = form.querySelector('.checkbox-error');
            if (!input.checked) {
                if (checkboxError) checkboxError.style.display = 'block';
                input.classList.add('is-invalid');
                return false;
            } else {
                if (checkboxError) checkboxError.style.display = 'none';
                input.classList.remove('is-invalid');
                return true;
            }
        }

        if (!input.validity.valid) {
            input.classList.add('is-invalid');
            if (errorMsg && errorMsg.classList.contains('error-msg')) {
                errorMsg.style.display = 'block';
            }
            return false;
        } else {
            input.classList.remove('is-invalid');
            if (errorMsg && errorMsg.classList.contains('error-msg')) {
                errorMsg.style.display = 'none';
            }
            return true;
        }
    }

    // Form Submission Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isFormValid = true;
        
        inputs.forEach(input => {
            const isValid = validateField(input);
            if (!isValid) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            // Success animation or feedback
            const submitBtn = form.querySelector('.confirm-button') || form.querySelector('.submit-button');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Enviando... <span class="submit-arrow">↻</span>';
            submitBtn.style.backgroundColor = 'var(--color-teal)';
            
            setTimeout(() => {
                submitBtn.innerHTML = 'Sucesso! Obrigado. <span class="submit-arrow">✓</span>';
                submitBtn.style.backgroundColor = '#10B981';
                
                // Clear Form
                form.reset();
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
                    fileNameDisplay.style.color = 'var(--color-gray-text)';
                    fileNameDisplay.style.fontWeight = '400';
                }
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = 'var(--color-blue)';
                    
                    // Reset field floating state
                    inputs.forEach(input => {
                        input.classList.remove('is-invalid');
                    });
                }, 3000);
            }, 1500);
        } else {
            // Shake the first invalid field
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

});
