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
    practiceMode: document.getElementById('practice-mode-btn'),
    unlockFullGame: document.getElementById('unlock-full-game-btn'),
    callPlay: document.getElementById('call-play-btn'),
    sneakerPickup: document.getElementById('sneaker-pickup'),
    leaderboard: document.getElementById('leaderboard-btn'),
    replay: document.getElementById('replay-btn'),
    learnMore: document.getElementById('learn-more-btn'),
    sneakerBack: document.getElementById('sneaker-back-btn'),
    replayDrill: document.getElementById('replay-drill-btn'),
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
};
const displays = {
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    boostIndicator: document.getElementById('boost-indicator'),
    drillStatus: document.getElementById('drill-status'),
    practiceFeedback: document.getElementById('practice-feedback'),
    performanceText: document.getElementById('performance-text'),
    analystReaction: document.getElementById('analyst-reaction'),
    fanReaction: document.getElementById('fan-reaction'),
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
        image: 'https://play.rosebud.ai/assets/basketball player.png?BrXo',
        text: "It's a timeout. Your star player just missed a crucial free throw. How do you motivate them?",
        options: [
            { text: "Yell at them for missing", correct: false, feedback: "This might crush their confidence." },
            { text: "Tell them 'Don't worry, you'll get the next one.'", correct: true, feedback: "Positive reinforcement builds confidence!" },
            { text: "Sub them out immediately", correct: false, feedback: "This could signal a lack of trust." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/african american basketball coach with black suit, whistle and clipboard.png?sKtP',
        text: "The opponent is on a fast break. What defensive scheme do you call?",
        options: [
            { text: "Full-court press", correct: false, feedback: "Risky, could lead to an easy basket if broken." },
            { text: "Man-to-man defense", correct: false, feedback: "Good, but might not stop the immediate threat." },
            { text: "Zone defense to protect the paint", correct: true, feedback: "Correct! Clog the lane and force a tough shot." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/basketball coach.png?1ZFh',
        text: "Down by 2 with 5 seconds left. What's the final play?",
        options: [
            { text: "A quick 2-point shot to tie and go to OT", correct: true, feedback: "Smart! High-percentage shot to stay in the game." },
            { text: "A desperation 3-point heave", correct: false, feedback: "Too risky! A miss means the game is over." },
            { text: "Pass to your weakest shooter", correct: false, feedback: "Why would you do that!?" }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/basketball coach.png?1ZFh',
        text: "Team 1 is down by 5 points with 2 minutes left in the 4th quarter. What is the best offensive strategy?",
        options: [
            { text: "Draw up a play for a three-point shot to quickly cut the deficit.", correct: false, feedback: "A bit risky. A miss leaves you in a tough spot." },
            { text: "Run a mid-range quick two to keep momentum and play strong defense after.", correct: false, feedback: "A good option, but doesn't stop the clock and leaves the pressure on." },
            { text: "Attack the basket for a layup and potential foul to score efficiently and stop the clock.", correct: true, feedback: "Excellent choice! High percentage, stops the clock, and puts pressure on their defense." }
        ]
    },
    {
        image: 'https://play.rosebud.ai/assets/african american basketball coach with black suit, whistle and clipboard.png?sKtP',
        text: "The Spurs are up by 3 points with 15 seconds left in the 4th quarter. The opposing team has the ball. What defensive approach makes the most sense?",
        options: [
            { text: "Play straight-up man-to-man defense and contest the three-point shot without fouling.", correct: false, feedback: "Risky! A made three ties the game. Too much can go wrong." },
            { text: "Intentionally foul before the shot to force the opponent to shoot free throws instead of attempting a tying three.", correct: true, feedback: "The 'Popovich' special! Smart move to not even allow a game-tying attempt." },
            { text: "Switch on all screens and run shooters off the three-point line, forcing a tough two-point attempt.", correct: false, feedback: "A solid strategy, but still gives them a chance to tie with a lucky shot." }
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
    
    generatePressReactions(); // Keep this for flavor
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
    
    generatePressReactions();
    switchScreen('result');
}
function generatePressReactions() {
    let analystText = '';
    let fanText = '';
    
    if (practiceStats.boostUsed) {
        if (practiceStats.earlyBoost) {
            analystText = "Bold move using the boost early! Shows aggressive coaching style.";
            fanText = "The crowd loves the early energy! Fans are hyped from the start!";
        } else if (practiceStats.lateBoost) {
            analystText = "Clutch timing on that boost! Saved it for when it mattered most.";
            fanText = "Smart coaching! Fans appreciate the strategic timing.";
        } else {
            analystText = "Well-timed boost activation. Shows good game management.";
            fanText = "Perfect moment to energize the team! Crowd erupted!";
        }
    } else {
        analystText = "Conservative approach today. Sometimes patience pays off.";
        fanText = "Fans were waiting for more energy, but respect the steady approach.";
    }
    
    if (selectedStrategy === 'strategy') {
        analystText += " The strategic focus really showed in the execution.";
    } else {
        analystText += " The motivational approach fired up the players.";
    }
    
    displays.analystReaction.textContent = analystText;
    displays.fanReaction.textContent = fanText;
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
// --- Event Listeners ---
buttons.strategyBtn.addEventListener('click', openStrategyModal);
buttons.motivationBtn.addEventListener('click', openMotivationModal);
buttons.strategyCards.forEach(card => card.addEventListener('click', selectStrategyCard));
buttons.lockInBtn.addEventListener('click', lockInStrategy);
buttons.strategyBackBtn.addEventListener('click', closeStrategyModal);
buttons.exitConfirmBtn.addEventListener('click', goToLanding);
buttons.exitResumeBtn.addEventListener('click', closeExitModalAndResume);
buttons.motivationChoiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => showSpeech(e.currentTarget.dataset.coach));
});
buttons.motivationCloseBtn.addEventListener('click', closeMotivationModal);
buttons.speechBackBtn.addEventListener('click', showMotivationChoices);
buttons.copySpeechBtn.addEventListener('click', copySpeechToClipboard);
buttons.playDemo.addEventListener('click', startGame);
buttons.sneakerDrop.addEventListener('click', () => switchScreen('sneakerDrop'));
buttons.pressReactions.addEventListener('click', () => switchScreen('pressReactions'));
buttons.practiceMode.addEventListener('click', startPracticeMode);
buttons.callPlay.addEventListener('click', callPlay);
buttons.sneakerPickup.addEventListener('click', activateBoost);
buttons.leaderboard.addEventListener('click', showLeaderboardPlaceholder);
buttons.replay.addEventListener('click', startGame);
buttons.unlockFullGame.addEventListener('click', () => alert('Full game unlocked! (Feature coming soon)'));
buttons.learnMore.addEventListener('click', () => alert('Learn more about our premium sneaker collection! (Link coming soon)'));
buttons.sneakerBack.addEventListener('click', goToLanding);
buttons.replayDrill.addEventListener('click', startPractice); // Should restart practice, not game
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
});
(async () => {
  const supabase = await loadSupabase();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log("Supabase connection test:", user, error);
  }
})();