import './style.scss';
import gsap from 'gsap';

// --- Exercise Data ---
const exercises = [
  { name: "Caminhada", duration: 600, rest: 0, videoId: "vxdlB3SnkGQ", instructions: "Comece com 10 minutos de caminhada para aquecer." }, // 10 mins = 600s
  { name: "Agachamento Sumô", duration: 30, rest: 20, videoId: "v-UWXZVE-LE", instructions: "Pés afastados, pontas para fora. Mantenha as costas retas." },
  { name: "Afundo Alternado", duration: 30, rest: 20, videoId: "HDHPoojaea4", instructions: "Joelhos a 90 graus. Alterne as pernas." },
  { name: "Stiff", duration: 30, rest: 20, videoId: "3bFsRPWZMfk", instructions: "Joelhos levemente flexionados, desça o tronco mantendo a postura." },
  { name: "Panturrilhas (Insistindo 3x)", duration: 30, rest: 20, videoId: "TM_SXzY-qbk", instructions: "Suba na ponta dos pés, insista 3 vezes em cima antes de descer." },
  { name: "Remada Curvada Supinada (4x)", duration: 30, rest: 20, videoId: "TD00shuX6hA", instructions: "Tronco inclinado, palmas para frente. Puxe a barra/peso em direção ao quadril. (4 séries)" },
  { name: "Rosca Direta Uni + Bilateral (4x)", duration: 30, rest: 20, videoId: "fvSQWdFTRIo", instructions: "Uma repetição unilateral cada braço, depois uma bilateral. (4 séries)" },
  { name: "Elevação Frontal + Lateral", duration: 30, rest: 20, videoId: "BVjcSE2my4w", instructions: "Eleve os braços à frente, desça, eleve ao lado." },
  { name: "Pullover + Crucifixo", duration: 30, rest: 20, videoId: "r2Zebn1JFqk", instructions: "Combine os movimentos de peito e costas." },
  { name: "Abdominal Oblíquo Sentado", duration: 30, rest: 20, videoId: "V7RaxNF4aUA", instructions: "Sentado, gire o tronco tocando cotovelo no joelho oposto." },
  { name: "Extensão de quadril com caneleira", duration: 30, rest: 20, videoId: "NNXxKNhBb9Q", instructions: "Leve a perna para trás contraindo o glúteo." },
  { name: "Alongamentos Finais", duration: 300, rest: 0, videoId: "d9e0Q-jB_8E", instructions: "Relaxe e alongue todos os músculos trabalhados." }
];

// --- State ---
let currentExerciseIndex = 0;
let isResting = false;
let timeLeft = 0;
let timerInterval = null;
let isPaused = true;
let youtubePlayer = null;

// --- DOM Elements ---
const timerDisplay = document.getElementById('timer');
const statusLabel = document.getElementById('status-label');
const exerciseNameEl = document.getElementById('exercise-name');
const exerciseInstructionEl = document.getElementById('exercise-instruction');
const exerciseListEl = document.getElementById('exercise-list');
const startBtn = document.getElementById('start-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const videoOverlay = document.getElementById('video-overlay');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');

// --- Initialization ---
function init() {
  renderExerciseList();
  loadYoutubeAPI();
  updateUI(false);
  
  // Event Listeners
  startBtn.addEventListener('click', startWorkout);
  playPauseBtn.addEventListener('click', togglePlayPause);
  nextBtn.addEventListener('click', nextExercise);
  prevBtn.addEventListener('click', prevExercise);
}

