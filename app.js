
// List of musical keys
const musicalKeys = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
    'F', 'Bb', 'Eb', 'Ab'//, 'Db', 'Gb'
];

// Function to get deterministic key for a date
function getKeyForDate(date) {
    // Convert date to string format YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];
    
    // Create hash from date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // Use hash to select key deterministically
    // return musicalKeys[Math.abs(hash % musicalKeys.length)];
    let randomKey = musicalKeys[Math.random() * musicalKeys.length | 0]; // Randomly select a key for demonstration
    randomKey = randomKey + (Math.random() < 0.5 ? 'm' : ''); // Randomly decide if the key is minor
    return randomKey;
}

// Function to update display
function updateDisplay() {
    const today = new Date();
    const key = getKeyForDate(today);
    const keyEl = document.getElementById('key-display');
    keyEl.textContent = key;

    document.getElementById('date-info').textContent = 
        `Today is ${today.toLocaleDateString()}`;
}

function vexflowRender() {
  const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
  
  // Create an SVG renderer and attach it to the DIV element named "output".
  const div = document.getElementById("output");
  const renderer = new Renderer(div, Renderer.Backends.SVG);

  // Configure the rendering context.
  renderer.resize(500, 500);
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

// Update display initially
updateDisplay();

// Update display when date changes (every minute)
setInterval(updateDisplay, 60000);