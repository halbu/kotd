function keyToIndex(k) {
  // 0 is C. 1 through 7 are the flat keys. 8 through 14 are the sharp keys.
  return ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'].indexOf(k);
}

function generateScale(scaleKey) {
  let keyIsRandom = 1, keyIndex = -1, keyIsMinor = false;

  if (scaleKey !== undefined) {
    keyIsRandom = false;
    if (typeof scaleKey === 'string') {
      if (scaleKey.charAt(scaleKey.length - 1) === 'm') { // Key is minor
        scaleKey = scaleKey.slice(0, -1);
        keyIsMinor = true;
      }
      keyIndex = keyToIndex(scaleKey);
    } else {
      throw new Error(`Invalid key format. Provide a string of the form 'A', 'F#', 'Ebm', etc.`);
    }
  } else {
    keyIndex = Math.floor(Math.random() * 15);
    keyIsMinor = Math.random() < 0.5; // Randomly decide if the scale is minor.
  }

  return convertKeyToScale(keyIndex, keyIsMinor); // Call the key-to-scale conversion function.
}

function convertKeyToScale(keyIdx, keyIsMinor) {
  var SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // Unaltered C major scale degrees.
  var ACCS = []; // Array to hold accidentals.

  const c5flats = [ 'B', 'E', 'A', 'D', 'G', 'C', 'F' ]
  const flatKeys = [ 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb' ]
  const c5sharps = [ 'F', 'C', 'G', 'D', 'A', 'E', 'B' ]
  const sharpKeys = [ 'G', 'D', 'A', 'E', 'B', 'F#', 'C#' ]

  if (keyIdx > 0) {
    const accidentals = keyIdx <= 7 ? c5flats : c5sharps;
    const modifier = keyIdx <= 7 ? 'b' : '#';
    
    for (let i = 0; i < (keyIdx <= 7 ? keyIdx : keyIdx - 7); i++) {
        for (let j = 0; j < SCALE.length; j++) {
            if (SCALE[j] === accidentals[i]) {
              SCALE[j] += modifier;
            }
        }
    }
  }

  let root = keyIdx === 0 ? 'C' : (keyIdx <= 7) ? flatKeys[keyIdx-1] : sharpKeys[keyIdx-8];

  // Rearrange the new scale with accidentals to start at the root note.
  const rootIndex = SCALE.indexOf(root);
  SCALE = SCALE.slice(rootIndex).concat(SCALE.slice(0, rootIndex));

  SCALE.push(root); // Add the root again to the top of the scale.

  if (keyIsMinor) {
    root = root + 'm';
    [2, 5, 6].forEach((i) => { SCALE[i] = (SCALE[i].endsWith('#') ? SCALE[i].slice(0, -1) : SCALE[i] + 'b') })
  }

  // Push all accidentals into a convenience array.
  for (let j = 0; j < SCALE.length; j++) {
    if (SCALE[j].length > 1) {
      ACCS.push(SCALE[j]);
    }
  }

  // Add octave numbers to the notes. We start in the fourth octave for all scales.
  let oct = 4;
  for (i = 0; i < SCALE.length; i++) {
    if (i > 0 && SCALE[i].charAt(0) === 'C') { oct++; }
    SCALE[i] = SCALE[i] + oct;
  }

  console.log(`Key: ${root}\n\nScale is : ${SCALE.join(', ')}`);
  return [SCALE, ACCS];
}