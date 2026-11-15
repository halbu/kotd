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

// Chord tones for each quality as scale degrees above the root. Spelling is
// worked out from the degree, so F#7#9 gets G## and Dbdim7 gets Cbb.
const CHORD_TONES = {
  'maj7':    ['1', '3', '5', '7'],
  'maj9':    ['1', '3', '5', '7', '9'],
  '6':       ['1', '3', '5', '6'],
  'maj7#11': ['1', '3', '5', '7', '#11'],
  'm7':      ['1', 'b3', '5', 'b7'],
  'm9':      ['1', 'b3', '5', 'b7', '9'],
  'm11':     ['1', 'b3', 'b7', '9', '11'],
  'm6':      ['1', 'b3', '5', '6'],
  'm(maj7)': ['1', 'b3', '5', '7'],
  '7':       ['1', '3', '5', 'b7'],
  '9':       ['1', '3', '5', 'b7', '9'],
  '13':      ['1', '3', 'b7', '9', '13'],
  '7sus4':   ['1', '4', '5', 'b7'],
  '7b9':     ['1', '3', '5', 'b7', 'b9'],
  '7#9':     ['1', '3', '5', 'b7', '#9'],
  '7#11':    ['1', '3', 'b7', '9', '#11'],
  '7alt':    ['1', '3', 'b7', '#9', 'b13'],
  'm7b5':    ['1', 'b3', 'b5', 'b7'],
  'dim7':    ['1', 'b3', 'b5', 'bb7'],
};
// LETTERS, LETTER_PCS and pitchClass come from chordprogs.js.
const LH_FLOOR = 41;   // F2: the left-hand root sits between F2 and E3
const RH_FLOOR = 62;   // D4: right-hand tones stack upward from here

