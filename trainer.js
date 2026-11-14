// Chord Trainer: shows a random chord to comp on for two bars, plus the chord
// coming next. Timing runs off the Web Audio clock so the click and the beat
// highlight stay steady; the screen catches up with scheduled beats each frame.

const TRAINER_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const TRAINER_QUALITIES = [
  'maj7', 'maj9', '6', 'maj7#11',
  'm7', 'm9', 'm11', 'm6', 'm(maj7)',
  '7', '9', '13', '7sus4', '7b9', '7#9', '7#11', '7alt',
  'm7b5', 'dim7',
];

const BEATS_PER_BAR = 4;
const BARS_PER_CHORD = 2;
const BEATS_PER_CHORD = BEATS_PER_BAR * BARS_PER_CHORD;
const COUNT_IN_BEATS = BEATS_PER_BAR;
const MIN_TEMPO = 30;
const MAX_TEMPO = 300;
const LOOKAHEAD_SECONDS = 0.1;

const trainer = {
  tempo: 80,
  click: true,
  running: false,
  audio: null,
  timer: null,
  frame: null,
  beat: 0,            // beats scheduled since Start, count-in included
  nextBeatTime: 0,
  queue: [],          // scheduled beats waiting to be shown
  current: null,
  next: null,
  shown: null,        // chord pair currently drawn
};

function randomChord(avoid) {
  let chord;
  do {
    const root = TRAINER_ROOTS[Math.floor(Math.random() * TRAINER_ROOTS.length)];
    const quality = TRAINER_QUALITIES[Math.floor(Math.random() * TRAINER_QUALITIES.length)];
    chord = root + quality;
  } while (chord === avoid);
  return chord;
}

// Draw a chord as two bars: the chord on beat one, slashes after.
function drawChordBars(el, chord) {
  el.innerHTML = '';
  const slots = [chord].concat(Array(BEATS_PER_CHORD - 1).fill('/'));
  insertEightMeasures(el, slots);
}

function drawChords(current, next) {
  drawChordBars(document.getElementById('trainer-now'), current);
  drawChordBars(document.getElementById('trainer-next'), next);
  trainer.shown = current + '|' + next;
}

function highlightBeat(index) {
  document.querySelectorAll('#trainer-now .measure').forEach((el, i) => {
    el.classList.toggle('now', i === index);
  });
}

function setTempo(value) {
  const tempo = Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(Number(value) || trainer.tempo)));
  trainer.tempo = tempo;
  document.getElementById('tempo-input').value = tempo;
}

function playClick(time, strength) {
  if (!trainer.click) { return; }
  const ctx = trainer.audio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = [800, 1000, 1500][strength];
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(strength ? 0.5 : 0.3, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

// Work out what happens on the next beat and queue it for the screen.
function scheduleBeat() {
  const b = trainer.beat;
  const time = trainer.nextBeatTime;
  const event = { time };

  if (b < COUNT_IN_BEATS) {
    event.countIn = b + 1;
    playClick(time, b === 0 ? 1 : 0);
  } else {
    const k = b - COUNT_IN_BEATS;
    const beatInChord = k % BEATS_PER_CHORD;
    if (k > 0 && beatInChord === 0) {
      trainer.current = trainer.next;
      trainer.next = randomChord(trainer.current);
    }
    event.beatInChord = beatInChord;
    event.current = trainer.current;
    event.next = trainer.next;
    playClick(time, beatInChord === 0 ? 2 : (beatInChord % BEATS_PER_BAR === 0 ? 1 : 0));
  }

  trainer.queue.push(event);
  trainer.beat++;
  // Read the tempo every beat so changes apply while running.
  trainer.nextBeatTime += 60 / trainer.tempo;
}

function scheduler() {
  while (trainer.nextBeatTime < trainer.audio.currentTime + LOOKAHEAD_SECONDS) {
    scheduleBeat();
  }
}

function updateScreen() {
  const now = trainer.audio.currentTime;
  let latest = null;
  while (trainer.queue.length && trainer.queue[0].time <= now) {
    latest = trainer.queue.shift();
  }

  if (latest) {
    const countEl = document.getElementById('trainer-count');
    if (latest.countIn) {
      countEl.textContent = 'Count-in: ' + latest.countIn;
      highlightBeat(-1);
    } else {
      countEl.textContent = '';
      if (trainer.shown !== latest.current + '|' + latest.next) {
        drawChords(latest.current, latest.next);
      }
      highlightBeat(latest.beatInChord);
    }
  }

  trainer.frame = requestAnimationFrame(updateScreen);
}

function startTrainer() {
  if (trainer.running) { return; }
  if (!trainer.audio) {
    trainer.audio = new (window.AudioContext || window.webkitAudioContext)();
  }
  trainer.audio.resume();

  trainer.running = true;
  trainer.beat = 0;
  trainer.queue = [];
  trainer.nextBeatTime = trainer.audio.currentTime + 0.1;
  trainer.timer = setInterval(scheduler, 25);
  scheduler();
  trainer.frame = requestAnimationFrame(updateScreen);

  const button = document.getElementById('start-button');
  button.textContent = 'Stop';
  button.classList.add('running');
}

function stopTrainer() {
  if (!trainer.running) { return; }
  trainer.running = false;
  clearInterval(trainer.timer);
  cancelAnimationFrame(trainer.frame);
  trainer.queue = [];
  highlightBeat(-1);
  document.getElementById('trainer-count').textContent = '';

  const button = document.getElementById('start-button');
  button.textContent = 'Start';
  button.classList.remove('running');
}

// Holding a tempo button keeps changing the tempo.
function bindHoldRepeat(button, step) {
  let delay = null;
  let repeat = null;
  const stop = () => { clearTimeout(delay); clearInterval(repeat); };
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setTempo(trainer.tempo + step);
    delay = setTimeout(() => {
      repeat = setInterval(() => setTempo(trainer.tempo + step), 60);
    }, 400);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => button.addEventListener(ev, stop));
}

function initTrainer() {
  trainer.current = randomChord();
  trainer.next = randomChord(trainer.current);
  drawChords(trainer.current, trainer.next);
  setTempo(trainer.tempo);

  bindHoldRepeat(document.getElementById('tempo-down'), -1);
  bindHoldRepeat(document.getElementById('tempo-up'), 1);
  document.getElementById('tempo-input').addEventListener('change', (e) => setTempo(e.target.value));
  document.getElementById('click-toggle').addEventListener('change', (e) => { trainer.click = e.target.checked; });
  document.getElementById('start-button').addEventListener('click', () => {
    trainer.running ? stopTrainer() : startTrainer();
  });

  document.addEventListener('keydown', (e) => {
    if (document.getElementById('app-trainer').hidden) { return; }
    if (e.target.tagName === 'INPUT' && e.target.type === 'number') { return; }
    if (e.code === 'Space') {
      e.preventDefault();
      trainer.running ? stopTrainer() : startTrainer();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setTempo(trainer.tempo + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
    }
  });
}