// --- YouTube API ---
function loadYoutubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Global callback for YouTube API
window.onYouTubeIframeAPIReady = function() {
  const firstVideoId = exercises[0].videoId;
  youtubePlayer = new YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
    videoId: firstVideoId,
    playerVars: {
      'playsinline': 1,
      'controls': 1,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
};

function onPlayerReady(event) {
  // Player ready
}

function onPlayerStateChange(event) {
  // If video ends (state=0), play again
  if (event.data === 0) {
    youtubePlayer.playVideo();
  }
}

function loadVideo(videoId) {
  if (youtubePlayer && youtubePlayer.loadVideoById) {
    youtubePlayer.loadVideoById(videoId);
  }
}

// --- Logic ---

function renderExerciseList() {
  exerciseListEl.innerHTML = '';
  exercises.forEach((ex, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="indicator"></div>
      <div class="info">
        <strong>${ex.name}</strong>
        <span>${formatTime(ex.duration)}</span>
      </div>
    `;
    li.addEventListener('click', () => jumpToExercise(index));
    exerciseListEl.appendChild(li);
  });
}

function updateUI(animate = true) {
  const ex = exercises[currentExerciseIndex];
  
  // Update Text
  if (isResting) {
    exerciseNameEl.textContent = "Descanso";
    exerciseInstructionEl.textContent = `Próximo: ${exercises[currentExerciseIndex + 1]?.name || 'Fim'}`;
    statusLabel.textContent = "Respire fundo...";
    document.body.style.setProperty('--primary-color', '#4facfe'); // Blue for rest
  } else {
    exerciseNameEl.textContent = ex.name;
    exerciseInstructionEl.textContent = ex.instructions;
    statusLabel.textContent = "EM EXECUÇÃO";
    document.body.style.setProperty('--primary-color', '#ff0080'); // Pink/Red for action
  }
  
  // Highlight List Item
  const listItems = exerciseListEl.children;
  Array.from(listItems).forEach((item, idx) => {
    item.classList.remove('active');
    if (idx === currentExerciseIndex) item.classList.add('active');
  });

  // Animations (GSAP)
  if (animate) {
    gsap.fromTo(timerDisplay, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
    gsap.fromTo(exerciseNameEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
  }

  updateTimerDisplay();
}

function startWorkout() {
  videoOverlay.classList.add('hidden');
  isPaused = false;
  
  // Start the first exercise
  currentExerciseIndex = 0;
  isResting = false;
  timeLeft = exercises[0].duration;
  
  updateUI();
  updatePlayPauseIcon();
  startTimer();
  
  // Play video
  if (youtubePlayer && youtubePlayer.playVideo) {
    youtubePlayer.playVideo();
  }
}

function togglePlayPause() {
  isPaused = !isPaused;
  updatePlayPauseIcon();
  
  if (isPaused) {
    stopTimer();
    if (youtubePlayer && youtubePlayer.pauseVideo) youtubePlayer.pauseVideo();
  } else {
    startTimer();
    if (youtubePlayer && youtubePlayer.playVideo) youtubePlayer.playVideo();
  }
}

function updatePlayPauseIcon() {
  if (isPaused) {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  } else {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  }
}

function nextExercise() {
  if (isResting) {
    // Skip rest, go to next exercise
    currentExerciseIndex++;
    if (currentExerciseIndex >= exercises.length) {
      finishWorkout();
      return;
    }
    isResting = false;
    timeLeft = exercises[currentExerciseIndex].duration;
    loadVideo(exercises[currentExerciseIndex].videoId);
  } else {
    // Skip exercise, go to rest (if exists)
    if (exercises[currentExerciseIndex].rest > 0) {
      isResting = true;
      timeLeft = exercises[currentExerciseIndex].rest;
    } else {
      // If no rest, go straight to next
      currentExerciseIndex++;
      if (currentExerciseIndex >= exercises.length) {
        finishWorkout();
        return;
      }
      isResting = false;
      timeLeft = exercises[currentExerciseIndex].duration;
      loadVideo(exercises[currentExerciseIndex].videoId);
    }
  }
  updateUI();
  if(!isPaused) startTimer(); // Ensure timer continues if not paused
}

function prevExercise() {
  if (currentExerciseIndex > 0) {
    currentExerciseIndex--;
    isResting = false;
    timeLeft = exercises[currentExerciseIndex].duration;
    loadVideo(exercises[currentExerciseIndex].videoId);
    updateUI();
  }
}

function jumpToExercise(index) {
  currentExerciseIndex = index;
  isResting = false;
  timeLeft = exercises[index].duration;
  loadVideo(exercises[index].videoId);
  // If overlay is still up, user clicked list before starting, so just update info
  if (!videoOverlay.classList.contains('hidden')) {
     updateUI();
  } else {
     // If workout running/paused, update and maybe play
     updateUI();
     if(!isPaused) startTimer();
     if(youtubePlayer) youtubePlayer.loadVideoById(exercises[index].videoId);
  }
}

let targetEndTime = 0;

function startTimer() {
  stopTimer(); // Clear existing
  // Calculate target end time based on current timeLeft
  targetEndTime = Date.now() + (timeLeft * 1000);
  
  timerInterval = setInterval(() => {
    const now = Date.now();
    const diff = Math.ceil((targetEndTime - now) / 1000);
    
    if (diff >= 0) {
      // Only update if time changed (prevent flickering if checking fast)
      if (timeLeft !== diff) {
        timeLeft = diff;
        updateTimerDisplay();
      }
    }
    
    if (diff <= 0) {
      handleTimerComplete();
    }
  }, 200); // Check more frequently (every 200ms) to ensure accuracy
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function handleTimerComplete() {
  stopTimer();
  playNotificationSound();
  
  if (isResting) {
    // Rest finished -> Next Exercise
    currentExerciseIndex++;
    if (currentExerciseIndex >= exercises.length) {
      finishWorkout();
      return;
    }
    isResting = false;
    timeLeft = exercises[currentExerciseIndex].duration;
    loadVideo(exercises[currentExerciseIndex].videoId);
    if(youtubePlayer) youtubePlayer.playVideo(); // Auto play next video
  } else {
    // Exercise finished -> Rest (if applicable)
    if (exercises[currentExerciseIndex].rest > 0) {
      isResting = true;
      timeLeft = exercises[currentExerciseIndex].rest;
      // Optionally pause video during rest
      // if(youtubePlayer) youtubePlayer.pauseVideo(); 
    } else {
      // No rest, straight to next
      currentExerciseIndex++;
      if (currentExerciseIndex >= exercises.length) {
        finishWorkout();
        return;
      }
      timeLeft = exercises[currentExerciseIndex].duration;
      loadVideo(exercises[currentExerciseIndex].videoId);
      if(youtubePlayer) youtubePlayer.playVideo();
    }
  }
  updateUI();
  startTimer();
}

function finishWorkout() {
  stopTimer();
  exerciseNameEl.textContent = "Treino Concluído!";
  exerciseInstructionEl.textContent = "Parabéns por finalizar seu treino de hoje.";
  timerDisplay.textContent = "FIM";
  statusLabel.textContent = "Meta atingida";
  playPauseBtn.disabled = true;
  videoOverlay.classList.remove('hidden');
  startBtn.textContent = "Reiniciar";
  startBtn.onclick = () => location.reload();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Visual alert for last 5 seconds
  if (timeLeft <= 5 && timeLeft > 0) {
    timerDisplay.style.color = '#ff0000';
  } else {
    timerDisplay.style.color = 'var(--text-white)';
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function playNotificationSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create oscillator and gain node
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  // Configure sound
  oscillator.type = 'triangle'; // More "beep-like" than sine
  
  // Frequency logic:
  // If isResting=true -> Rest ending -> High pitch (start exercise!)
  // If isResting=false -> Exercise ending -> Low pitch (rest time)
  oscillator.frequency.value = isResting ? 880 : 440; 
  
  // Volume control (envelope)
  const now = context.currentTime;
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
  // Play
  oscillator.start(now);
  oscillator.stop(now + 0.5);
}

// Start
init();