const trainer = {
  tempo: 80,
  click: true,
  showNotes: false,
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

// Split a chord name like 'F#m7b5' into root and quality.
function parseChord(chord) {
  const root = chord.length > 1 && (chord[1] === 'b' || chord[1] === '#') ? chord.slice(0, 2) : chord[0];
  return { root, quality: chord.slice(root.length) };
}

// Spell one chord tone above a root, e.g. ('Eb', 'b7') -> D flat.
function spellChordTone(root, degree) {
  const alter = degree.match(/^[b#]*/)[0];
  const number = Number(degree.slice(alter.length));
  const rootLetter = LETTERS.indexOf(root[0]);
  const rootPc = pitchClass(root);
  const step = (number - 1) % 7;
  const sharps = alter.split('#').length - 1;
  const flats = alter.split('b').length - 1;
  const semis = LETTER_PCS[step] + sharps - flats;
  const letterIndex = (rootLetter + step) % 7;
  const pc = (rootPc + semis + 12) % 12;
  const offset = ((pc - LETTER_PCS[letterIndex] + 18) % 12) - 6;   // -2..2
  const acc = offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset);
  return { letter: LETTERS[letterIndex], acc, pc, offset };
}

// Lowest MIDI number at or above floor with this pitch class.
function placeAbove(pc, floor) {
  return floor + ((pc - floor) % 12 + 12) % 12;
}

// VexFlow key ('g##/4') for a spelled note at a MIDI pitch. The octave follows
// the letter, so Cb sounding as B4 is written Cb5.
function vexKey(note, midi) {
  const octave = Math.round((midi - note.offset - LETTER_PCS[LETTERS.indexOf(note.letter)]) / 12) - 1;
  return note.letter.toLowerCase() + note.acc + '/' + octave;
}

// A two-hand voicing: root in the left hand, the other tones stacked closely
// in the right hand.
function voiceChord(chord) {
  const { root, quality } = parseChord(chord);
  const notes = CHORD_TONES[quality].map((d) => spellChordTone(root, d));
  const upper = notes.slice(1)
    .map((n) => ({ note: n, midi: placeAbove(n.pc, RH_FLOOR) }))
    .sort((a, b) => a.midi - b.midi);
  return {
    bass: [{ note: notes[0], midi: placeAbove(notes[0].pc, LH_FLOOR) }],
    treble: upper,
  };
}

function staveChord(clef, tones, label, color) {
  const { StaveNote, Accidental, Annotation } = Vex.Flow;
  const note = new StaveNote({ clef, keys: tones.map((t) => vexKey(t.note, t.midi)), duration: 'w' });
  tones.forEach((t, i) => {
    if (t.note.acc) { note.addModifier(new Accidental(t.note.acc), i); }
  });
  if (label) {
    note.addModifier(new Annotation(label).setFont('Arial', 14, 'bold')
      .setVerticalJustification(Annotation.VerticalJustify.TOP), 0);
  }
  note.setStyle({ fillStyle: color, strokeStyle: color });
  return note;
}

// Draw the current and next chords as notes on a grand staff.
function drawStaff(current, next) {
  const el = document.getElementById('trainer-staff');
  el.innerHTML = '';
  if (!trainer.showNotes) { return; }

  const { Renderer, Stave, StaveConnector, Voice, Formatter } = Vex.Flow;
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(400, 250);
  const ctx = renderer.getContext();

  let x = 10;
  [[current, '#222', 210], [next, '#999', 170]].forEach(([chord, color, width], m) => {
    const treble = new Stave(x, 40, width);
    const bass = new Stave(x, 130, width);
    if (m === 0) {
      treble.addClef('treble');
      bass.addClef('bass');
    }
    treble.setContext(ctx).draw();
    bass.setContext(ctx).draw();
    if (m === 0) {
      new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
      new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
    }
    new StaveConnector(treble, bass).setType('singleRight').setContext(ctx).draw();

    const v = voiceChord(chord);
    const tv = new Voice({ num_beats: 4, beat_value: 4 }).addTickables([staveChord('treble', v.treble, chord, color)]);
    const bv = new Voice({ num_beats: 4, beat_value: 4 }).addTickables([staveChord('bass', v.bass, null, color)]);
    const formatter = new Formatter();
    formatter.joinVoices([tv]);
    formatter.joinVoices([bv]);
    formatter.formatToStave([tv, bv], treble);
    tv.draw(ctx, treble);
    bv.draw(ctx, bass);
    x += width;
  });
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
  drawStaff(current, next);
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

function setShowNotes(on) {
  trainer.showNotes = on;
  document.getElementById('notes-toggle').checked = on;
  document.getElementById('trainer-staff').hidden = !on;
  try { localStorage.setItem('trainer.showNotes', on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  if (trainer.shown) {
    const [current, next] = trainer.shown.split('|');
    drawStaff(current, next);
  }
}

function initTrainer() {
  try { trainer.showNotes = localStorage.getItem('trainer.showNotes') === '1'; } catch (e) { /* storage unavailable */ }
  trainer.current = randomChord();
  trainer.next = randomChord(trainer.current);
  drawChords(trainer.current, trainer.next);
  setTempo(trainer.tempo);

  bindHoldRepeat(document.getElementById('tempo-down'), -1);
  bindHoldRepeat(document.getElementById('tempo-up'), 1);
  document.getElementById('tempo-input').addEventListener('change', (e) => setTempo(e.target.value));
  document.getElementById('click-toggle').addEventListener('change', (e) => { trainer.click = e.target.checked; });
  document.getElementById('notes-toggle').addEventListener('change', (e) => setShowNotes(e.target.checked));
  setShowNotes(trainer.showNotes);
  document.getElementById('start-button').addEventListener('click', () => {
    trainer.running ? stopTrainer() : startTrainer();
  });

  document.addEventListener('keydown', (e) => {
    if (document.getElementById('app-trainer').hidden) { return; }
    if (e.target.tagName === 'INPUT' && e.target.type === 'number') { return; }
    if (e.code === 'Space') {
      e.preventDefault();
      trainer.running ? stopTrainer() : startTrainer();
    } else if (e.key === 'n' || e.key === 'N') {
      setShowNotes(!trainer.showNotes);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setTempo(trainer.tempo + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
    }
  });
}
