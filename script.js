document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration & Setup ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // --- GSAP & ScrollTrigger Initialization Check ---
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error('GSAP or ScrollTrigger not loaded!');
        showContentFallback();
        return;
    }

    // --- Apply Global GSAP/ScrollTrigger Settings ---
    gsap.config({ nullTargetWarn: false });
    ScrollTrigger.config({});
    // ScrollTrigger.normalizeScroll(isTouchDevice); // Keep commented unless specific touch issues arise

    // --- Fallback for Reduced Motion or Errors ---
    function showContentFallback() {
        console.warn('Reduced motion enabled or critical error. Showing static content.');
        const mainContent = document.getElementById('main-content');
        const passwordGate = document.getElementById('scene-0');
        if (passwordGate) passwordGate.style.display = 'none';
        if (mainContent) {
            mainContent.style.visibility = 'visible';
            mainContent.style.opacity = '1';
            document.querySelectorAll('.scene:not(#scene-0)').forEach(scene => {
                scene.style.opacity = '1';
                scene.style.transform = 'none';
            });
             // Ensure split text is visible if fallback occurs after splitting
            const splitElements = document.querySelectorAll('.word, .char');
            if (splitElements.length > 0) {
                gsap.set(splitElements, { clearProps: "all" });
            }
        }
        document.body.style.overflowY = 'auto'; // Ensure scrolling is enabled
    }


    if (prefersReducedMotion) {
        showContentFallback();
        return;
    }

    // --- Proceed with Animations ---
    gsap.registerPlugin(ScrollTrigger);

    // --- Selectors (Cached) ---
    const body = document.body;
    const passwordGate = document.getElementById('scene-0');
    const mainContent = document.getElementById('main-content');
    const dropZone = document.getElementById('drop-zone');
    const dropZonePlaceholder = document.querySelector('.drop-zone-placeholder');
    const draggableWords = document.querySelectorAll('.draggable-word');
    const passwordFeedback = document.getElementById('password-feedback');
    const openingTransition = document.getElementById('opening-transition');
    const streetlight = document.getElementById('streetlight');
    const streetlightBulb = document.querySelector('.streetlight-lightbulb');
    const lightBeam = document.getElementById('light-beam');
    const lightBeamDust = document.querySelector('#light-beam .dust-motes');
    const scene2Wrapper = document.querySelector('.scene2-wrapper');
    const galleryTrack = document.getElementById('gallery-track');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryImages = document.querySelectorAll('.gallery-image');
    const scene3 = document.getElementById('scene-3');
    const scene4 = document.getElementById('scene-4');
    const transitionEffect = document.querySelector('#scene-3 .transition-effect');
    const projectCards = document.querySelectorAll('.project-card'); // General selector for hover
    const disabilitasCard = document.getElementById('proyek-disabilitas-card');
    const finalScrollMessage = document.querySelector('.final-scroll-message');
    const pageFadeOut = document.querySelector('.page-fade-out');


    // --- State & Config ---
    const CORRECT_PASSWORD = "LIOHEBAT";
    const PARTICLE_COUNT = 40;
    const SCRUB_SMOOTHING = 1.6; // Default scrub for vertical sections
    // Adjusted horizontal scrub for better responsiveness in Scene 2
    const HORIZONTAL_SCRUB_SMOOTHING = 1.0; // Reduced significantly from 2.2

    let currentPassword = "";
    let isPasswordCorrect = false;
    let scrollTriggers = [];

    // --- Text Splitting Utilities (Run Once) ---
    function splitText() {
        const splitTargets = document.querySelectorAll('.split-words, .split-lines, .split-chars');
        splitTargets.forEach(el => {
            if (el.dataset.split) return; // Avoid re-splitting
            const text = el.innerHTML;
            el.innerHTML = ''; // Clear existing content
            if (el.classList.contains('split-chars')) {
                [...text].forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.innerHTML = char === ' ' ? ' ' : char; // Use non-breaking space
                    el.appendChild(span);
                });
            } else { // split-words or split-lines
                // Improved splitting to handle nested tags like <span class="emphasis"><em>word</em></span>
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text; // Use innerHTML parsing

                function processNode(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const words = node.textContent.split(/(\s+)/); // Split by whitespace, keeping spaces
                        words.forEach(part => {
                            if (part.trim().length > 0) {
                                appendWord(fragment, part);
                            } else if (part.length > 0) { // Append whitespace nodes directly
                                fragment.appendChild(document.createTextNode(part));
                            }
                        });
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Clone the element, process its children recursively, then append
                        const clonedNode = node.cloneNode(false); // Shallow clone
                        Array.from(node.childNodes).forEach(child => processNode(child)); // Process children into fragment first
                        // Now append the processed children from fragment to the cloned node
                        // This part is tricky with fragment re-use. Let's adjust:
                         const container = document.createElement(node.tagName);
                         for (let attr of node.attributes) {
                             container.setAttribute(attr.name, attr.value);
                         }
                         processChildrenInto(node, container); // Recursively process children into the new container
                         fragment.appendChild(container);

                    }
                }
                 function processChildrenInto(originalNode, targetContainer) {
                     Array.from(originalNode.childNodes).forEach(child => {
                         if (child.nodeType === Node.TEXT_NODE) {
                             const words = child.textContent.split(/(\s+)/);
                             words.forEach(part => {
                                 if (part.trim().length > 0) {
                                     appendWord(targetContainer, part); // Append word to the target
                                 } else if (part.length > 0) {
                                     targetContainer.appendChild(document.createTextNode(part));
                                 }
                             });
                         } else if (child.nodeType === Node.ELEMENT_NODE) {
                             const clonedChild = child.cloneNode(false);
                             processChildrenInto(child, clonedChild); // Recurse
                             targetContainer.appendChild(clonedChild); // Append processed child
                         } else {
                             targetContainer.appendChild(child.cloneNode(true)); // Append comments, etc.
                         }
                     });
                 }

                processChildrenInto(tempDiv, fragment); // Start processing
                el.appendChild(fragment); // Append the fully processed content
            }
            el.dataset.split = 'true';
        });
    }
    function appendWord(parent, wordHTML) {
        const wordWrap = document.createElement('span');
        wordWrap.className = 'word-wrap';
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        // Use innerHTML carefully ONLY for the word itself
        wordSpan.innerHTML = wordHTML;
        wordWrap.appendChild(wordSpan);
        parent.appendChild(wordWrap);
    }


    // --- Password Gate Logic ---
    function setupPasswordGate() {
        if (!passwordGate || !dropZone || !draggableWords.length) {
            console.warn("Password gate elements missing, attempting fallback.");
            revealMainContentAndSetupAnimations();
            return;
        }

        gsap.set(draggableWords, { opacity: 1, scale: 1, y: 0 });

        let dragSourceElement = null; // Keep track of the source

        draggableWords.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                // Use try-catch for dataTransfer safety
                try {
                    if (e.dataTransfer) {
                        e.dataTransfer.setData('text/plain', e.target.dataset.word);
                        e.dataTransfer.effectAllowed = 'move';
                        gsap.to(e.target, { scale: 1.1, filter: 'brightness(1.2)', duration: 0.2 });
                        e.target.classList.add('dragging');
                        dragSourceElement = e.target; // Store reference
                        dropZone.classList.add('drag-active');
                    } else {
                        console.error("DataTransfer object not available.");
                        e.preventDefault(); // Prevent drag if setup fails
                    }
                } catch (error) {
                     console.error("Error setting dataTransfer data:", error);
                     e.preventDefault();
                }
            });
            word.addEventListener('dragend', (e) => {
                gsap.to(e.target, { scale: 1, filter: 'brightness(1)', duration: 0.2 });
                e.target.classList.remove('dragging');
                dragSourceElement = null; // Clear reference
                // Robustly remove classes
                dropZone.classList.remove('drag-active', 'drag-over');
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow drop
            // Check if effectAllowed is set (implies valid drag start)
            if (e.dataTransfer && e.dataTransfer.effectAllowed === 'move') {
                 e.dataTransfer.dropEffect = 'move';
                 dropZone.classList.add('drag-over');
            }
        });

        dropZone.addEventListener('dragleave', (e) => {
            // Only remove if not dragging over a child or leaving window quickly
             if (e.relatedTarget === null || !dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
             }
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over', 'drag-active');

            let droppedWord = null;
             // Use try-catch for dataTransfer safety
             try {
                if (e.dataTransfer) {
                    droppedWord = e.dataTransfer.getData('text/plain');
                }
            } catch (error) {
                 console.error("Error getting dataTransfer data:", error);
            }

            if (!droppedWord) { console.error("Failed to get dropped data."); return; }

            // Find the original element *robustly* (even if detached briefly during drag)
             const originalElement = dragSourceElement && dragSourceElement.dataset.word === droppedWord
                ? dragSourceElement
                : document.querySelector(`.draggable-word[data-word="${droppedWord}"]:not([style*="visibility: hidden"])`);

            if (isPasswordCorrect || !originalElement || originalElement.style.visibility === 'hidden') {
                console.log("Drop ignored:", { isPasswordCorrect, originalElementExists: !!originalElement, isVisible: originalElement ? originalElement.style.visibility !== 'hidden' : 'N/A' });
                return; // Ignore drop if password correct, element missing, or already used
            }

            // --- Process drop ---
            dropZone.classList.add('has-content');
            if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'none';
            // Animate out the original draggable element
            gsap.to(originalElement, {
                opacity: 0,
                scale: 0.5,
                duration: 0.3,
                visibility: 'hidden', // Use visibility to prevent re-dragging
                onComplete: () => {
                    originalElement.setAttribute('draggable', 'false'); // Disable dragging logically
                }
            });
            currentPassword += droppedWord;
            dropZone.textContent = currentPassword; // Update displayed password

            // --- Check Password Logic ---
            if (currentPassword === CORRECT_PASSWORD) {
                passwordFeedback.textContent = "Benar! Membuka lintasan...";
                passwordFeedback.className = 'success';
                isPasswordCorrect = true;
                // Disable further drops (no need to remove listeners, just check isPasswordCorrect)
                gsap.timeline() // Feedback animation
                    .to(dropZone, { backgroundColor: "rgba(144, 238, 144, 0.2)", borderColor: "rgba(144, 238, 144, 0.6)", duration: 0.2 })
                    .to(dropZone, { scale: 1.05, duration: 0.1 })
                    .to(dropZone, { scale: 1, duration: 0.3, ease: "back.out(1.4)" })
                    .to(dropZone, { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "rgba(255, 255, 255, 0.3)", duration: 0.3 }, "-=0.1");
                triggerOpeningTransition();

            } else if (CORRECT_PASSWORD.startsWith(currentPassword)) {
                // Correct sequence so far
                passwordFeedback.textContent = "Lanjutkan..."; passwordFeedback.className = '';
                gsap.fromTo(dropZone, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
            } else {
                // Incorrect sequence
                passwordFeedback.textContent = "Urutan salah! Coba lagi."; passwordFeedback.className = 'error';
                // Shake animation
                gsap.timeline().to(dropZone, { x: 6, rotation: 0.5, duration: 0.05 }).to(dropZone, { x: -6, rotation: -0.5, duration: 0.1 }).to(dropZone, { x: 0, rotation: 0, duration: 0.05 });

                // Reset after a delay
                setTimeout(() => {
                    currentPassword = "";
                    dropZone.textContent = "";
                    dropZone.classList.remove('has-content');
                    if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'block';
                    passwordFeedback.textContent = ""; passwordFeedback.className = '';
                    // Make all draggable words visible and draggable again
                    draggableWords.forEach(word => {
                        // Check if it was hidden by a previous incorrect attempt
                         if (word.style.visibility === 'hidden') {
                             gsap.to(word, { opacity: 1, scale: 1, duration: 0.3, visibility: 'visible' });
                             word.setAttribute('draggable', 'true');
                         }
                    });
                }, 800);
            }
        });
    } // End setupPasswordGate

    // --- Opening Transition Logic ---
    function triggerOpeningTransition() {
        gsap.timeline({ delay: 0.6 }) // Wait slightly after password correct animation
            .to(passwordGate, {
                opacity: 0,
                duration: 0.5,
                ease: "power1.in",
                onComplete: () => {
                    passwordGate.style.display = 'none'; // Remove from layout
                    playOpeningParticleAnimation();
                }
            });
    }
    function playOpeningParticleAnimation() {
        if (!openingTransition) return;
        openingTransition.style.display = 'block'; // Make it visible
        gsap.to(openingTransition, { opacity: 1, duration: 0.1 }); // Fade in container

        // Create particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
             const particle = document.createElement('div');
             particle.classList.add('particle');
             openingTransition.appendChild(particle);
             // Set initial state (centered, small, transparent)
             gsap.set(particle, {
                 x: () => gsap.utils.random('45vw', '55vw'),
                 y: () => gsap.utils.random('45vh', '55vh'),
                 scale: gsap.utils.random(0.5, 1.5),
                 opacity: 0
             });
        }

        const particles = openingTransition.querySelectorAll('.particle');
        const tl = gsap.timeline({
            onComplete: () => {
                // Fade out transition container and reveal main content
                gsap.to(openingTransition, {
                    opacity: 0,
                    duration: 0.6,
                    ease: "power1.in",
                    onComplete: () => {
                        openingTransition.style.display = 'none'; // Hide after fade
                        openingTransition.innerHTML = ''; // Clean up particles
                        revealMainContentAndSetupAnimations(); // Trigger main content reveal
                    }
                });
            }
        });

        // Particle explosion animation
        tl.to(particles, {
            x: () => gsap.utils.random(-20, window.innerWidth + 20), // Scatter horizontally
            y: () => gsap.utils.random(-20, window.innerHeight + 20), // Scatter vertically
            scale: () => gsap.utils.random(0.5, 3), // Vary size
            rotation: () => gsap.utils.random(-360, 360), // Random rotation
            opacity: () => gsap.utils.random(0.3, 0.8), // Fade in to varied opacity
            backgroundColor: () => gsap.utils.random(['#a2d2ff', '#bde0fe', '#ffafcc', '#ffc8dd', '#cdb4db']), // Random colors
            duration: 2.0, // Duration of explosion
            stagger: 0.01, // Stagger start times slightly
            ease: "expo.out" // Easing for outward motion
        })
        // Fade out particles before the container fades
        .to(particles, {
            opacity: 0,
            scale: 0, // Shrink out
            duration: 1.0, // Duration of fade out
            stagger: 0.005, // Faster stagger for fade out
            ease: "power1.in" // Easing for inward/fade motion
        }, "-=0.8"); // Overlap fade out with explosion end
    }


    // --- Reveal Main Content & Setup Scroll Animations ---
    function revealMainContentAndSetupAnimations() {
         if (!mainContent) return;

         // Split text *before* animations are set up
         splitText();

         // Make content visible and fade it in
         gsap.set(mainContent, { visibility: 'visible' });
         gsap.to(mainContent, { opacity: 1, duration: 1.0, ease: "sine.out" });

         // Enable body scrolling
         body.style.overflowY = 'auto';

         // Use rAF to ensure layout is calculated before setting up ScrollTriggers
         requestAnimationFrame(() => {
             setupScrollTriggerAnimations();

              // Optional: Initial fade-in for the first scene
              if (document.getElementById('scene-1')) {
                 gsap.from("#scene-1", { opacity: 0, y: 30, duration: 0.8, ease: "power2.out", delay: 0.2 });
              }

             // Add hover effects *after* initial reveal/setup
             setupHoverMicroAnimations();

             // Refresh ScrollTrigger after a short delay to ensure all calculations are correct
             gsap.delayedCall(0.3, () => ScrollTrigger.refresh());
         });
    }


    // --- ScrollTrigger Animation Setup ---
    function setupScrollTriggerAnimations() {
        // Kill existing ScrollTriggers to prevent duplicates on resize/re-run
        scrollTriggers.forEach(st => st.kill());
        scrollTriggers = [];

        // Helper functions for managing will-change property
        const setWillChange = (elements, value = 'transform, opacity') => gsap.set(elements, { willChange: value });
        const clearWillChange = (elements) => gsap.set(elements, { willChange: 'auto' });

        // --- Scene 1: Streetlight & Intro ---
        const scene1 = document.getElementById('scene-1');
        if (scene1) {
            const greetingWords = scene1.querySelectorAll('.scene1-greeting .word');
            const textWords = scene1.querySelectorAll('.scene1-text .word');
            setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust, streetlight]); // Initial set

            // Animate text and light based on scroll position within Scene 1
            const st1 = ScrollTrigger.create({
                trigger: scene1,
                start: "top top", // Starts when the top of scene1 hits the top of the viewport
                end: "bottom center", // Ends when the bottom of scene1 hits the center
                scrub: SCRUB_SMOOTHING,
                invalidateOnRefresh: true,
                onToggle: self => self.isActive ? setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]) : clearWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]), // Manage will-change
                animation: gsap.timeline()
                    .from(greetingWords, { opacity: 0, yPercent: 50, rotationX: -10, stagger: 0.06 }, 0)
                    .from(textWords, { opacity: 0, yPercent: 30, stagger: 0.03 }, 0.1)
                    .to(streetlightBulb, { opacity: 1, ease: "sine.inOut" }, 0)
                    .to(lightBeam, { opacity: 1, scaleY: 1, ease: "sine.inOut" }, 0.05)
                    .to(lightBeamDust, { opacity: () => 0.1 + Math.random() * 0.1, ease: "sine.inOut"}, 0.15) // Subtle dust fade-in
            });
            scrollTriggers.push(st1);

            // Parallax effect for the streetlight pole
            const stPara = ScrollTrigger.create({
                trigger: scene1,
                start: "top top",
                end: "bottom top", // Scroll parallax until scene1 is fully scrolled past
                scrub: 1.8, // Slightly different scrub for parallax feel
                invalidateOnRefresh: true,
                onToggle: self => self.isActive ? setWillChange(streetlight) : clearWillChange(streetlight),
                animation: gsap.to(streetlight, { yPercent: -20, ease: "none" }),
            });
            scrollTriggers.push(stPara);
        }

        // --- Scene 2: Gallery (REFINED VERSION) ---
        if (scene2Wrapper && galleryTrack && galleryItems.length > 0) {
            const textBlockWords = document.querySelectorAll('.scene2-text-block .word');
            const galleryTitleChars = document.querySelectorAll('.gallery-title .char');
            setWillChange([textBlockWords, galleryTitleChars, galleryTrack, galleryItems, galleryImages]); // Initial set

            // Animate text block entrance
            const st2Text = ScrollTrigger.create({
                trigger: ".scene2-text-block",
                start: "top 85%", // Trigger animation slightly before it enters fully
                toggleActions: "play none none none", // Play once on enter
                invalidateOnRefresh: true,
                onEnter: (self) => {
                    const words = self.trigger.querySelectorAll('.word');
                    setWillChange(words); // Add will-change just before animating
                    gsap.from(words, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' });
                    // Animate emphasis words
                    gsap.to(self.trigger.querySelectorAll('.emphasis'), {
                         color: "#ffc8dd", // Highlight color
                         scale: 1.03,
                         duration: 0.6,
                         delay: 0.3,
                         ease: "back.out(1)"
                    });
                },
                 onLeaveBack: (self) => { clearWillChange(self.trigger.querySelectorAll('.word')); } // Clear will-change on scroll up past trigger
            });
            scrollTriggers.push(st2Text);

            // Animate gallery title entrance
            const st2Title = ScrollTrigger.create({
                trigger: ".gallery-title",
                start: "top 90%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
                onEnter: (self) => {
                    const chars = self.trigger.querySelectorAll('.char');
                    setWillChange(chars);
                    gsap.from(chars, { opacity: 0, scale: 1.4, filter: 'blur(2px)', y: 20, stagger: 0.03, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
                },
                onLeaveBack: (self) => clearWillChange(self.trigger.querySelectorAll('.char'))
            });
            scrollTriggers.push(st2Title);

            // ** REFINED Horizontal Scroll **
            const horizontalScrub = gsap.to(galleryTrack, {
                // Calculate x dynamically on refresh to scroll the track horizontally
                x: () => -(galleryTrack.scrollWidth - scene2Wrapper.offsetWidth),
                ease: "none", // Linear movement during scrub
                scrollTrigger: {
                    trigger: scene2Wrapper, // Trigger based on the wrapper element
                    start: "center center", // Pin when the center of the wrapper hits the center of the viewport
                    // Pin for the exact distance needed to scroll the track fully
                    end: () => "+=" + (galleryTrack.scrollWidth - scene2Wrapper.offsetWidth),
                    scrub: HORIZONTAL_SCRUB_SMOOTHING, // Use the adjusted (more responsive) scrub value
                    pin: true, // Pin the trigger element (scene2Wrapper)
                    pinSpacing: true, // Add padding to prevent content jump after unpinning
                    invalidateOnRefresh: true, // Recalculate on resize/refresh
                    // anticipatePin: 0.2, // Removed for simplicity, add back small value if needed
                    onUpdate: self => {
                        // Fade gallery items based on their distance from the center of the viewport
                        gsap.to(galleryItems, {
                            opacity: (i, target) => {
                                const itemRect = target.getBoundingClientRect();
                                // Calculate distance of item center from viewport center
                                const distFromCenter = Math.abs(itemRect.left + itemRect.width / 2 - window.innerWidth / 2);
                                // Fade items that are further away, keep closer ones more opaque
                                return Math.max(0.5, 1 - (distFromCenter / (window.innerWidth * 0.7)));
                            },
                            ease: "none" // Apply opacity change directly without easing
                        });
                    },
                    // Manage will-change for the track during the scroll
                    onToggle: self => self.isActive ? setWillChange(galleryTrack) : clearWillChange(galleryTrack),
                }
            });
            scrollTriggers.push(horizontalScrub.scrollTrigger); // Add the ScrollTrigger instance to the array

             // Animations for individual gallery items linked to the horizontal scroll
             galleryItems.forEach((item, index) => {
                 const image = item.querySelector('.gallery-image');
                 setWillChange([item, image]); // Set will-change for item and image

                 // Subtle vertical parallax for the item itself
                 gsap.to(item, {
                     yPercent: () => gsap.utils.random(-3, 3), // Random small vertical movement
                     ease: "none",
                     scrollTrigger: {
                         containerAnimation: horizontalScrub, // Link to the main horizontal scroll animation
                         trigger: item,
                         start: "left right", // Start when item left edge enters viewport right
                         end: "right left",   // End when item right edge leaves viewport left
                         scrub: 1.8 // Scrub factor for this sub-animation
                     }
                 });
                 // Ken Burns effect for the image within the item
                 gsap.to(image, {
                     scale: 1.08, // Slightly zoom in
                     xPercent: () => gsap.utils.random(-2, 2), // Small horizontal shift
                     yPercent: () => gsap.utils.random(-2, 2), // Small vertical shift
                     ease: "none",
                     scrollTrigger: {
                         containerAnimation: horizontalScrub,
                         trigger: item,
                         start: "left 80%", // Start effect when item is partially visible
                         end: "right 20%",  // End effect before item fully leaves
                         scrub: 1.2 // Scrub factor for image animation
                     }
                 });
             });
        }


        // --- Scene 3: Transition ---
        if (scene3 && scene4 && transitionEffect) {
            setWillChange([scene4, transitionEffect]); // Set initial will-change
             const st3 = ScrollTrigger.create({
                trigger: scene3, // The transition section itself
                start: 'top top',
                end: 'bottom top', // Animate throughout the height of scene3
                scrub: SCRUB_SMOOTHING,
                invalidateOnRefresh: true,
                animation: gsap.timeline()
                    // Reveal Scene 4 using a circular clip-path wipe from bottom center
                    .to(scene4, { clipPath: 'circle(150% at 50% 100%)', ease: 'none' }, 0)
                    // Fade in the gradient overlay
                    .fromTo(transitionEffect, { opacity: 0 }, { opacity: 1, ease: 'sine.in' }, 0)
                    // Fade out the gradient overlay towards the end
                    .to(transitionEffect, { opacity: 0, ease: 'sine.out' }, 0.7), // Start fading out after 70% progress
                 onToggle: self => self.isActive ? setWillChange([scene4, transitionEffect]) : clearWillChange([scene4, transitionEffect]),
            });
            scrollTriggers.push(st3);
        }


        // --- Scene 4: Project Cards ---
        if (scene4) {
            const introParagraphs = document.querySelectorAll('#scene-4 .intro-paragraph');
            const projectTitle = document.querySelector('.project-section-title');
            const projectCards = document.querySelectorAll('.project-card');
            const outroParagraph = document.querySelector('#scene-4 .outro-paragraph');
            // Set initial will-change for all elements that will be animated on entrance
            setWillChange([introParagraphs, projectTitle, projectCards, outroParagraph]);

             // Animate intro paragraphs entrance
             introParagraphs.forEach((p, i) => {
                const st4Intro = ScrollTrigger.create({
                    trigger: p,
                    start: "top 85%",
                    toggleActions: "play none none none",
                    invalidateOnRefresh: true,
                     onEnter: (self) => {
                        const words = self.trigger.querySelectorAll('.word');
                        const strongEmphasis = self.trigger.querySelector('.strong-emphasis');
                        setWillChange(words); // Add will-change before animating
                        gsap.from(words, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' });
                        // Animate the strongly emphasized text
                        if (strongEmphasis) {
                            gsap.fromTo(strongEmphasis,
                                { scale: 0.9, filter: 'brightness(0.8)' },
                                { scale: 1.05, filter: 'brightness(1.2)', duration: 0.6, delay: 0.4, ease: "back.out(1.5)" }
                            );
                        }
                    },
                      onLeaveBack: (self) => clearWillChange(self.trigger.querySelectorAll('.word')) // Clear will-change on scroll up
                 });
                 scrollTriggers.push(st4Intro);
             });

             // Animate project section title entrance
            const st4SecTitle = ScrollTrigger.create({
                trigger: projectTitle,
                start: "top 90%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
                onEnter: (self) => {
                    const words = self.trigger.querySelectorAll('.word');
                    setWillChange(words);
                    gsap.from(words, { opacity: 0, y: 25, rotationX: -20, stagger: 0.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
                },
                onLeaveBack: (self) => clearWillChange(self.trigger.querySelectorAll('.word'))
            });
            scrollTriggers.push(st4SecTitle);

             // Animate project cards entrance
             projectCards.forEach((card) => {
                const st4Card = ScrollTrigger.create({
                    trigger: card,
                    start: "top 88%",
                    toggleActions: "play none none none",
                    invalidateOnRefresh: true,
                     onEnter: (self) => {
                        const titleChars = self.trigger.querySelectorAll('.project-title .char');
                        const descriptionWords = self.trigger.querySelectorAll('.project-description .word');
                        setWillChange(self.trigger); // Set will-change on the card itself
                        // Card fade/scale animation
                        gsap.from(self.trigger, { opacity: 0, y: 50, scale: 0.97, duration: 0.6, ease:'power1.out', overwrite: 'auto' });
                        // Title character animation (slight delay)
                         gsap.from(titleChars, { opacity: 0, scale: 1.2, y: 5, stagger: 0.015, duration: 0.5, delay: 0.1, ease: 'power1.out', overwrite: 'auto' });
                        // Description word animation (slightly more delay)
                         gsap.from(descriptionWords, { opacity: 0.1, y: 8, stagger: 0.01, duration: 0.6, delay: 0.2, ease: 'power1.out', overwrite: 'auto' });
                    },
                     // Clear will-change after the entrance animation is likely complete or when scrolling past
                     onLeave: (self) => clearWillChange(self.trigger),
                     onEnterBack: (self) => setWillChange(self.trigger), // Re-add if scrolling back
                     onLeaveBack: (self) => clearWillChange(self.trigger)
                 });
                 scrollTriggers.push(st4Card);
             });

             // Highlight the specific "proyek-disabilitas-card" when it's in view
            if (disabilitasCard) {
                const st4Highlight = ScrollTrigger.create({
                    trigger: disabilitasCard,
                    start: "center 80%", // Start highlighting when center reaches 80% down viewport
                    end: "bottom 20%",   // End highlighting when bottom reaches 20% down viewport
                    toggleClass: { targets: disabilitasCard, className: "is-highlighted" }, // Add/remove class
                    invalidateOnRefresh: true
                 });
                scrollTriggers.push(st4Highlight);
            }

             // Animate outro paragraph entrance
             const st4Outro = ScrollTrigger.create({
                trigger: outroParagraph,
                start: "top 90%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
                 onEnter: (self) => {
                    const words = self.trigger.querySelectorAll('.word');
                    setWillChange(words);
                    gsap.from(words, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' });
                },
                 onLeaveBack: (self) => clearWillChange(self.trigger.querySelectorAll('.word'))
             });
             scrollTriggers.push(st4Outro);
        }

        // --- Scene 5: Closing ---
        const scene5 = document.getElementById('scene-5');
        if (scene5) {
            const closingWords = scene5.querySelectorAll('.closing-text .word');
            const leadWords = scene5.querySelectorAll('.signature-lead .word');
            const signatureChars = scene5.querySelectorAll('.signature .char');
            setWillChange([closingWords, leadWords, signatureChars, finalScrollMessage]); // Initial set

            // Animate closing text and signature based on scroll position within Scene 5
            const st5 = ScrollTrigger.create({
                trigger: scene5,
                start: "top 40%", // Start animation when scene5 top is 40% down viewport
                end: "bottom bottom", // End animation when scene5 bottom hits viewport bottom
                scrub: SCRUB_SMOOTHING + 0.3, // Slightly slower scrub for closing feel
                invalidateOnRefresh: true,
                animation: gsap.timeline()
                    .from(closingWords, { opacity: 0.05, yPercent: 15, filter: 'blur(0.5px)', stagger: 0.06 }, 0)
                    .from(leadWords, { opacity: 0.05, yPercent: 15, stagger: 0.06 }, 0.2) // Stagger lead-in text
                    .from(signatureChars, { opacity: 0, scale: 1.5, filter: 'blur(3px)', yPercent: 20, rotationX: -30, stagger: 0.04, ease: "back.out(1.5)" }, 0.4), // Stagger signature chars
                 onToggle: self => self.isActive ? setWillChange([closingWords, leadWords, signatureChars]) : clearWillChange([closingWords, leadWords, signatureChars]),
            });
            scrollTriggers.push(st5);

            // Animate the final scroll message appearance
            const st5Msg = ScrollTrigger.create({
                trigger: scene5,
                start: "bottom bottom-=150px", // Trigger when near the very bottom
                toggleActions: "play none none reverse", // Play on enter, reverse on leave back up
                animation: gsap.to(finalScrollMessage, { opacity: 1, duration: 0.5 }),
                invalidateOnRefresh: true,
                onToggle: self => self.isActive ? setWillChange(finalScrollMessage) : clearWillChange(finalScrollMessage),
            });
            scrollTriggers.push(st5Msg);

             // Optional page fade out at the very end of the scroll
             if(pageFadeOut) {
                const st5Fade = ScrollTrigger.create({
                    trigger: body, // Trigger based on the entire body scroll
                    start: "bottom bottom-=50px", // Start fading 50px from bottom
                    end: "bottom bottom", // Fully faded at the bottom
                    scrub: 0.5, // Quick fade scrub
                    animation: gsap.to(pageFadeOut, { opacity: 1, ease: "none" }),
                    invalidateOnRefresh: true,
                    onToggle: self => self.isActive ? setWillChange(pageFadeOut) : clearWillChange(pageFadeOut),
                });
                scrollTriggers.push(st5Fade);
             }
        }

        // --- Final Refresh ---
        // Refresh ScrollTrigger to ensure all calculations are up-to-date after setup
        ScrollTrigger.refresh();

    } // End setupScrollTriggerAnimations


    // --- Setup Hover Micro-Animations ---
    function setupHoverMicroAnimations() {
        // Don't add hover effects on touch devices where 'hover' is problematic
        if (isTouchDevice) return;

        // Gallery Items Hover Effect
        galleryItems.forEach(item => {
            const image = item.querySelector('.gallery-image');
            // Create a reusable timeline for hover animation
            const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } });
            tl.to(item, { y: -4, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }) // Lift item and add shadow
              .to(image, { scale: 1.03 }, 0); // Scale image slightly (at the same time as lift)

            item.addEventListener('mouseenter', () => tl.timeScale(1).play()); // Play forward on enter
            item.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); // Reverse slightly faster on leave
        });

        // Project Cards Hover Effect
        projectCards.forEach(card => {
             const icon = card.querySelector('.card-icon');
             const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } });
             tl.to(card, { y: -5, boxShadow: '0 12px 25px rgba(50, 100, 150, 0.15)' }); // Lift card more, different shadow
              // Animate icon if it exists
              if(icon) {
                  tl.to(icon, { scale: 1.1, rotate: '-5deg' }, 0); // Scale and rotate icon
              }

             card.addEventListener('mouseenter', () => tl.timeScale(1).play());
             card.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse());
        });

         // Draggable Words Hover Effect (Subtle scale)
         draggableWords.forEach(word => {
            // Ensure the word is still draggable before adding hover
             if (word.getAttribute('draggable') === 'true' && word.style.visibility !== 'hidden') {
                 const tl = gsap.timeline({ paused: true, defaults: { duration: 0.2, ease: 'sine.out' } });
                 tl.to(word, { scale: 1.08, filter: 'brightness(1.1)' }); // Scale up and brighten slightly

                 word.addEventListener('mouseenter', () => tl.timeScale(1).play());
                 word.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse());
             }
         });
    } // End setupHoverMicroAnimations


    // --- Initialize ---
    setupPasswordGate(); // Start the process by setting up the password gate

}); // End DOMContentLoaded