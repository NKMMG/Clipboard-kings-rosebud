// ===============================
// Supabase config for Clipboard Kings
// ===============================
const SUPABASE_URL = 'Enter your Supabase project URL';
const SUPABASE_ANON_KEY = 'Enter your Supabase anon API key';
const APP_NAME = window.APP_NAME || 'ClipboardKings';
async function loadSupabase() {
    if (SUPABASE_URL === 'Enter your Supabase project URL' || SUPABASE_ANON_KEY === 'Enter your Supabase anon API key') {
        console.warn('Supabase credentials are not set. Backend features will be disabled.');
        return null;
    }
    if (!window.supabase) {
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    // Define a custom fetch wrapper that adds a custom header using APP_NAME.
    const customFetch = async (input, init = {}) => {
        init.headers = {
            ...init.headers,
            'x-custom-user-agent': APP_NAME
        };
        return fetch(input, init);
    };
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { fetch: customFetch });
}
// ===============================

import { playSound } from './audio.js';
let backButton = null; // To hold the dynamically created back button
// --- DOM Elements ---
const screens = {
    landing: document.getElementById('landing-screen'),
    practice: document.getElementById('practice-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    sneakerDrop: document.getElementById('sneaker-drop-screen'),
    pressReactions: document.getElementById('press-reactions-screen'),
};
const buttons = {
    strategyBtn: document.getElementById('strategy-btn'),
    motivationBtn: document.getElementById('motivation-btn'),
    playDemo: document.getElementById('play-demo-btn'),
    sneakerDrop: document.getElementById('sneaker-drop-btn'),
    pressReactions: document.getElementById('press-reactions-btn'),
    unlockFullGame: document.getElementById('unlock-full-game-btn'),
    callPlay: document.getElementById('call-play-btn'),
    sneakerPickup: document.getElementById('sneaker-pickup'),
    leaderboard: document.getElementById('leaderboard-btn'),
    replay: document.getElementById('replay-btn'),
    learnMore: document.getElementById('learn-more-btn'),
    sneakerBack: document.getElementById('sneaker-back-btn'),
    pressBack: document.getElementById('press-back-btn'),
    backToHomeResults: document.getElementById('back-to-home-results-btn'),
    strategyModal: document.getElementById('strategy-modal'),
    strategyCards: document.querySelectorAll('.strategy-card'),
    lockInBtn: document.getElementById('lock-in-btn'),
    strategyBackBtn: document.getElementById('strategy-back-btn'),
    motivationModal: document.getElementById('motivation-modal'),
    motivationSelectionView: document.getElementById('motivation-selection-view'),
    motivationSpeechView: document.getElementById('motivation-speech-view'),
    motivationChoiceBtns: document.querySelectorAll('.motivation-choices .btn-choice'),
    motivationCloseBtn: document.getElementById('motivation-close-btn'),
    speechTitle: document.getElementById('speech-title'),
    speechText: document.getElementById('speech-text'),
    copySpeechBtn: document.getElementById('copy-speech-btn'),
    speechBackBtn: document.getElementById('speech-back-btn'),
    exitConfirmModal: document.getElementById('exit-confirm-modal'),
    exitConfirmBtn: document.getElementById('exit-confirm-btn'),
    exitResumeBtn: document.getElementById('exit-resume-btn'),
    pauseGameBtn: document.getElementById('pause-game-btn'),
    pauseModal: document.getElementById('pause-modal'),
    resumeGameBtn: document.getElementById('resume-game-btn'),
    quitGameBtn: document.getElementById('quit-game-btn'),
};
const displays = {
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    boostIndicator: document.getElementById('boost-indicator'),
    drillStatus: document.getElementById('drill-status'),
    practiceFeedback: document.getElementById('practice-feedback'),
    performanceText: document.getElementById('performance-text'),
    gameTimer: document.getElementById('game-timer'),
    gameScore: document.getElementById('game-score'),
    scenarioImage: document.getElementById('scenario-image'),
    scenarioText: document.getElementById('scenario-text'),
    optionsContainer: document.getElementById('options-container'),
    feedback: document.getElementById('feedback'),
    focusDisplay: document.getElementById('focus-display'),
};
const gameElements = {
    player1: document.getElementById('player1'),
    player2: document.getElementById('player2'),
    basketball: document.getElementById('basketball'),
    sneakerPickup: document.getElementById('sneaker-pickup'),
};
// --- Game State ---
let score = 0;
let timeLeft = 30; // Shared timer for both modes
let timerInterval = null;
let isBoostActive = false;
let boostTimeLeft = 0;
let sneakerCooldown = 0;
let callPlayCooldown = 0;
let selectedStrategy = null;
let gameFocus = null; // For strategy focus
let practiceStats = {
    totalCalls: 0,
    boostUsed: false,
    earlyBoost: false,
    lateBoost: false,
};
let gameScore = 0;
let currentQuestionIndex = 0;
let questionTimeLeft = 25; // Time per question
let questionTimerInterval = null;
let isGamePaused = false;
const sampleQuestions = [
    {
        image: 'https://play.rosebud.ai/assets/Shammgod 1.jpeg?VEwv',
        text: "Your team looks sloppy with turnovers. As Coach Shammgod, what’s the best way to sharpen their ball security in practice?",
        options: [
            { text: "Run intense dribbling drills under pressure.", correct: true, feedback: "Correct! Pressure builds skill." },
            { text: "Focus on shooting mechanics instead of dribbling.", correct: false, feedback: "Incorrect. Ball security is key." },
            { text: "Cut practice short and save energy for the game.", correct: false, feedback: "Incorrect. Practice makes perfect." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/shammgod 2.webp?XYyU',
        text: "A defender is pressuring your point guard full-court. What Shammgod-style strategy do you give him?",
        options: [
            { text: "Use a hesitation and crossover to create space.", correct: true, feedback: "That's the Shammgod way!" },
            { text: "Throw a risky long pass up the court.", correct: false, feedback: "Too risky, could lead to a turnover." },
            { text: "Stand still and wait for help.", correct: false, feedback: "Too passive, you must be assertive." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/Shammgod 3.webp?uUl3',
        text: "A young guard keeps losing the ball under pressure. What advice would Shammgod give?",
        options: [
            { text: "Keep working on ball-handling moves every day.", correct: true, feedback: "Correct. Repetition is the father of learning." },
            { text: "Avoid dribbling altogether and pass immediately.", correct: false, feedback: "That avoids the problem, doesn't solve it." },
            { text: "Focus only on strength training.", correct: false, feedback: "Strength helps, but skill is essential." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/Shammgod 4.png?BPDH',
        text: "Shammgod’s legendary move changed how players see ball handling. In today’s game, what’s the value of that skill?",
        options: [
            { text: "Breaking down defenders and creating plays.", correct: true, feedback: "Exactly. It's about creating opportunities." },
            { text: "Looking flashy without purpose.", correct: false, feedback: "Style must have substance." },
            { text: "Wasting energy instead of playing defense.", correct: false, feedback: "It's an efficient tool when used right." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/Shammgod 5.png?wkuA',
        text: "Your team is up by 3 with 30 seconds left. The opponent’s best defender pressures your ball-handler. What’s the Shammgod way?",
        options: [
            { text: "Trust your handle, control tempo, protect the rock.", correct: true, feedback: "Smart and secure. The championship mentality." },
            { text: "Launch a quick contested three.", correct: false, feedback: "Unnecessary risk. Control the clock." },
            { text: "Stand still and wait for the double-team.", correct: false, feedback: "Invites pressure and potential turnovers." }
        ]
    }
];
const speeches = {
    popovich: {
        name: "Gregg Popovich – Spurs (Direct, No-Nonsense, Team-First)",
        text: "Look, it’s not about you. It’s not about me. It’s about us. We’ve put in the work. We’ve moved the ball, trusted each other, and defended as a unit all year long. So don’t go out there trying to be the hero. The hero is the pass, the rebound, the rotation on defense. Stay disciplined, stay connected, and the game will take care of itself. Don’t complicate it. Do your job, do it together, and let’s finish this the right way."
    },
    riley: {
        name: "Pat Riley – Showtime Lakers & Heat (Intensity, Fire, Pressure as Privilege)",
        text: "This is what you live for! Pressure? That’s not pressure. Pressure is somebody who doesn’t know how they’re going to pay rent tomorrow. This—this is opportunity! You’ve worked too hard, too long, to let this slip away. Push the pace, impose your will, make them bend to your tempo. Every possession is ours to win. Dominate the moment, and history will remember how you closed it."
    },
    jackson: {
        name: "Phil Jackson – Bulls & Lakers (Zen Master, Calm, Big-Picture Focus)",
        text: "Breathe. Center yourselves. Don’t chase the game—let the game come to you. Remember: basketball is a dance, a rhythm. When we move together, when the ball flows, when we trust the triangle, the game opens. Forget the noise, forget the clock. Just be here, now, in this moment. Play free, play connected, and the result will take care of itself. Trust in each other—and trust in the journey."
    }
};
const pressArticles = [
  {
    id: "sr-shammgod-nitro2",
    title: "PUMA All-Pro NITRO 2 “God Shammgod”",
    source: "Sole Retriever",
    date: "2024",
    url: "https://www.soleretriever.com/sneaker-release-dates/puma/other/puma-all-pro-nitro-2-god-shammgod-312308-01",
    summary: "Coverage of the Shammgod-branded PUMA All-Pro NITRO 2 release.",
    thumbnail: "https://rosebud.ai/assets/press-sole-retriever.png?v=1",
    fallback:  "https://play.rosebud.ai/assets/basketball player.png?BrXo"
  },
  {
    id: "nba-magic-staff",
    title: "Orlando Magic add Joe Prunty and God Shammgod to coaching staff",
    source: "NBA.com",
    date: "July 11, 2025",
    url: "https://www.nba.com/magic/news/orlando-magic-add-joe-prunty-and-god-shammgod-to-coaching-staff-20250711",
    summary: "Team announcement highlighting Shammgod’s role on the Magic’s coaching staff.",
    thumbnail: "https://rosebud.ai/assets/press-nba-com.png?v=1",
    fallback:  "https://play.rosebud.ai/assets/basketball player.png?BrXo"
  }
];
// --- Functions ---
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
    updateBackButtonVisibility(screenName);
}
function selectStrategy(strategy) {
    selectedStrategy = strategy;
    buttons.strategyBtn.classList.remove('selected');
    buttons.motivationBtn.classList.remove('selected');
    
    if (strategy === 'strategy') {
        buttons.strategyBtn.classList.add('selected');
    } else {
        buttons.motivationBtn.classList.add('selected');
    }
}
function startGame() {
    gameScore = 0;
    currentQuestionIndex = 0;
    displays.gameScore.textContent = gameScore;
    switchScreen('game');
    playSound('start');
    // Shuffle questions for variety each playthrough
    sampleQuestions.sort(() => Math.random() - 0.5);
    loadQuestion(currentQuestionIndex);
}
function loadQuestion(index) {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    displays.gameTimer.parentElement.classList.remove('urgent');
    if (index >= sampleQuestions.length) {
        endGame();
        return;
    }
    startQuestionTimer();
    const question = sampleQuestions[index];
    displays.scenarioImage.src = question.image;
    displays.scenarioText.textContent = question.text;
    displays.optionsContainer.innerHTML = '';
    question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option.text;
        button.onclick = (event) => handleAnswer(option, event.target);
        displays.optionsContainer.appendChild(button);
    });
}
function handleAnswer(option, targetButton = null) {
    clearInterval(questionTimerInterval);
    // Disable buttons to prevent multiple answers
    const buttons = displays.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);
    if (option) { // If an answer was provided (not a timeout)
        if (option.correct) {
            gameScore += 100;
            displays.gameScore.textContent = gameScore;
            showFeedback(option.feedback, 'var(--correct-color)');
            playSound('correct');
            if (targetButton) targetButton.classList.add('correct');
        } else {
            showFeedback(option.feedback, 'var(--incorrect-color)');
            playSound('incorrect');
            if (targetButton) targetButton.classList.add('incorrect');
        }
    } else { // Timer ran out
        showFeedback("Time's up! A great coach makes decisions under pressure.", 'var(--incorrect-color)');
        playSound('incorrect');
    }
    // Go to next question after a delay
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }, 2000);
}
function startQuestionTimer() {
    questionTimeLeft = 25;
    displays.gameTimer.textContent = questionTimeLeft;
    isGamePaused = false;
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    questionTimerInterval = setInterval(() => {
        if (isGamePaused) return; // Don't count down if paused
        questionTimeLeft--;
        displays.gameTimer.textContent = questionTimeLeft;
        
        if (questionTimeLeft <= 5) {
            displays.gameTimer.parentElement.classList.add('urgent');
        }
        if (questionTimeLeft <= 10 && questionTimeLeft > 0) {
            playSound('tick');
        } else if (questionTimeLeft <= 0) {
            clearInterval(questionTimerInterval);
            handleAnswer(null); // Timeout is like a wrong answer
        }
    }, 1000);
}
function togglePause() {
    isGamePaused = !isGamePaused;
    if (isGamePaused) {
        buttons.pauseModal.classList.remove('hidden');
        if (questionTimerInterval) clearInterval(questionTimerInterval); // Explicitly clear to be safe
    } else {
        buttons.pauseModal.classList.add('hidden');
        startQuestionTimer(); // This will resume the timer logic
    }
}
function endGame() {
    clearInterval(questionTimerInterval);
    displays.gameTimer.parentElement.classList.remove('urgent');
    playSound('end');
    displays.finalScore.textContent = gameScore;
    
    let performanceText = "You've completed the demo! You have what it takes to be a Clipboard King.";
    if (gameScore >= 200) {
        performanceText += " Great instincts, coach!";
    } else if (gameScore > 0) {
        performanceText += " Solid start!";
    } else {
        performanceText += " Every coach has to start somewhere. Try again!";
    }
    displays.performanceText.textContent = performanceText;
    
    switchScreen('result');
}
function startPractice() {
    if (!selectedStrategy) {
        selectedStrategy = 'strategy'; // Default
    }
    
    // Reset game state
    score = 0;
    timeLeft = 60;
    isBoostActive = false;
    boostTimeLeft = 0;
    sneakerCooldown = 0;
    callPlayCooldown = 0;
    practiceStats = {
        totalCalls: 0,
        boostUsed: false,
        earlyBoost: false,
        lateBoost: false,
    };
    
    updateScore(0);
    updateBoostDisplay();
    switchScreen('practice');
    playSound('start');
    startPracticeTimer();
    startPlayerDrills();
    showSneakerAfterDelay();
}
function startPracticeMode() {
    // Reset state for a fresh practice session
    score = 0;
    isBoostActive = false;
    boostTimeLeft = 0;
    sneakerCooldown = 0;
    callPlayCooldown = 0;
    
    updateScore(0);
    updateBoostDisplay();
    switchScreen('practice');
    playSound('start');
    // Hide timer elements as this is a free-play mode
    document.getElementById('timer-container').style.display = 'none';
    // Start cooldown counters and player animations
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (callPlayCooldown > 0) callPlayCooldown--;
        if (sneakerCooldown > 0) sneakerCooldown--;
        
        if (isBoostActive) {
            boostTimeLeft--;
            if (boostTimeLeft <= 0) {
                deactivateBoost();
            }
        }
        
        updateCallPlayButton();
        updateSneakerVisibility();
    }, 1000);
    startPlayerDrills(true); // Continuous drills
    showSneakerAfterDelay();
}
function startPracticeTimer() {
    // Ensure timer is visible for timed mode
    document.getElementById('timer-container').style.display = 'block';
    displays.timer.textContent = timeLeft;
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        displays.timer.textContent = timeLeft;
        
        // Update cooldowns and boost
        if (callPlayCooldown > 0) callPlayCooldown--;
        if (sneakerCooldown > 0) sneakerCooldown--;
        
        if (isBoostActive) {
            boostTimeLeft--;
            if (boostTimeLeft <= 0) {
                deactivateBoost();
            }
        }
        
        updateCallPlayButton();
        updateSneakerVisibility();
        
        if (timeLeft <= 0) {
            endPractice();
        } else if (timeLeft <= 10) {
            playSound('tick');
        }
    }, 1000);
}
function callPlay() {
    if (callPlayCooldown > 0) return;
    
    const points = isBoostActive ? 20 : 10;
    updateScore(points);
    practiceStats.totalCalls++;
    
    callPlayCooldown = 1; // 1 second cooldown
    
    // Camera push-in effect (visual feedback)
    showPracticeFeedback(isBoostActive ? 'BOOSTED CALL! +20' : 'GREAT CALL! +10', 'var(--correct-color)');
    playSound(isBoostActive ? 'bigScore' : 'correct');
    
    // Animate players
    animatePlayers();
}
function activateBoost() {
    if (isBoostActive || sneakerCooldown > 0) return;
    
    isBoostActive = true;
    boostTimeLeft = 10; // 10 seconds
    sneakerCooldown = 25; // 15s cooldown + 10s boost duration
    practiceStats.boostUsed = true;
    
    // Track boost timing
    if (timeLeft > 45) {
        practiceStats.earlyBoost = true;
    } else if (timeLeft < 20) {
        practiceStats.lateBoost = true;
    }
    
    updateBoostDisplay();
    gameElements.sneakerPickup.classList.add('hidden');
    showPracticeFeedback('BOOST ACTIVATED! x2 POINTS!', 'var(--primary-color)');
    playSound('streakBonus');
}
function deactivateBoost() {
    isBoostActive = false;
    boostTimeLeft = 0;
    updateBoostDisplay();
}
function updateBoostDisplay() {
    if (isBoostActive) {
        displays.boostIndicator.textContent = `${boostTimeLeft}s`;
        displays.boostIndicator.className = 'boost-on';
    } else {
        displays.boostIndicator.textContent = 'OFF';
        displays.boostIndicator.className = 'boost-off';
    }
}
function updateCallPlayButton() {
    buttons.callPlay.disabled = callPlayCooldown > 0;
    if (callPlayCooldown > 0) {
        buttons.callPlay.textContent = `Call Play (${callPlayCooldown}s)`;
    } else {
        buttons.callPlay.textContent = 'Call Play';
    }
}
function showSneakerAfterDelay() {
    setTimeout(() => {
        if (sneakerCooldown === 0 && !isBoostActive) {
            gameElements.sneakerPickup.classList.remove('hidden');
        }
    }, 5000); // Show after 5 seconds initially
}
function updateSneakerVisibility() {
    if (sneakerCooldown === 0 && !isBoostActive) {
        gameElements.sneakerPickup.classList.remove('hidden');
    } else {
        gameElements.sneakerPickup.classList.add('hidden');
    }
}
function startPlayerDrills(isContinuous = false) {
    // Simple drill animation
    const drillInterval = setInterval(() => {
        if (!isContinuous && timeLeft <= 0) {
             clearInterval(drillInterval);
             return;
        }
        if (screens.practice.classList.contains('active')) {
            // Move players around randomly
            const positions = ['20%', '40%', '60%', '80%'];
            gameElements.player1.style.left = positions[Math.floor(Math.random() * positions.length)];
            gameElements.player2.style.right = positions[Math.floor(Math.random() * positions.length)];
        } else {
            clearInterval(drillInterval);
        }
    }, 3000);
}
function animatePlayers() {
    // Quick animation when call play is pressed
    gameElements.player1.style.transform = 'scale(1.1)';
    gameElements.player2.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
        gameElements.player1.style.transform = 'scale(1)';
        gameElements.player2.style.transform = 'scale(1)';
    }, 200);
}
function updateScore(points) {
    score += points;
    displays.score.textContent = score;
    if (points > 0) {
        displays.score.classList.add('animate-score');
        setTimeout(() => displays.score.classList.remove('animate-score'), 400);
    }
}
function showPracticeFeedback(text, color) {
    const feedbackEl = displays.practiceFeedback;
    feedbackEl.textContent = text;
    feedbackEl.style.backgroundColor = color;
    feedbackEl.classList.add('show');
    
    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 1500);
}
function endPractice() {
    clearInterval(timerInterval);
    playSound('end');
    displays.finalScore.textContent = score; // This score is from practice mode
    
    // Generate performance text
    let performanceText = '';
    if (score >= 200) {
        performanceText = 'Outstanding coaching performance! Your team is championship ready.';
    } else if (score >= 100) {
        performanceText = 'Solid coaching decisions. Your players are improving rapidly.';
    } else {
        performanceText = 'Good effort, coach. Keep practicing to master your timing.';
    }
    displays.performanceText.textContent = performanceText;
    
    switchScreen('result');
}
function showLeaderboardPlaceholder() {
    alert('Leaderboard coming soon! Your score: ' + (score || gameScore));
}
function goToLanding() {
    clearInterval(timerInterval);
    clearInterval(questionTimerInterval);
    displays.gameTimer.parentElement.classList.remove('urgent');
    // Restore timer visibility for other modes
    document.getElementById('timer-container').style.display = 'block';
    switchScreen('landing');
}
function showFeedback(text, color) {
    const feedbackEl = displays.feedback;
    feedbackEl.textContent = text;
    feedbackEl.style.backgroundColor = color;
    feedbackEl.classList.add('show');

    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 1800); // Slightly longer to read feedback
}
// --- Strategy Modal Logic ---
function openStrategyModal() {
    buttons.strategyModal.classList.remove('hidden');
}
function closeStrategyModal() {
    buttons.strategyModal.classList.add('hidden');
    // Reset selection state
    buttons.strategyCards.forEach(c => c.classList.remove('selected'));
    buttons.lockInBtn.disabled = true;
}
function selectStrategyCard(e) {
    buttons.strategyCards.forEach(c => c.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
    buttons.lockInBtn.disabled = false;
}
function lockInStrategy() {
    const selected = document.querySelector('.strategy-card.selected');
    if (selected) {
        gameFocus = selected.dataset.focus;
        displays.focusDisplay.textContent = `Focus: ${gameFocus}`;
        displays.focusDisplay.classList.remove('hidden');
    }
    closeStrategyModal();
}
// --- Motivation Modal Logic ---
function openMotivationModal() {
    buttons.motivationModal.classList.remove('hidden');
    buttons.motivationSelectionView.classList.remove('hidden');
    buttons.motivationSpeechView.classList.add('hidden');
}
function closeMotivationModal() {
    buttons.motivationModal.classList.add('hidden');
}
function showSpeech(coach) {
    const speechData = speeches[coach];
    if (speechData) {
        buttons.speechTitle.textContent = speechData.name;
        
        // Animate text reveal
        buttons.speechText.innerHTML = '';
        const words = speechData.text.split(' ');
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.style.animationDelay = `${index * 0.02}s`;
            buttons.speechText.appendChild(span);
        });
        buttons.motivationSelectionView.classList.add('hidden');
        buttons.motivationSpeechView.classList.remove('hidden');
    }
}
function showMotivationChoices() {
    buttons.motivationSpeechView.classList.add('hidden');
    buttons.motivationSelectionView.classList.remove('hidden');
}
function copySpeechToClipboard() {
    const textToCopy = buttons.speechText.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = buttons.copySpeechBtn.textContent;
        buttons.copySpeechBtn.textContent = 'Copied!';
        setTimeout(() => {
             buttons.copySpeechBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy speech: ', err);
    });
}
// --- Universal Back Button Logic ---
function createBackButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-back-home';
    button.textContent = 'Back';
    button.setAttribute('aria-label', 'Back');
    button.style.display = 'none'; // Initially hidden
    document.getElementById('game-container').appendChild(button);
    backButton = button;
    backButton.addEventListener('click', handleBackAction);
}
function updateBackButtonVisibility(screenName) {
    if (screenName === 'landing') {
        backButton.style.display = 'none';
    } else {
        backButton.style.display = 'block';
    }
}
function handleBackAction() {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) {
        goToLanding();
        return;
    }
    const screenId = activeScreen.id;
    if (screenId === 'game-screen') {
        isGamePaused = true;
        buttons.exitConfirmModal.classList.remove('hidden');
    } else {
        goToLanding();
    }
}
function closeExitModalAndResume() {
    buttons.exitConfirmModal.classList.add('hidden');
    isGamePaused = false;
}
// --- Press Reactions Logic ---
function showPressReactions() {
    const container = document.getElementById('press-articles-container');
    container.innerHTML = ''; // Clear previous articles
    pressArticles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.setAttribute('role', 'link');
        card.tabIndex = 0;
        
        card.innerHTML = `
            <img src="${article.thumbnail}" alt="${article.title}" class="article-thumbnail" loading="lazy">
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-meta">${article.source} ${article.date ? `&bull; ${article.date}` : ''}</p>
                <p class="article-summary">${article.summary}</p>
                <div class="article-actions">
                    <button class="btn btn-primary read-article-btn">Read Article</button>
                    <button class="btn-copy-link">Copy link</button>
                </div>
            </div>
        `;
        
        const openArticle = () => window.open(article.url, '_blank', 'noopener');
        
        card.addEventListener('click', openArticle);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') openArticle();
        });
        
        card.querySelector('.read-article-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event from firing too
            openArticle();
        });
        
        card.querySelector('.btn-copy-link').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(article.url).then(() => {
                showToast('Link copied!');
            });
        });
        // Add a robust error handler for the image thumbnail
        const img = card.querySelector('.article-thumbnail');
        img.onerror = () => {
            // First failure: try the fallback URL
            img.src = article.fallback;
            // Second failure: if the fallback also fails, hide the image
            img.onerror = () => {
                img.style.display = 'none';
            };
        };
        
        container.appendChild(card);
    });
    switchScreen('pressReactions');
}
function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
// --- Event Listeners ---
buttons.strategyBtn.addEventListener('click', openStrategyModal);
buttons.motivationBtn.addEventListener('click', openMotivationModal);
buttons.strategyCards.forEach(card => card.addEventListener('click', selectStrategyCard));
buttons.lockInBtn.addEventListener('click', lockInStrategy);
buttons.strategyBackBtn.addEventListener('click', closeStrategyModal);
buttons.exitConfirmBtn.addEventListener('click', goToLanding);
buttons.exitResumeBtn.addEventListener('click', closeExitModalAndResume);
buttons.pauseGameBtn.addEventListener('click', togglePause);
buttons.resumeGameBtn.addEventListener('click', togglePause);
buttons.quitGameBtn.addEventListener('click', () => {
    buttons.pauseModal.classList.add('hidden');
    goToLanding();
});
buttons.motivationChoiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => showSpeech(e.currentTarget.dataset.coach));
});
buttons.motivationCloseBtn.addEventListener('click', closeMotivationModal);
buttons.speechBackBtn.addEventListener('click', showMotivationChoices);
buttons.copySpeechBtn.addEventListener('click', copySpeechToClipboard);
buttons.playDemo.addEventListener('click', startGame);
buttons.sneakerDrop.addEventListener('click', () => switchScreen('sneakerDrop'));
buttons.pressReactions.addEventListener('click', showPressReactions);
buttons.callPlay.addEventListener('click', callPlay);
buttons.sneakerPickup.addEventListener('click', activateBoost);
buttons.leaderboard.addEventListener('click', showLeaderboardPlaceholder);
buttons.replay.addEventListener('click', startGame);
buttons.unlockFullGame.addEventListener('click', () => alert('Full game unlocked! (Feature coming soon)'));
buttons.learnMore.addEventListener('click', () => alert('Learn more about our premium sneaker collection! (Link coming soon)'));
buttons.sneakerBack.addEventListener('click', goToLanding);
buttons.pressBack.addEventListener('click', goToLanding);
buttons.backToHomeResults.addEventListener('click', goToLanding);
// --- Initial Setup ---
// --- Initial Setup ---
createBackButton();
switchScreen('landing');
selectStrategy('strategy'); // Default selection
// Handle ESC key for modals
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!buttons.strategyModal.classList.contains('hidden')) {
            closeStrategyModal();
        }
        if (!buttons.motivationModal.classList.contains('hidden')) {
            if (!buttons.motivationSpeechView.classList.contains('hidden')) {
                showMotivationChoices();
            } else {
                closeMotivationModal();
            }
        }
        if (!buttons.exitConfirmModal.classList.contains('hidden')) {
            closeExitModalAndResume();
        }
    }
    if (e.key === 'p' && screens.game.classList.contains('active')) {
        togglePause();
    }
});
(async () => {
  const supabase = await loadSupabase();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log("Supabase connection test:", user, error);
  }
})();