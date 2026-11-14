const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Keys whose signatures use flats. C and Am are included because the sample
// progressions lean on flattened degrees, which read better as flats.
const FLAT_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
  'Am', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm'];

function pitchClass(note) {
  let pc = LETTER_PCS[LETTERS.indexOf(note[0])];
  for (const acc of note.slice(1)) { pc += acc === '#' ? 1 : -1; }
  return (pc + 12) % 12;
}

// Spell the root of a Roman-numeral degree (e.g. 'bVI') relative to a tonic
// (e.g. 'D'). The letter follows the scale degree, so bII of D is Eb rather
// than D#. Double sharps/flats fall back to the plain enharmonic name.
function spellDegree(tonic, roman, preferFlats) {
  const numeral = roman.replace(/^[b#]/, '');
  const step = NUMERALS.indexOf(numeral);
  const letterIdx = (LETTERS.indexOf(tonic[0]) + step) % 7;
  const letter = LETTERS[letterIdx];
  const target = (pitchClass(tonic) + chordMap[roman]) % 12;

  let diff = (target - LETTER_PCS[letterIdx] + 12) % 12;
  if (diff > 6) { diff -= 12; }

  if (Math.abs(diff) > 1) {
    return (preferFlats ? flatChrom : sharpChrom)[target];
  }
  return letter + (diff === 1 ? '#' : diff === -1 ? 'b' : '');
}

function addChordProg() {
  const key = document.getElementById('key-display').textContent;
  const tonic = key.endsWith('m') ? key.slice(0, -1) : key;
  const preferFlats = FLAT_KEYS.includes(key);

  const progData = chordProgressions[Math.floor(Math.random() * chordProgressions.length)];
  const seq = progData.sequence;
  let prog = [];

  // Convert the chords from our random progression into the appropriate key.
  // A bar with a single chord is repeated to fill all four beats.
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      const [roman, quality] = seq[i].length === 1 ? seq[i][0] : seq[i][j];
      prog.push(spellDegree(tonic, roman, preferFlats) + quality);
    }
  }

  prog = prog.map((chord, i) => (i > 0 && chord === prog[i - 1]) ? '/' : chord);

  const chartEl = document.getElementById('chord-chart');
  chartEl.innerHTML = '';
  insertEightMeasures(chartEl, prog.slice(0, 8));
  insertEightMeasures(chartEl, prog.slice(8, 16));

  document.getElementById('d1').textContent = progData.description;
}

// Append one row of eight slots (two groups of four) to the chart.
function insertEightMeasures(chartEl, chords) {
  const slot = (chord) =>
    `<div class="measure ${chord === '/' ? 'repeat' : 'chord'}">${chord}</div>`;
  const group = (four) => `
    <div class="progBox">
      ${four.map(slot).join(`
      <div class="vertical-lines-intermediate intermediate"><span></span></div>`)}
      <div class="vertical-lines right"><span></span></div>
    </div>`;

  chartEl.insertAdjacentHTML('beforeend', `
    <div class="chord-chart-container">
      <div class="vertical-lines right"><span></span></div>
      ${group(chords.slice(0, 4))}
      ${group(chords.slice(4, 8))}
    </div>`);
}
