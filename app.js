// List of musical keys. Each can be major or minor, giving 24 possible keys.
const musicalKeys = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
    'F', 'Bb', 'Eb', 'Ab'//, 'Db', 'Gb'
];

// Local calendar date as YYYY-MM-DD, so the key changes at the user's midnight.
function localDateString(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Function to get deterministic key for a date
function getKeyForDate(date) {
    const dateString = localDateString(date);

    // Create hash from date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // Use hash to select key and mode deterministically
    const choice = Math.abs(hash) % (musicalKeys.length * 2);
    const key = musicalKeys[choice % musicalKeys.length];
    return choice < musicalKeys.length ? key : key + 'm';
}

// Function to update display
function updateDisplay(today) {
    const key = getKeyForDate(today);
    const keyEl = document.getElementById('key-display');
    keyEl.textContent = key;

    document.getElementById('date-info').textContent =
        `Today is ${today.toLocaleDateString()}`;
}

let renderedDate = null;

// Draw the key, scale and chord progression for today. Only redraws when the
// date has changed since the last render.
function renderToday() {
  const today = new Date();
  const dateString = localDateString(today);
  if (dateString === renderedDate) { return; }
  renderedDate = dateString;

  updateDisplay(today);
  vexflowRender();
  addChordProg();
}

function vexflowRender() {
  const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
  
  // Create an SVG renderer and attach it to the DIV element named "output".
  const div = document.getElementById("output");
  div.innerHTML = '';
  const renderer = new Renderer(div, Renderer.Backends.SVG);
  renderer.resize(500, 150);
  const context = renderer.getContext();

  // Create a stave of width 400 at position 10, 40 on the canvas.
  const stave = new Stave(10, 40, 400);

  const todaysKey = document.getElementById('key-display').textContent;

  // Add a clef and time signature.
  stave.addClef("treble").addTimeSignature("4/4").addKeySignature(todaysKey);

  // Connect it to the rendering context and draw!
  stave.setContext(context).draw();

  // Create the notes
  // Get the scale array from the key.js file
  const [scale, accs] = generateScale(todaysKey);
  
  // console.log(`noteAndAccidentals: ${noteAndAccidentals}`);
  console.log(`ACCS: ${accs}`);

  for (var i=0; i != scale.length; i++){
    // Add a forward-slash before the final character of scale[i]
    scale[i] = scale[i].slice(0, -1) + "/" + scale[i].slice(-1);
  }

  const notes = [];

  for (var i = 0; i != scale.length; i++) {
    
    const [noteAndAccidentals, octave] = scale[i].split('/');
    let note, accidentals = '';

    if (noteAndAccidentals.length > 1) {
      [note, accidentals] = [noteAndAccidentals[0], noteAndAccidentals.slice(1)];
      if (accs.includes(noteAndAccidentals)) {
        notes.push(new StaveNote({ keys: [`${note.toLowerCase()}/${octave}`], duration: "8" }))
      } else {
        notes.push(new StaveNote({ keys: [`${note.toLowerCase()}/${octave}`], duration: "8" }).addModifier(new Accidental(accidentals)))
      }
    } else {
      notes.push(new StaveNote({ keys: [`${noteAndAccidentals.toLowerCase()}/${octave}`], duration: "8" }))
    }
  }

  const beams = Vex.Flow.Beam.generateBeams(notes, {groups : [ new Vex.Flow.Fraction(4,4) ]});

  // Create a voice in 4/4 and add above notes
  const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
  voice.addTickables(notes);

  // Format and justify the notes to 400 pixels.
  new Formatter().joinVoices([voice]).format([voice],275);

  // Render voice
  voice.draw(context, stave);
  
  beams.forEach(function(beam){
    beam.setContext(context).draw();
  });
}

// Check every minute whether the date has rolled over.
setInterval(renderToday, 60000);
