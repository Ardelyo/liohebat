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
            const splitElements = document.querySelectorAll('.word, .char');
            if (splitElements.length > 0) {
                gsap.set(splitElements, { clearProps: "all" });
            }
        }
        document.body.style.overflowY = 'auto';
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
    const scene1 = document.getElementById('scene-1');
    const scene2 = document.getElementById('scene-2');
    const scene2Wrapper = document.querySelector('.scene2-wrapper');
    const galleryTrack = document.getElementById('gallery-track');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryImages = document.querySelectorAll('.gallery-image');
    const scene3 = document.getElementById('scene-3');
    const scene4 = document.getElementById('scene-4');
    const transitionEffect = document.querySelector('#scene-3 .transition-effect');
    const projectCards = document.querySelectorAll('.project-card');
    const disabilitasCard = document.getElementById('proyek-disabilitas-card');
    const scene5 = document.getElementById('scene-5');
    const finalScrollMessage = document.querySelector('.final-scroll-message');
    const pageFadeOut = document.querySelector('.page-fade-out');

    // --- State & Config ---
    const CORRECT_PASSWORD = "LIOHEBAT";
    const PARTICLE_COUNT = 40;
    const SCRUB_SMOOTHING = 1.6;
    const HORIZONTAL_SCRUB_SMOOTHING = 1.0;

    let currentPassword = "";
    let isPasswordCorrect = false;
    let scrollTriggers = [];

    // --- Text Splitting Utilities (Run Once) ---
    function splitText() {
        const splitTargets = document.querySelectorAll('.split-words, .split-lines, .split-chars');
        splitTargets.forEach(el => {
            if (el.dataset.split) return;
            const text = el.innerHTML;
            el.innerHTML = '';
            if (el.classList.contains('split-chars')) {
                [...text].forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.innerHTML = char === ' ' ? ' ' : char;
                    el.appendChild(span);
                });
            } else {
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;
                function processChildrenInto(originalNode, targetContainer) {
                     Array.from(originalNode.childNodes).forEach(child => {
                         if (child.nodeType === Node.TEXT_NODE) {
                             const words = child.textContent.split(/(\s+)/);
                             words.forEach(part => {
                                 if (part.trim().length > 0) appendWord(targetContainer, part);
                                 else if (part.length > 0) targetContainer.appendChild(document.createTextNode(part));
                             });
                         } else if (child.nodeType === Node.ELEMENT_NODE) {
                             const clonedChild = child.cloneNode(false);
                             processChildrenInto(child, clonedChild);
                             targetContainer.appendChild(clonedChild);
                         } else { targetContainer.appendChild(child.cloneNode(true)); }
                     });
                 }
                processChildrenInto(tempDiv, fragment);
                el.appendChild(fragment);
            }
            el.dataset.split = 'true';
        });
    }
    function appendWord(parent, wordHTML) {
        const wordWrap = document.createElement('span'); wordWrap.className = 'word-wrap';
        const wordSpan = document.createElement('span'); wordSpan.className = 'word';
        wordSpan.innerHTML = wordHTML; wordWrap.appendChild(wordSpan); parent.appendChild(wordWrap);
    }

    // --- Password Gate Logic (Error Handling Added) ---
    function setupPasswordGate() {
        if (!passwordGate || !dropZone || !draggableWords.length) {
            console.warn("Password gate elements missing, attempting fallback.");
            revealMainContentAndSetupAnimations();
            return;
        }
        gsap.set(draggableWords, { opacity: 1, scale: 1, y: 0 });
        let dragSourceElement = null;

        draggableWords.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                // *** FIX: Add check for target and dataset before accessing ***
                if (e.target && e.target.dataset && e.target.dataset.word) {
                    try {
                        if (e.dataTransfer) {
                            e.dataTransfer.setData('text/plain', e.target.dataset.word); // Use checked value
                            e.dataTransfer.effectAllowed = 'move';
                            gsap.to(e.target, { scale: 1.1, filter: 'brightness(1.2)', duration: 0.2 });
                            e.target.classList.add('dragging');
                            dragSourceElement = e.target;
                            dropZone.classList.add('drag-active');
                        } else { console.error("DataTransfer object not available."); e.preventDefault(); }
                    } catch (error) { console.error("Error setting dataTransfer data:", error); e.preventDefault(); }
                } else {
                     console.error("Dragstart error: Target or dataset.word missing.", e.target);
                     e.preventDefault(); // Stop the drag operation if data is invalid
                }
            });
            word.addEventListener('dragend', (e) => {
                gsap.to(e.target, { scale: 1, filter: 'brightness(1)', duration: 0.2 });
                e.target.classList.remove('dragging'); dragSourceElement = null;
                dropZone.classList.remove('drag-active', 'drag-over');
            });
        });
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.effectAllowed === 'move') { e.dataTransfer.dropEffect = 'move'; dropZone.classList.add('drag-over'); }
        });
        dropZone.addEventListener('dragleave', (e) => { if (e.relatedTarget === null || !dropZone.contains(e.relatedTarget)) { dropZone.classList.remove('drag-over'); } });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('drag-over', 'drag-active'); let droppedWord = null;
            try { if (e.dataTransfer) { droppedWord = e.dataTransfer.getData('text/plain'); } } catch (error) { console.error("Error getting dataTransfer data:", error); }
            if (!droppedWord) { console.error("Failed to get dropped data."); return; }
            const originalElement = dragSourceElement && dragSourceElement.dataset.word === droppedWord ? dragSourceElement : document.querySelector(`.draggable-word[data-word="${droppedWord}"]:not([style*="visibility: hidden"])`);
            if (isPasswordCorrect || !originalElement || originalElement.style.visibility === 'hidden') { return; }
            dropZone.classList.add('has-content'); if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'none';
            gsap.to(originalElement, { opacity: 0, scale: 0.5, duration: 0.3, visibility: 'hidden', onComplete: () => { originalElement.setAttribute('draggable', 'false'); } });
            currentPassword += droppedWord; dropZone.textContent = currentPassword;
            if (currentPassword === CORRECT_PASSWORD) {
                passwordFeedback.textContent = "Benar! Membuka lintasan..."; passwordFeedback.className = 'success'; isPasswordCorrect = true;
                gsap.timeline().to(dropZone, { backgroundColor: "rgba(144, 238, 144, 0.2)", borderColor: "rgba(144, 238, 144, 0.6)", duration: 0.2 }).to(dropZone, { scale: 1.05, duration: 0.1 }).to(dropZone, { scale: 1, duration: 0.3, ease: "back.out(1.4)" }).to(dropZone, { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "rgba(255, 255, 255, 0.3)", duration: 0.3 }, "-=0.1");
                triggerOpeningTransition();
            } else if (CORRECT_PASSWORD.startsWith(currentPassword)) {
                passwordFeedback.textContent = "Lanjutkan..."; passwordFeedback.className = ''; gsap.fromTo(dropZone, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
            } else {
                passwordFeedback.textContent = "Urutan salah! Coba lagi."; passwordFeedback.className = 'error';
                gsap.timeline().to(dropZone, { x: 6, rotation: 0.5, duration: 0.05 }).to(dropZone, { x: -6, rotation: -0.5, duration: 0.1 }).to(dropZone, { x: 0, rotation: 0, duration: 0.05 });
                setTimeout(() => {
                    currentPassword = ""; dropZone.textContent = ""; dropZone.classList.remove('has-content'); if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'block'; passwordFeedback.textContent = ""; passwordFeedback.className = '';
                    draggableWords.forEach(word => { if (word.style.visibility === 'hidden') { gsap.to(word, { opacity: 1, scale: 1, duration: 0.3, visibility: 'visible' }); word.setAttribute('draggable', 'true'); } });
                }, 800);
            }
        });
    }

    // --- Opening Transition Logic ---
    function triggerOpeningTransition() {
        gsap.timeline({ delay: 0.6 }).to(passwordGate, { opacity: 0, duration: 0.5, ease: "power1.in", onComplete: () => { passwordGate.style.display = 'none'; playOpeningParticleAnimation(); } });
    }
    function playOpeningParticleAnimation() {
        if (!openingTransition) return; openingTransition.style.display = 'block'; gsap.to(openingTransition, { opacity: 1, duration: 0.1 });
        for (let i = 0; i < PARTICLE_COUNT; i++) { const particle = document.createElement('div'); particle.classList.add('particle'); openingTransition.appendChild(particle); gsap.set(particle, { x: () => gsap.utils.random('45vw', '55vw'), y: () => gsap.utils.random('45vh', '55vh'), scale: gsap.utils.random(0.5, 1.5), opacity: 0 }); }
        const particles = openingTransition.querySelectorAll('.particle');
        const tl = gsap.timeline({ onComplete: () => { gsap.to(openingTransition, { opacity: 0, duration: 0.6, ease: "power1.in", onComplete: () => { openingTransition.style.display = 'none'; openingTransition.innerHTML = ''; revealMainContentAndSetupAnimations(); } }); } });
        tl.to(particles, { x: () => gsap.utils.random(-20, window.innerWidth + 20), y: () => gsap.utils.random(-20, window.innerHeight + 20), scale: () => gsap.utils.random(0.5, 3), rotation: () => gsap.utils.random(-360, 360), opacity: () => gsap.utils.random(0.3, 0.8), backgroundColor: () => gsap.utils.random(['#a2d2ff', '#bde0fe', '#ffafcc', '#ffc8dd', '#cdb4db']), duration: 2.0, stagger: 0.01, ease: "expo.out" })
        .to(particles, { opacity: 0, scale: 0, duration: 1.0, stagger: 0.005, ease: "power1.in" }, "-=0.8");
    }

    // --- Set Initial Animation States ---
    function setInitialStates() {
        // Scene 1
        if (scene1) {
            gsap.set(scene1.querySelectorAll('.scene1-greeting .word, .scene1-text .word'), { opacity: 0, y: 20 });
            gsap.set(streetlightBulb, { opacity: 0 });
            gsap.set(lightBeam, { opacity: 0, scaleY: 0 });
            gsap.set(lightBeamDust, { opacity: 0 });
        }
        // Scene 2
        if (scene2) {
            gsap.set(scene2.querySelectorAll('.scene2-text-block .word'), { opacity: 0, y: 10 });
            gsap.set(scene2.querySelectorAll('.gallery-title .char'), { opacity: 0, scale: 1.4, filter: 'blur(2px)', y: 20 });
            // Initial state for gallery items (opacity handled by scroll update)
            gsap.set(galleryItems, { yPercent: 0 });
            gsap.set(galleryImages, { scale: 1, xPercent: 0, yPercent: 0 });
        }
        // Scene 4
        if (scene4) {
            gsap.set(scene4.querySelectorAll('.intro-paragraph .word, .outro-paragraph .word'), { opacity: 0, y: 10 });
             gsap.set(scene4.querySelector('.strong-emphasis'), { scale: 0.9, filter: 'brightness(0.8)' });
            gsap.set(scene4.querySelectorAll('.project-section-title .word'), { opacity: 0, y: 25, rotationX: -20 });
            gsap.set(projectCards, { opacity: 0, y: 50, scale: 0.97 });
             gsap.set(scene4.querySelectorAll('.project-card .project-title .char'), { opacity: 0, scale: 1.2, y: 5 });
             gsap.set(scene4.querySelectorAll('.project-card .project-description .word'), { opacity: 0, y: 8 });
        }
        // Scene 5
        if (scene5) {
            gsap.set(scene5.querySelectorAll('.closing-text .word, .signature-lead .word'), { opacity: 0, yPercent: 15 });
            gsap.set(scene5.querySelectorAll('.signature .char'), { opacity: 0, scale: 1.5, filter: 'blur(3px)', yPercent: 20, rotationX: -30 });
        }
         // Ensure main content starts hidden before reveal animation
         if (mainContent) {
            gsap.set(mainContent, { visibility: 'hidden', opacity: 0 });
         }
    }

    // --- Reveal Main Content & Setup Scroll Animations ---
    function revealMainContentAndSetupAnimations() {
         if (!mainContent) return;
         splitText(); // Split text first
         setInitialStates(); // *** Set initial hidden states for animations ***

         gsap.set(mainContent, { visibility: 'visible' }); // Make container visible
         gsap.to(mainContent, { opacity: 1, duration: 1.0, ease: "sine.out" }); // Fade it in

         body.style.overflowY = 'auto';
         requestAnimationFrame(() => {
             setupScrollTriggerAnimations(); // Now setup animations
             setupHoverMicroAnimations();
             gsap.delayedCall(0.1, () => ScrollTrigger.refresh(true)); // Refresh slightly later, force recalculation
         });
    }

    // --- ScrollTrigger Animation Setup ---
    function setupScrollTriggerAnimations() {
        scrollTriggers.forEach(st => st.kill()); scrollTriggers = [];
        const setWillChange = (elements, value = 'transform, opacity') => gsap.set(elements, { willChange: value });
        const clearWillChange = (elements) => gsap.set(elements, { willChange: 'auto' });

        // --- Scene 1: Streetlight & Intro ---
        if (scene1) {
            const greetingWords = scene1.querySelectorAll('.scene1-greeting .word'); const textWords = scene1.querySelectorAll('.scene1-text .word');
            // Scrub animation for text and light
            const st1 = ScrollTrigger.create({
                trigger: scene1, start: "top 70%", end: "bottom center", scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true,
                onToggle: self => self.isActive ? setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]) : clearWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]),
                animation: gsap.timeline()
                    .to(greetingWords, { opacity: 1, y: 0, stagger: 0.06 }, 0)
                    .to(textWords, { opacity: 1, y: 0, stagger: 0.03 }, 0.1)
                    .to(streetlightBulb, { opacity: 1, ease: "sine.inOut" }, 0)
                    .to(lightBeam, { opacity: 1, scaleY: 1, ease: "sine.inOut" }, 0.05)
                    .to(lightBeamDust, { opacity: () => 0.1 + Math.random() * 0.1, ease: "sine.inOut"}, 0.15)
            }); scrollTriggers.push(st1);
            // Parallax for streetlight pole
            const stPara = ScrollTrigger.create({ trigger: scene1, start: "top top", end: "bottom top", scrub: 1.8, invalidateOnRefresh: true, animation: gsap.to(streetlight, { yPercent: -20, ease: "none" }), onToggle: self => self.isActive ? setWillChange(streetlight) : clearWillChange(streetlight) }); scrollTriggers.push(stPara);
        }

        // --- Scene 2: Gallery ---
        if (scene2Wrapper && galleryTrack && galleryItems.length > 0) {
            const textBlock = scene2.querySelector('.scene2-text-block');
            const galleryTitle = scene2.querySelector('.gallery-title');

            // Animate text block entrance (triggered once)
            if (textBlock) {
                const st2Text = ScrollTrigger.create({
                    trigger: textBlock, start: "top 85%", toggleActions: "play none none reverse", // Play on enter, reverse on leave up
                    invalidateOnRefresh: true,
                    onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); gsap.to(self.trigger.querySelectorAll('.emphasis'), { color: "#ffc8dd", scale: 1.03, duration: 0.6, delay: 0.3, ease: "back.out(1)"}); },
                    onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto'}); } // Reset on leave back
                }); scrollTriggers.push(st2Text);
            }
            // Animate gallery title entrance (triggered once)
            if (galleryTitle) {
                const st2Title = ScrollTrigger.create({
                    trigger: galleryTitle, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                    onEnter: (self) => { const chars = self.trigger.querySelectorAll('.char'); setWillChange(chars); gsap.to(chars, { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, stagger: 0.03, duration: 0.6, ease: 'power2.out', overwrite: 'auto' }); },
                    onLeaveBack: (self) => { const chars = self.trigger.querySelectorAll('.char'); clearWillChange(chars); gsap.to(chars, { opacity: 0, scale: 1.4, filter: 'blur(2px)', y: 20, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }); } // Reset
                }); scrollTriggers.push(st2Title);
            }
            // Horizontal Scroll
            const horizontalScrub = gsap.to(galleryTrack, {
                x: () => -(galleryTrack.scrollWidth - scene2Wrapper.offsetWidth), ease: "none",
                scrollTrigger: {
                    trigger: scene2Wrapper, start: "center center", end: () => "+=" + (galleryTrack.scrollWidth - scene2Wrapper.offsetWidth),
                    scrub: HORIZONTAL_SCRUB_SMOOTHING, pin: true, pinSpacing: true, invalidateOnRefresh: true,
                    onUpdate: self => { gsap.to(galleryItems, { opacity: (i, target) => { const itemRect = target.getBoundingClientRect(); const distFromCenter = Math.abs(itemRect.left + itemRect.width / 2 - window.innerWidth / 2); return Math.max(0.5, 1 - (distFromCenter / (window.innerWidth * 0.7))); }, ease: "none" }); },
                    onToggle: self => self.isActive ? setWillChange(galleryTrack) : clearWillChange(galleryTrack),
                }
            }); scrollTriggers.push(horizontalScrub.scrollTrigger);
             // Gallery item sub-animations
             galleryItems.forEach((item) => {
                 const image = item.querySelector('.gallery-image'); setWillChange([item, image]);
                 gsap.to(item, { yPercent: () => gsap.utils.random(-3, 3), ease: "none", scrollTrigger: { containerAnimation: horizontalScrub, trigger: item, start: "left right", end: "right left", scrub: 1.8 } });
                 gsap.to(image, { scale: 1.08, xPercent: () => gsap.utils.random(-2, 2), yPercent: () => gsap.utils.random(-2, 2), ease: "none", scrollTrigger: { containerAnimation: horizontalScrub, trigger: item, start: "left 80%", end: "right 20%", scrub: 1.2 } });
             });
        }

        // --- Scene 3: Transition ---
        if (scene3 && scene4 && transitionEffect) {
             const st3 = ScrollTrigger.create({ trigger: scene3, start: 'top top', end: 'bottom top', scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true,
                animation: gsap.timeline().to(scene4, { clipPath: 'circle(150% at 50% 100%)', ease: 'none' }, 0).fromTo(transitionEffect, { opacity: 0 }, { opacity: 1, ease: 'sine.in' }, 0).to(transitionEffect, { opacity: 0, ease: 'sine.out' }, 0.7),
                onToggle: self => self.isActive ? setWillChange([scene4, transitionEffect]) : clearWillChange([scene4, transitionEffect]),
            }); scrollTriggers.push(st3);
        }

        // --- Scene 4: Project Cards ---
        if (scene4) {
            const introParagraphs = scene4.querySelectorAll('.intro-paragraph');
            const projectTitle = scene4.querySelector('.project-section-title');
            const outroParagraph = scene4.querySelector('.outro-paragraph');

             // Animate intro paragraphs entrance (triggered once per paragraph)
             introParagraphs.forEach((p) => {
                const st4Intro = ScrollTrigger.create({ trigger: p, start: "top 85%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                     onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); const strongEmphasis = self.trigger.querySelector('.strong-emphasis'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); if (strongEmphasis) { gsap.to(strongEmphasis, { scale: 1.05, filter: 'brightness(1.2)', duration: 0.6, delay: 0.4, ease: "back.out(1.5)" } ); } },
                     onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); const strongEmphasis = self.trigger.querySelector('.strong-emphasis'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto'}); if (strongEmphasis) { gsap.to(strongEmphasis, { scale: 0.9, filter: 'brightness(0.8)', duration: 0.4, ease: "power2.out" } ); } }
                 }); scrollTriggers.push(st4Intro);
             });
            // Animate project section title entrance (triggered once)
            if (projectTitle) {
                const st4SecTitle = ScrollTrigger.create({ trigger: projectTitle, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                    onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, rotationX: 0, stagger: 0.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }); },
                    onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 25, rotationX: -20, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }); }
                }); scrollTriggers.push(st4SecTitle);
            }
             // Animate project cards entrance (triggered once per card)
             projectCards.forEach((card) => {
                const st4Card = ScrollTrigger.create({ trigger: card, start: "top 88%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                     onEnter: (self) => { const titleChars = self.trigger.querySelectorAll('.project-title .char'); const descriptionWords = self.trigger.querySelectorAll('.project-description .word'); setWillChange(self.trigger); gsap.to(self.trigger, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease:'power1.out', overwrite: 'auto' }); gsap.to(titleChars, { opacity: 1, scale: 1, y: 0, stagger: 0.015, duration: 0.5, delay: 0.1, ease: 'power1.out', overwrite: 'auto' }); gsap.to(descriptionWords, { opacity: 1, y: 0, stagger: 0.01, duration: 0.6, delay: 0.2, ease: 'power1.out', overwrite: 'auto' }); },
                     onLeaveBack: (self) => { const titleChars = self.trigger.querySelectorAll('.project-title .char'); const descriptionWords = self.trigger.querySelectorAll('.project-description .word'); clearWillChange(self.trigger); gsap.to(self.trigger, { opacity: 0, y: 50, scale: 0.97, duration: 0.4, ease:'power1.out', overwrite: 'auto' }); gsap.to(titleChars, { opacity: 0, scale: 1.2, y: 5, duration: 0.3, ease: 'power1.out', overwrite: 'auto' }); gsap.to(descriptionWords, { opacity: 0, y: 8, duration: 0.3, ease: 'power1.out', overwrite: 'auto' }); }
                 }); scrollTriggers.push(st4Card);
             });
            // Highlight disabilitas card
            if (disabilitasCard) { const st4Highlight = ScrollTrigger.create({ trigger: disabilitasCard, start: "center 80%", end: "bottom 20%", toggleClass: { targets: disabilitasCard, className: "is-highlighted" }, invalidateOnRefresh: true }); scrollTriggers.push(st4Highlight); }
            // Animate outro paragraph entrance (triggered once)
             if (outroParagraph) {
                const st4Outro = ScrollTrigger.create({ trigger: outroParagraph, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                    onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); },
                    onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto' }); }
                }); scrollTriggers.push(st4Outro);
             }
        }

        // --- Scene 5: Closing ---
        if (scene5) {
            const closingWords = scene5.querySelectorAll('.closing-text .word'); const leadWords = scene5.querySelectorAll('.signature-lead .word'); const signatureChars = scene5.querySelectorAll('.signature .char');
            // Scrub animation for final text
            const st5 = ScrollTrigger.create({ trigger: scene5, start: "top 40%", end: "bottom bottom", scrub: SCRUB_SMOOTHING + 0.3, invalidateOnRefresh: true,
                animation: gsap.timeline() .to(closingWords, { opacity: 1, yPercent: 0, filter: 'blur(0px)', stagger: 0.06 }, 0) .to(leadWords, { opacity: 1, yPercent: 0, stagger: 0.06 }, 0.2) .to(signatureChars, { opacity: 1, scale: 1, filter: 'blur(0px)', yPercent: 0, rotationX: 0, stagger: 0.04, ease: "back.out(1.5)" }, 0.4),
                onToggle: self => self.isActive ? setWillChange([closingWords, leadWords, signatureChars]) : clearWillChange([closingWords, leadWords, signatureChars]),
            }); scrollTriggers.push(st5);
            // Final scroll message toggle
            if (finalScrollMessage) { const st5Msg = ScrollTrigger.create({ trigger: scene5, start: "bottom bottom-=150px", toggleActions: "play none none reverse", animation: gsap.to(finalScrollMessage, { opacity: 1, duration: 0.5 }), invalidateOnRefresh: true, onToggle: self => self.isActive ? setWillChange(finalScrollMessage) : clearWillChange(finalScrollMessage) }); scrollTriggers.push(st5Msg); }
            // Page fade out
            if (pageFadeOut) { const st5Fade = ScrollTrigger.create({ trigger: body, start: "bottom bottom-=50px", end: "bottom bottom", scrub: 0.5, animation: gsap.to(pageFadeOut, { opacity: 1, ease: "none" }), invalidateOnRefresh: true, onToggle: self => self.isActive ? setWillChange(pageFadeOut) : clearWillChange(pageFadeOut) }); scrollTriggers.push(st5Fade); }
        }

        // --- Final Refresh ---
        ScrollTrigger.refresh();
    } // End setupScrollTriggerAnimations

    // --- Setup Hover Micro-Animations ---
    function setupHoverMicroAnimations() {
        if (isTouchDevice) return;
        // Gallery items
        galleryItems.forEach(item => { const image = item.querySelector('.gallery-image'); const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } }).to(item, { y: -4, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }).to(image, { scale: 1.03 }, 0); item.addEventListener('mouseenter', () => tl.timeScale(1).play()); item.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); });
        // Project cards (linked ones handled by CSS :hover on wrapper)
        document.querySelectorAll('.project-card:not(a > .project-card)').forEach(card => { // Only target non-linked cards
            const icon = card.querySelector('.card-icon'); const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } }).to(card, { y: -5, boxShadow: '0 12px 25px rgba(50, 100, 150, 0.15)' }); if (icon) tl.to(icon, { scale: 1.1, rotate: '-5deg' }, 0); card.addEventListener('mouseenter', () => tl.timeScale(1).play()); card.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); });
        // Draggable words
        draggableWords.forEach(word => { if (word.getAttribute('draggable') === 'true' && word.style.visibility !== 'hidden') { const tl = gsap.timeline({ paused: true, defaults: { duration: 0.2, ease: 'sine.out' } }).to(word, { scale: 1.08, filter: 'brightness(1.1)' }); word.addEventListener('mouseenter', () => tl.timeScale(1).play()); word.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); } });
    } // End setupHoverMicroAnimations

    // --- Initialize ---
    setupPasswordGate(); // Start the process

}); // End DOMContentLoaded