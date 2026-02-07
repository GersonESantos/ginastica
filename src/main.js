import './style.scss';
import gsap from 'gsap';

// --- Exercise Data ---
const exercises = [
  { name: "Caminhada", duration: 600, rest: 0, videoId: "enYITYwvPAQ", instructions: "Comece com 10 minutos de caminhada para aquecer." }, // 10 mins = 600s
  { name: "Agachamento Sumô", duration: 40, rest: 20, videoId: "wQWGeM5z5l0", instructions: "Pés afastados, pontas para fora. Mantenha as costas retas." },
  { name: "Afundo Alternado", duration: 40, rest: 20, videoId: "S3G7S8S6", instructions: "Joelhos a 90 graus. Alterne as pernas." }, // Placeholder ID
  { name: "Stiff", duration: 40, rest: 20, videoId: "0eUTHCFnP0w", instructions: "Joelhos levemente flexionados, desça o tronco mantendo a postura." },
  { name: "Panturrilhas (Insistindo 3x)", duration: 40, rest: 20, videoId: "Yp3T4Dk5", instructions: "Suba na ponta dos pés, insista 3 vezes em cima antes de descer." },
  { name: "Remada Curvada Supinada (4x)", duration: 40, rest: 20, videoId: "xNGcrKTFdfI", instructions: "Tronco inclinado, palmas para frente. Puxe a barra/peso em direção ao quadril. (4 séries)" },
  { name: "Rosca Direta Uni + Bilateral (4x)", duration: 40, rest: 20, videoId: "b8G9S3F2", instructions: "Uma repetição unilateral cada braço, depois uma bilateral. (4 séries)" },
  { name: "Elevação Frontal + Lateral", duration: 40, rest: 20, videoId: "L9H2K1J4", instructions: "Eleve os braços à frente, desça, eleve ao lado." },
  { name: "Pullover + Crucifixo", duration: 40, rest: 20, videoId: "_N4bQ1y0eGA", instructions: "Combine os movimentos de peito e costas." },
  { name: "Abdominal Oblíquo Sentado", duration: 40, rest: 20, videoId: "A7D5G3H2", instructions: "Sentado, gire o tronco tocando cotovelo no joelho oposto." },
  { name: "Extensão de Quadril em Pé", duration: 40, rest: 20, videoId: "E4R5T6Y7", instructions: "Leve a perna para trás contraindo o glúteo." },
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
      'onReady': onPlayerReady
    }
  });
};

function onPlayerReady(event) {
  // Player ready
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

function startTimer() {
  stopTimer(); // Clear existing
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      handleTimerComplete();
    }
  }, 1000);
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
  // Simple beep logic using AudioContext or just console log for now
  // Real implementation would use an Audio object
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.value = isResting ? 800 : 400; // Higher pitch for work start
  gainNode.gain.value = 0.1;
  
  oscillator.start();
  setTimeout(() => oscillator.stop(), 500);
}

// Start
init();
