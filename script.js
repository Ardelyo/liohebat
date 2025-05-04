    // --- ScrollTrigger Animation Setup ---
    function setupScrollTriggerAnimations() {
        scrollTriggers.forEach(st => st.kill()); scrollTriggers = [];
        const setWillChange = (elements, value = 'transform, opacity') => gsap.set(elements, { willChange: value });
        const clearWillChange = (elements) => gsap.set(elements, { willChange: 'auto' });

        // --- Scene 1: Streetlight & Intro ---
        // ... (Scene 1 setup remains the same) ...
        if (scene1) {
            const greetingWords = scene1.querySelectorAll('.scene1-greeting .word'); const textWords = scene1.querySelectorAll('.scene1-text .word');
            const st1 = ScrollTrigger.create({ trigger: scene1, start: "top 70%", end: "bottom center", scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true, onToggle: self => self.isActive ? setWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]) : clearWillChange([greetingWords, textWords, streetlightBulb, lightBeam, lightBeamDust]), animation: gsap.timeline().to(greetingWords, { opacity: 1, y: 0, stagger: 0.06 }, 0).to(textWords, { opacity: 1, y: 0, stagger: 0.03 }, 0.1).to(streetlightBulb, { opacity: 1, ease: "sine.inOut" }, 0).to(lightBeam, { opacity: 1, scaleY: 1, ease: "sine.inOut" }, 0.05).to(lightBeamDust, { opacity: () => 0.1 + Math.random() * 0.1, ease: "sine.inOut"}, 0.15) }); scrollTriggers.push(st1);
            const stPara = ScrollTrigger.create({ trigger: scene1, start: "top top", end: "bottom top", scrub: 1.8, invalidateOnRefresh: true, animation: gsap.to(streetlight, { yPercent: -20, ease: "none" }), onToggle: self => self.isActive ? setWillChange(streetlight) : clearWillChange(streetlight) }); scrollTriggers.push(stPara);
        }

        // --- Scene 2: Gallery (HORIZONTAL SCROLL REVISED) ---
        if (scene2Wrapper && galleryTrack && galleryItems.length > 0) {
            const textBlock = scene2.querySelector('.scene2-text-block');
            const galleryTitle = scene2.querySelector('.gallery-title');

            // Text block animation (triggered once)
            if (textBlock) {
                const st2Text = ScrollTrigger.create({ trigger: textBlock, start: "top 85%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                    onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); gsap.to(self.trigger.querySelectorAll('.emphasis'), { color: "#ffc8dd", scale: 1.03, duration: 0.6, delay: 0.3, ease: "back.out(1)"}); },
                    onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto'}); }
                }); scrollTriggers.push(st2Text);
            }
            // Gallery title animation (triggered once)
            if (galleryTitle) {
                const st2Title = ScrollTrigger.create({ trigger: galleryTitle, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true,
                    onEnter: (self) => { const chars = self.trigger.querySelectorAll('.char'); setWillChange(chars); gsap.to(chars, { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, stagger: 0.03, duration: 0.6, ease: 'power2.out', overwrite: 'auto' }); },
                    onLeaveBack: (self) => { const chars = self.trigger.querySelectorAll('.char'); clearWillChange(chars); gsap.to(chars, { opacity: 0, scale: 1.4, filter: 'blur(2px)', y: 20, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }); }
                }); scrollTriggers.push(st2Title);
            }

            // ** REVISED Horizontal Scroll Setup **
            // Calculate the amount the track needs to scroll horizontally
            const getScrollAmount = () => {
                let trackWidth = galleryTrack.scrollWidth;
                // Use clientWidth for the wrapper to account for padding
                return -(trackWidth - scene2Wrapper.clientWidth);
            };

            // Create the horizontal scroll animation for the track
            const horizontalTween = gsap.to(galleryTrack, {
                x: getScrollAmount, // Move track leftwards by the overflow amount
                ease: "none",       // Linear movement
            });

            // Create the ScrollTrigger to control the horizontal scroll
            const horizontalScrub = ScrollTrigger.create({
                trigger: scene2Wrapper,         // Pin the wrapper
                start: "center center",         // Pin when center hits center
                end: () => "+=" + galleryTrack.scrollWidth, // End pin after scrolling the track's width
                pin: true,                      // Pin the trigger element
                animation: horizontalTween,     // Link the track movement animation
                scrub: HORIZONTAL_SCRUB_SMOOTHING, // Smooth scrubbing effect
                invalidateOnRefresh: true,      // Recalculate on resize
                // Opacity update based on item position relative to viewport center
                onUpdate: self => {
                    gsap.to(galleryItems, {
                        opacity: (i, target) => {
                            const itemRect = target.getBoundingClientRect();
                            // Get item center relative to the viewport left
                            const itemCenterViewportX = itemRect.left + itemRect.width / 2;
                            // Calculate distance from viewport center
                            const distFromCenter = Math.abs(itemCenterViewportX - window.innerWidth / 2);
                            // Fade out items further from the center (adjust multiplier for sensitivity)
                            return Math.max(0.4, 1 - (distFromCenter / (window.innerWidth * 0.6)));
                        },
                        ease: "none"
                    });
                },
                onToggle: self => self.isActive ? setWillChange(galleryTrack) : clearWillChange(galleryTrack),
            });
            scrollTriggers.push(horizontalScrub); // Add the main horizontal ScrollTrigger

             // Gallery item sub-animations (linked to the main horizontal tween)
             galleryItems.forEach((item) => {
                 const image = item.querySelector('.gallery-image');
                 setWillChange([item, image]); // Set will-change

                 // Subtle vertical parallax for item (linked to horizontal scroll)
                 ScrollTrigger.create({
                     trigger: item,
                     containerAnimation: horizontalTween, // Link to the GSAP tween moving the track
                     start: "left right", // When item left hits viewport right
                     end: "right left",   // When item right hits viewport left
                     scrub: 1.8,
                     animation: gsap.to(item, { yPercent: () => gsap.utils.random(-3, 3), ease: "none" }),
                 });

                 // Ken Burns effect for image (linked to horizontal scroll)
                 ScrollTrigger.create({
                      trigger: item,
                      containerAnimation: horizontalTween, // Link to the GSAP tween moving the track
                      start: "left 80%", // When item is partially visible
                      end: "right 20%",  // Before item fully leaves
                      scrub: 1.2,
                      animation: gsap.to(image, {
                         scale: 1.08,
                         xPercent: () => gsap.utils.random(-2, 2),
                         yPercent: () => gsap.utils.random(-2, 2),
                         ease: "none"
                     }),
                 });
             });
        }

        // --- Scene 3: Transition ---
        // ... (Scene 3 setup remains the same) ...
         if (scene3 && scene4 && transitionEffect) { const st3 = ScrollTrigger.create({ trigger: scene3, start: 'top top', end: 'bottom top', scrub: SCRUB_SMOOTHING, invalidateOnRefresh: true, animation: gsap.timeline().to(scene4, { clipPath: 'circle(150% at 50% 100%)', ease: 'none' }, 0).fromTo(transitionEffect, { opacity: 0 }, { opacity: 1, ease: 'sine.in' }, 0).to(transitionEffect, { opacity: 0, ease: 'sine.out' }, 0.7), onToggle: self => self.isActive ? setWillChange([scene4, transitionEffect]) : clearWillChange([scene4, transitionEffect]), }); scrollTriggers.push(st3); }


        // --- Scene 4: Project Cards ---
        // ... (Scene 4 setup remains the same) ...
        if (scene4) { const introParagraphs = scene4.querySelectorAll('.intro-paragraph'); const projectTitle = scene4.querySelector('.project-section-title'); const outroParagraph = scene4.querySelector('.outro-paragraph'); introParagraphs.forEach((p) => { const st4Intro = ScrollTrigger.create({ trigger: p, start: "top 85%", toggleActions: "play none none reverse", invalidateOnRefresh: true, onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); const strongEmphasis = self.trigger.querySelector('.strong-emphasis'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); if (strongEmphasis) { gsap.to(strongEmphasis, { scale: 1.05, filter: 'brightness(1.2)', duration: 0.6, delay: 0.4, ease: "back.out(1.5)" } ); } }, onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); const strongEmphasis = self.trigger.querySelector('.strong-emphasis'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto'}); if (strongEmphasis) { gsap.to(strongEmphasis, { scale: 0.9, filter: 'brightness(0.8)', duration: 0.4, ease: "power2.out" } ); } } }); scrollTriggers.push(st4Intro); }); if (projectTitle) { const st4SecTitle = ScrollTrigger.create({ trigger: projectTitle, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true, onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, rotationX: 0, stagger: 0.04, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }); }, onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 25, rotationX: -20, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }); } }); scrollTriggers.push(st4SecTitle); } projectCards.forEach((card) => { const st4Card = ScrollTrigger.create({ trigger: card, start: "top 88%", toggleActions: "play none none reverse", invalidateOnRefresh: true, onEnter: (self) => { const titleChars = self.trigger.querySelectorAll('.project-title .char'); const descriptionWords = self.trigger.querySelectorAll('.project-description .word'); setWillChange(self.trigger); gsap.to(self.trigger, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease:'power1.out', overwrite: 'auto' }); gsap.to(titleChars, { opacity: 1, scale: 1, y: 0, stagger: 0.015, duration: 0.5, delay: 0.1, ease: 'power1.out', overwrite: 'auto' }); gsap.to(descriptionWords, { opacity: 1, y: 0, stagger: 0.01, duration: 0.6, delay: 0.2, ease: 'power1.out', overwrite: 'auto' }); }, onLeaveBack: (self) => { const titleChars = self.trigger.querySelectorAll('.project-title .char'); const descriptionWords = self.trigger.querySelectorAll('.project-description .word'); clearWillChange(self.trigger); gsap.to(self.trigger, { opacity: 0, y: 50, scale: 0.97, duration: 0.4, ease:'power1.out', overwrite: 'auto' }); gsap.to(titleChars, { opacity: 0, scale: 1.2, y: 5, duration: 0.3, ease: 'power1.out', overwrite: 'auto' }); gsap.to(descriptionWords, { opacity: 0, y: 8, duration: 0.3, ease: 'power1.out', overwrite: 'auto' }); } }); scrollTriggers.push(st4Card); }); if (disabilitasCard) { const st4Highlight = ScrollTrigger.create({ trigger: disabilitasCard, start: "center 80%", end: "bottom 20%", toggleClass: { targets: disabilitasCard, className: "is-highlighted" }, invalidateOnRefresh: true }); scrollTriggers.push(st4Highlight); } if (outroParagraph) { const st4Outro = ScrollTrigger.create({ trigger: outroParagraph, start: "top 90%", toggleActions: "play none none reverse", invalidateOnRefresh: true, onEnter: (self) => { const words = self.trigger.querySelectorAll('.word'); setWillChange(words); gsap.to(words, { opacity: 1, y: 0, stagger: 0.02, duration: 0.8, ease: "power2.out", overwrite: 'auto' }); }, onLeaveBack: (self) => { const words = self.trigger.querySelectorAll('.word'); clearWillChange(words); gsap.to(words, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", overwrite: 'auto' }); } }); scrollTriggers.push(st4Outro); } }


        // --- Scene 5: Closing ---
        // ... (Scene 5 setup remains the same) ...
        if (scene5) { const closingWords = scene5.querySelectorAll('.closing-text .word'); const leadWords = scene5.querySelectorAll('.signature-lead .word'); const signatureChars = scene5.querySelectorAll('.signature .char'); const st5 = ScrollTrigger.create({ trigger: scene5, start: "top 40%", end: "bottom bottom", scrub: SCRUB_SMOOTHING + 0.3, invalidateOnRefresh: true, animation: gsap.timeline().to(closingWords, { opacity: 1, yPercent: 0, filter: 'blur(0px)', stagger: 0.06 }, 0).to(leadWords, { opacity: 1, yPercent: 0, stagger: 0.06 }, 0.2).to(signatureChars, { opacity: 1, scale: 1, filter: 'blur(0px)', yPercent: 0, rotationX: 0, stagger: 0.04, ease: "back.out(1.5)" }, 0.4), onToggle: self => self.isActive ? setWillChange([closingWords, leadWords, signatureChars]) : clearWillChange([closingWords, leadWords, signatureChars]), }); scrollTriggers.push(st5); if (finalScrollMessage) { const st5Msg = ScrollTrigger.create({ trigger: scene5, start: "bottom bottom-=150px", toggleActions: "play none none reverse", animation: gsap.to(finalScrollMessage, { opacity: 1, duration: 0.5 }), invalidateOnRefresh: true, onToggle: self => self.isActive ? setWillChange(finalScrollMessage) : clearWillChange(finalScrollMessage) }); scrollTriggers.push(st5Msg); } if (pageFadeOut) { const st5Fade = ScrollTrigger.create({ trigger: body, start: "bottom bottom-=50px", end: "bottom bottom", scrub: 0.5, animation: gsap.to(pageFadeOut, { opacity: 1, ease: "none" }), invalidateOnRefresh: true, onToggle: self => self.isActive ? setWillChange(pageFadeOut) : clearWillChange(pageFadeOut) }); scrollTriggers.push(st5Fade); } }


        // --- Final Refresh ---
        ScrollTrigger.refresh();
    } // End setupScrollTriggerAnimations

    // --- Setup Hover Micro-Animations ---
    // ... (Hover setup remains the same) ...
    function setupHoverMicroAnimations() { if (isTouchDevice) return; galleryItems.forEach(item => { const image = item.querySelector('.gallery-image'); const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } }).to(item, { y: -4, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }).to(image, { scale: 1.03 }, 0); item.addEventListener('mouseenter', () => tl.timeScale(1).play()); item.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); }); document.querySelectorAll('.project-card:not(a > .project-card)').forEach(card => { const icon = card.querySelector('.card-icon'); const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: 'power1.out' } }).to(card, { y: -5, boxShadow: '0 12px 25px rgba(50, 100, 150, 0.15)' }); if (icon) tl.to(icon, { scale: 1.1, rotate: '-5deg' }, 0); card.addEventListener('mouseenter', () => tl.timeScale(1).play()); card.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); }); draggableWords.forEach(word => { if (word.getAttribute('draggable') === 'true' && word.style.visibility !== 'hidden') { const tl = gsap.timeline({ paused: true, defaults: { duration: 0.2, ease: 'sine.out' } }).to(word, { scale: 1.08, filter: 'brightness(1.1)' }); word.addEventListener('mouseenter', () => tl.timeScale(1).play()); word.addEventListener('mouseleave', () => tl.timeScale(1.5).reverse()); } }); }

    // --- Initialize ---
    // setInitialStates(); // Set initial states *before* revealing content
    // setupPasswordGate(); // Start the process
    // ** Correction: Initialize password gate which THEN reveals main content **
     setupPasswordGate();

document.addEventListener('DOMContentLoaded', () => {
    // Your existing code here

    // --- Initialize ---
    // setInitialStates(); // Set initial states *before* revealing content
    // setupPasswordGate(); // Start the process
    // ** Correction: Initialize password gate which THEN reveals main content **
    setupPasswordGate();
}); // End DOMContentLoaded