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
    function showContentFallback() { /* ... remains the same ... */
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
    const PARTICLE_COUNT = 40; // Slightly less for performance focus
    const SCRUB_SMOOTHING = 1.6; // Increased default scrub slightly more
    const HORIZONTAL_SCRUB_SMOOTHING = 2.2; // Increased for gallery

    let currentPassword = "";
    let isPasswordCorrect = false;
    let scrollTriggers = [];

    // --- Text Splitting Utilities (Run Once) ---
    function splitText() { /* ... remains the same ... */
        const splitTargets = document.querySelectorAll('.split-words, .split-lines, .split-chars');
        splitTargets.forEach(el => {
            if (el.dataset.split) return; // Avoid re-splitting
            const text = el.innerHTML;
            el.innerHTML = ''; // Clear existing content
            if (el.classList.contains('split-chars')) {
                [...text].forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.innerHTML = char === ' ' ? ' ' : char;
                    el.appendChild(span);
                });
            } else { // split-words or split-lines
                const parts = text.split(/(\s+|<[^>]*>)/g);
                let currentWord = '';
                parts.forEach(part => {
                    if (!part) return; // Skip empty parts
                    if (part.match(/^\s+$/)) { // It's a space
                        if (currentWord) { appendWord(el, currentWord); currentWord = ''; }
                        el.appendChild(document.createTextNode(part));
                    } else if (part.match(/^<[^>]*>$/)) { // It's a tag
                         if (currentWord) { appendWord(el, currentWord); currentWord = ''; }
                         el.innerHTML += part; // Append tag directly
                    } else if (part.trim().length > 0) { // It's part of a word
                        currentWord += part;
                    }
                });
                 if (currentWord) { appendWord(el, currentWord); } // Append last word
            }
            el.dataset.split = 'true';
        });
    }
    function appendWord(parent, wordHTML) { /* ... remains the same ... */
        const wordWrap = document.createElement('span');
        wordWrap.className = 'word-wrap';
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.innerHTML = wordHTML;
        wordWrap.appendChild(wordSpan);
        parent.appendChild(wordWrap);
    }

    // --- Password Gate Logic (Error Fixed) ---
    function setupPasswordGate() {
        if (!passwordGate || !dropZone || !draggableWords.length) {
            console.warn("Password gate elements missing, attempting fallback.");
            revealMainContentAndSetupAnimations();
            return;
        }

        gsap.set(draggableWords, { opacity: 1, scale: 1, y: 0 });

        draggableWords.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', e.target.dataset.word);
                    e.dataTransfer.effectAllowed = 'move';
                    gsap.to(e.target, { scale: 1.1, filter: 'brightness(1.2)', duration: 0.2 });
                    e.target.classList.add('dragging');
                    dropZone.classList.add('drag-active');
                } else { console.error("DataTransfer object not available."); }
            });
            word.addEventListener('dragend', (e) => {
                gsap.to(e.target, { scale: 1, filter: 'brightness(1)', duration: 0.2 });
                e.target.classList.remove('dragging');
                dropZone.classList.remove('drag-active');
                dropZone.classList.remove('drag-over'); // Cleanup just in case
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            dropZone.classList.remove('drag-active');

            const droppedWord = e.dataTransfer.getData('text/plain');
            if (!droppedWord) { console.error("Failed to get dataTransfer data."); return; }

            const originalElement = document.querySelector(`.draggable-word[data-word="${droppedWord}"]`);
            if (isPasswordCorrect || !originalElement || originalElement.style.visibility === 'hidden') { return; }

            // --- Process drop ---
            dropZone.classList.add('has-content');
            if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'none';
            gsap.to(originalElement, { opacity: 0, scale: 0.5, duration: 0.3, visibility: 'hidden', onComplete: () => { originalElement.setAttribute('draggable', 'false'); } });
            currentPassword += droppedWord;
            dropZone.textContent = currentPassword;

            // --- Check Password Logic ---
            if (currentPassword === CORRECT_PASSWORD) {
                passwordFeedback.textContent = "Benar! Membuka lintasan...";
                passwordFeedback.className = 'success';
                isPasswordCorrect = true;
                // ** FIX: Removed the lines causing the ReferenceError **
                // dropZone.removeEventListener('dragover', preventDefaultHandler); // NO LONGER NEEDED
                // dropZone.removeEventListener('drop', dropHandler); // NO LONGER NEEDED

                gsap.timeline() // Feedback
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
                gsap.timeline().to(dropZone, { x: 6, rotation: 0.5, duration: 0.05 }).to(dropZone, { x: -6, rotation: -0.5, duration: 0.1 }).to(dropZone, { x: 0, rotation: 0, duration: 0.05 });
                setTimeout(() => { // Reset
                    currentPassword = ""; dropZone.textContent = ""; dropZone.classList.remove('has-content');
                    if (dropZonePlaceholder) dropZonePlaceholder.style.display = 'block';
                    passwordFeedback.textContent = ""; passwordFeedback.className = '';
                    draggableWords.forEach(word => {
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
    function triggerOpeningTransition() { /* ... remains the same ... */
        gsap.timeline({ delay: 0.6 })
            .to(passwordGate, { opacity: 0, duration: 0.5, ease: "power1.in", onComplete: () => {
                passwordGate.style.display = 'none';
                playOpeningParticleAnimation();
            }});
    }
    function playOpeningParticleAnimation() { /* ... remains the same ... */
        if (!openingTransition) return;
        openingTransition.style.display = 'block';
        gsap.to(openingTransition, { opacity: 1, duration: 0.1 });
        for (let i = 0; i < PARTICLE_COUNT; i++) {
             const particle = document.createElement('div'); particle.classList.add('particle'); openingTransition.appendChild(particle);
             gsap.set(particle, { x: () => gsap.utils.random('45vw', '55vw'), y: () => gsap.utils.random('45vh', '55vh'), scale: gsap.utils.random(0.5, 1.5), opacity: 0 });
        }
        const particles = openingTransition.querySelectorAll('.particle');
        const tl = gsap.timeline({ onComplete: () => {
            gsap.to(openingTransition, { opacity: 0, duration: 0.6, ease: "power1.in", onComplete: () => {
                openingTransition.style.display = 'none'; openingTransition.innerHTML = '';
                revealMainContentAndSetupAnimations();
            }});
        }});
        tl.to(particles, { x: () => gsap.utils.random(-20, window.innerWidth + 20), y: () => gsap.utils.random(-20, window.innerHeight + 20), scale: () => gsap.utils.random(0.5, 3), rotation: () => gsap.utils.random(-360, 360), opacity: () => gsap.utils.random(0.3, 0.8), backgroundColor: () => gsap.utils.random(['#a2d2ff', '#bde0fe', '#ffafcc', '#ffc8dd', '#cdb4db']), duration: 2.0, stagger: 0.01, ease: "expo.out" })
        .to(particles, { opacity: 0, scale: 0, duration: 1.0, stagger: 0.005, ease: "power1.in" }, "-=0.8");
    }

    // --- Reveal Main Content & Setup Scroll Animations ---
    function revealMainContentAndSetupAnimations() { /* ... remains the same ... */
         if (!mainContent) return;
         splitText();
         gsap.set(mainContent, { visibility: 'visible' });
         gsap.to(mainContent, { opacity: 1, duration: 1.0, ease: "sine.out" });
         body.style.overflowY = 'auto';
         requestAnimationFrame(() => {
             setupScrollTriggerAnimations();
              if (document.getElementById('scene-1')) {
                 gsap.from("#scene-1", { opacity: 0, y: 30, duration: 0.8, ease: "power2.out", delay: 0.2 });
              }
             // Add hover effects *after* initial reveal/setup
             setupHoverMicroAnimations();
             gsap.delayedCall(0.3, () => ScrollTrigger.refresh());
         });
    }

    // --- ScrollTrigger Animation Setup ---
    function setupScrollTriggerAnimations() {
        scrollTriggers.forEach(st => st.kill());
        scrollTriggers = [];
        const setWillChange = (elements, value = 'transform, opacity') => gsap.set(elements, { willChange: value });
        const clearWillChange = (elements) => gsap.set(elements, { willChange: 'auto' });

        // --- Scene 1: Streetlight & Intro (Stable Version) ---
        const scene1 = document.getElementById('scene-1');
        if (scene1) { /* ... Scene 1 ScrollTrigger setup remains the same ... */
            const greetingWords = scene1.querySelectorAll('.scene1-greeting .word'); const textWords = scene1.querySelectorAll('.scene1-text .word');
            setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust, streetlight]);
            const st1 = ScrollTrigger.create({ trigger: scene1, start: "top top", end: "bottom center", scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true,
                onEnter: () => setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]), onLeave: () => clearWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]),
                onEnterBack: () => setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]), onLeaveBack: () => clearWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]),
                animation: gsap.timeline().from(greetingWords, { opacity: 0, yPercent: 50, rotationX: -10, stagger: 0.06 }, 0) .from(textWords, { opacity: 0, yPercent: 30, stagger: 0.03 }, 0.1) .to(streetlightBulb, { opacity: 1, ease: "sine.inOut" }, 0) .to(lightBeam, { opacity: 1, scaleY: 1, ease: "sine.inOut" }, 0.05) .to(lightBeamDust, { opacity: () => 0.1 + Math.random() * 0.1, ease: "sine.inOut"}, 0.15)
            }); scrollTriggers.push(st1);
            const stPara = ScrollTrigger.create({ trigger: scene1, start: "top top", end: "bottom top", scrub: 1.8, invalidateOnRefresh: true, animation: gsap.to(streetlight, { yPercent: -20, ease: "none" }),
                onEnter: () => setWillChange(streetlight), onLeave: () => clearWillChange(streetlight), onEnterBack: () => setWillChange(streetlight), onLeaveBack: () => clearWillChange(streetlight),
            }); scrollTriggers.push(stPara);
        }

        // --- Scene 2: Gallery (Stable Version) ---
        if (scene2Wrapper && galleryTrack && galleryItems.length > 0) { /* ... Scene 2 ScrollTrigger setup remains the same ... */
            const textBlockWords = document.querySelectorAll('.scene2-text-block .word'); const galleryTitleChars = document.querySelectorAll('.gallery-title .char');
            setWillChange([textBlockWords, galleryTitleChars, galleryTrack, galleryItems, galleryImages]);
            const st2Text = ScrollTrigger.create({ trigger: ".scene2-text-block", start: "top 85%", toggleActions: "play none none none", invalidateOnRefresh: true,
                onEnter: (self) => { setWillChange(textBlockWords); gsap.from(textBlockWords, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); gsap.to(self.trigger.querySelectorAll('.emphasis'), { color: "#ffc8dd", scale: 1.03, duration: 0.6, delay: 0.3, ease: "back.out(1)"}); },
                 onLeaveBack: () => { clearWillChange(textBlockWords); }
            }); scrollTriggers.push(st2Text);
            const st2Title = ScrollTrigger.create({ trigger: ".gallery-title", start: "top 90%", toggleActions: "play none none none", invalidateOnRefresh: true,
                onEnter: () => { setWillChange(galleryTitleChars); gsap.from(galleryTitleChars, { opacity: 0, scale: 1.4, filter: 'blur(2px)', y: 20, stagger: 0.03, duration: 0.6, ease: 'power2.out', overwrite: 'auto' }); },
                onLeaveBack: () => clearWillChange(galleryTitleChars)
            }); scrollTriggers.push(st2Title);
            let galleryWidth = galleryTrack.scrollWidth; let scrollDistance = galleryWidth - window.innerWidth;
            const horizontalScrub = gsap.to(galleryTrack, { x: () => -scrollDistance, ease: "none",
                scrollTrigger: { trigger: scene2Wrapper, start: "center center", end: () => `+=${galleryWidth * 0.8}`, scrub: HORIZONTAL_SCRUB_SMOOTHING, pin: true, pinSpacing: true, invalidateOnRefresh: true, anticipatePin: 0.5,
                      onUpdate: self => { let progress = self.progress; gsap.to(galleryItems, { opacity: (i, target) => { const itemRect = target.getBoundingClientRect(); const distFromCenter = Math.abs(itemRect.left + itemRect.width / 2 - window.innerWidth / 2); return Math.max(0.4, 1 - (distFromCenter / (window.innerWidth * 0.6))); }, ease: "none" }); },
                    onEnter: () => setWillChange(galleryTrack), onLeave: () => clearWillChange(galleryTrack), onEnterBack: () => setWillChange(galleryTrack), onLeaveBack: () => clearWillChange(galleryTrack),
                }
            }); scrollTriggers.push(horizontalScrub.scrollTrigger);
             galleryItems.forEach((item, index) => {
                 const image = item.querySelector('.gallery-image'); setWillChange([item, image]);
                 gsap.to(item, { yPercent: () => gsap.utils.random(-5, 5), ease: "none", scrollTrigger: { containerAnimation: horizontalScrub, trigger: item, start: "left right", end: "right left", scrub: 2.5 } });
                 gsap.to(image, { scale: 1.1, xPercent: () => gsap.utils.random(-3, 3), yPercent: () => gsap.utils.random(-3, 3), ease: "none", scrollTrigger: { containerAnimation: horizontalScrub, trigger: item, start: "left 80%", end: "right 20%", scrub: 1.5 } });
             });
        }

        // --- Scene 3: Transition (Stable Version) ---
        if (scene3 && scene4 && transitionEffect) { /* ... Scene 3 ScrollTrigger setup remains the same ... */
            setWillChange([scene4, transitionEffect]);
             const st3 = ScrollTrigger.create({ trigger: scene3, start: 'top top', end: 'bottom top', scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true,
                animation: gsap.timeline() .to(scene4, { clipPath: 'circle(150% at 50% 100%)', ease: 'none' }, 0) .fromTo(transitionEffect, { opacity: 0 }, { opacity: 1, ease: 'sine.in' }, 0) .to(transitionEffect, { opacity: 0, ease: 'sine.out' }, 0.7),
                 onEnter: () => setWillChange([scene4, transitionEffect]), onLeave: () => clearWillChange([scene4, transitionEffect]), onEnterBack: () => setWillChange([scene4, transitionEffect]), onLeaveBack: () => clearWillChange([scene4, transitionEffect]),
            }); scrollTriggers.push(st3);
        }

        // --- Scene 4: Project Cards (Stable Version) ---
        if (scene4) { /* ... Scene 4 ScrollTrigger setup remains the same ... */
            const introParagraphs = document.querySelectorAll('#scene-4 .intro-paragraph'); const projectTitle = document.querySelector('.project-section-title'); const projectCards = document.querySelectorAll('.project-card'); const outroParagraph = document.querySelector('#scene-4 .outro-paragraph');
            setWillChange([introParagraphs, projectTitle, projectCards, outroParagraph]);
             introParagraphs.forEach((p, i) => {
                const words = p.querySelectorAll('.word'); const strongEmphasis = p.querySelector('.strong-emphasis');
                 const st4Intro = ScrollTrigger.create({ trigger: p, start: "top 85%", toggleActions: "play none none none", invalidateOnRefresh: true,
                     onEnter: () => { setWillChange(words); gsap.from(words, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); if (strongEmphasis) { gsap.fromTo(strongEmphasis, { scale: 0.9, filter: 'brightness(0.8)' }, { scale: 1.05, filter: 'brightness(1.2)', duration: 0.6, delay: 0.4, ease: "back.out(1.5)" } ); } },
                      onLeaveBack: () => clearWillChange(words)
                 }); scrollTriggers.push(st4Intro);
             });
            const st4SecTitle = ScrollTrigger.create({ trigger: projectTitle, start: "top 90%", toggleActions: "play none none none", invalidateOnRefresh: true,
                onEnter: () => { const words = projectTitle.querySelectorAll('.word'); setWillChange(words); gsap.from(words, { opacity: 0, y: 25, rotationX: -20, stagger: 0.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }); },
                onLeaveBack: () => clearWillChange(projectTitle.querySelectorAll('.word'))
            }); scrollTriggers.push(st4SecTitle);
             projectCards.forEach((card) => {
                const titleChars = card.querySelectorAll('.project-title .char'); const descriptionWords = card.querySelectorAll('.project-description .word');
                // Note: will-change for hover is handled in setupHoverMicroAnimations
                 const st4Card = ScrollTrigger.create({ trigger: card, start: "top 88%", toggleActions: "play none none none", invalidateOnRefresh: true,
                     onEnter: () => { setWillChange(card); gsap.from(card, { opacity: 0, y: 50, scale: 0.97, duration: 0.6, ease:'power1.out', overwrite: 'auto' }); gsap.from(titleChars, { opacity: 0, scale: 1.2, y: 5, stagger: 0.015, duration: 0.5, delay: 0.1, ease: 'power1.out', overwrite: 'auto' }); gsap.from(descriptionWords, { opacity: 0.1, y: 8, stagger: 0.01, duration: 0.6, delay: 0.2, ease: 'power1.out', overwrite: 'auto' }); },
                     onLeave: () => clearWillChange(card), // Clear will-change after entry anim
                     onEnterBack: () => setWillChange(card), // Re-add if scrolling back
                     onLeaveBack: () => clearWillChange(card)
                 }); scrollTriggers.push(st4Card);
             });
            if (disabilitasCard) {
                const st4Highlight = ScrollTrigger.create({ trigger: disabilitasCard, start: "center 80%", end: "bottom 20%", toggleClass: { targets: disabilitasCard, className: "is-highlighted" }, invalidateOnRefresh: true });
                scrollTriggers.push(st4Highlight);
            }
             const st4Outro = ScrollTrigger.create({ trigger: outroParagraph, start: "top 90%", toggleActions: "play none none none", invalidateOnRefresh: true,
                 onEnter: () => { const words = outroParagraph.querySelectorAll('.word'); setWillChange(words); gsap.from(words, { opacity: 0.1, y: 10, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); },
                 onLeaveBack: () => clearWillChange(outroParagraph.querySelectorAll('.word'))
             }); scrollTriggers.push(st4Outro);
        }

        // --- Scene 5: Closing (Stable Version) ---
        const scene5 = document.getElementById('scene-5');
        if (scene5) { /* ... Scene 5 ScrollTrigger setup remains the same ... */
            const closingWords = scene5.querySelectorAll('.closing-text .word'); const leadWords = scene5.querySelectorAll('.signature-lead .word'); const signatureChars = scene5.querySelectorAll('.signature .char');
            setWillChange([closingWords, leadWords, signatureChars, finalScrollMessage]);
            const st5 = ScrollTrigger.create({ trigger: scene5, start: "top 40%", end: "bottom bottom", scrub: SCRUB_SMOOTHING + 0.3, invalidateOnRefresh: true,
                animation: gsap.timeline() .from(closingWords, { opacity: 0.05, yPercent: 15, filter: 'blur(0.5px)', stagger: 0.06 }, 0) .from(leadWords, { opacity: 0.05, yPercent: 15, stagger: 0.06 }, 0.2) .from(signatureChars, { opacity: 0, scale: 1.5, filter: 'blur(3px)', yPercent: 20, rotationX: -30, stagger: 0.04, ease: "back.out(1.5)" }, 0.4),
                 onEnter: () => setWillChange([closingWords, leadWords, signatureChars]), onLeave: () => clearWillChange([closingWords, leadWords, signatureChars]), onEnterBack: () => setWillChange([closingWords, leadWords, signatureChars]), onLeaveBack: () => clearWillChange([closingWords, leadWords, signatureChars]),
            }); scrollTriggers.push(st5);
            const st5Msg = ScrollTrigger.create({ trigger: scene5, start: "bottom bottom-=150px", toggleActions: "play none none reverse", animation: gsap.to(finalScrollMessage, { opacity: 1, duration: 0.5 }), invalidateOnRefresh: true,
                onEnter: () => setWillChange(finalScrollMessage), onLeave: () => clearWillChange(finalScrollMessage), onEnterBack: () => setWillChange(finalScrollMessage), onLeaveBack: () => clearWillChange(finalScrollMessage),
            }); scrollTriggers.push(st5Msg);
             if(pageFadeOut) {
                const st5Fade = ScrollTrigger.create({ trigger: body, start: "bottom bottom-=50px", end: "bottom bottom", scrub: 0.5, animation: gsap.to(pageFadeOut, { opacity: 1, ease: "none" }), invalidateOnRefresh: true,
                    onEnter: () => setWillChange(pageFadeOut), onLeave: () => clearWillChange(pageFadeOut), onEnterBack: () => setWillChange(pageFadeOut), onLeaveBack: () => clearWillChange(pageFadeOut),
                }); scrollTriggers.push(st5Fade);
             }
        }

        // --- Final Refresh ---
        ScrollTrigger.refresh();

    } // End setupScrollTriggerAnimations

    // --- Setup Hover Micro-Animations ---
    function setupHoverMicroAnimations() {
        if (isTouchDevice) return; // Don't add hover effects on touch devices

        // Gallery Items Hover
        galleryItems.forEach(item => {
            const image = item.querySelector('.gallery-image');
            const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } });
            tl.to(item, { y: -4, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' })
              .to(image, { scale: 1.03 }, 0); // Scale image slightly more on hover

            item.addEventListener('mouseenter', () => tl.timeScale(1).play());
            item.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse());
        });

        // Project Cards Hover
        projectCards.forEach(card => {
             const icon = card.querySelector('.card-icon');
             const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } });
             tl.to(card, { y: -5, boxShadow: '0 12px 25px rgba(50, 100, 150, 0.15)' });
              if(icon) {
                  tl.to(icon, { scale: 1.1, rotate: '-5deg' }, 0); // Animate icon too
              }

             card.addEventListener('mouseenter', () => tl.timeScale(1).play());
             card.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse());
        });

         // Draggable Words Hover (Subtle scale)
         draggableWords.forEach(word => {
             const tl = gsap.timeline({ paused: true, defaults: { duration: 0.2, ease: 'sine.out' } });
             tl.to(word, { scale: 1.08, filter: 'brightness(1.1)' });

             word.addEventListener('mouseenter', () => tl.timeScale(1).play());
             word.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse());
         });
    } // End setupHoverMicroAnimations

    // --- Initialize ---
    setupPasswordGate(); // Start the process

}); // End DOMContentLoaded