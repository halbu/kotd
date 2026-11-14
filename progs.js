// This code defines a set of chord progressions for a music application. Each
// progression is an object with a description and a sequence of chords. Each
// chord is represented as an array of two elements: the root and the type of
// chord (e.g., 'maj7', 'm9', etc.). The root is represented as a Roman numeral
// (e.g., 'I', 'II', etc.). Lowercase numerals to indicate minor chords are not
// used here as the quality is already dictated by the chord type. The sequence
// is an array of arrays, where each inner array represents a measure of the
// progression. If any of the 'sequence' arrays contain only one chord, it will
// be repeated to fill the measure.

let chordProgressions = [
  {
    description: 'Planing minor ninths',
    sequence: [
      [[ 'I', 'm9' ], [ 'I', 'm9' ], [ 'I', 'm9' ], [ 'bII', 'm9' ]],
      [[ 'I', 'm9' ], [ 'I', 'm9' ], [ 'I', 'm9' ], [ 'bII', 'm9' ]],
      [[ 'II', 'm9' ], [ 'II', 'm9' ], [ 'II', 'm9' ], [ 'bIII', 'm9' ]],
      [[ 'II', 'm9' ], [ 'II', 'm9' ], [ 'II', 'm9' ], [ 'bII', 'm9' ]],
    ]
  },
  {
    description: 'Descending in thirds',
    sequence: [
      [[ 'I', 'm11' ]],
      [[ 'bVI', 'maj7#11' ]],
      [[ 'IV', 'm11' ]],
      [[ 'bII', 'maj7' ]],
    ]
  },
  {
    description: 'One I made up',
    sequence: [
      [[ 'I', 'm7' ], [ 'I', 'm7' ], [ 'I', 'm7' ], [ 'I', 'm7' ]], 
      [[ 'IV', 'm7' ], [ 'IV', 'm7' ], [ 'bIII', 'maj7' ], [ 'bIII', 'maj7' ]],
      [[ 'bVI', 'maj7' ], [ 'bVI', 'maj7' ], [ 'bVI', 'maj7' ], [ 'bVI', 'maj7' ]],
      [[ 'V', '7' ], [ 'V', '7' ], [ 'V', '7' ], [ 'V', '7' ]], 
    ]
  },
  {
    description: 'Stolen from reddit', // https://old.reddit.com/r/jazztheory/comments/10xilmz/understanding_jazz_minor_key_chord_progressions/
    sequence: [
      [[ 'I', 'm7' ]], 
      [[ 'bVI', 'maj7' ]],
      [[ 'II', 'm7b5' ]],
      [[ 'V', 'm7' ], [ 'V', 'm7' ], [ 'V', '7#9' ], [ 'V', '7#9' ]]
    ]
  },
  {
    description: 'To and from parallel major with backdoor',
    sequence: [
      [[ 'I', 'm13' ], [ 'I', 'm13' ], [ 'I', 'm13' ], [ 'III', '7#5#9' ]], 
      [[ 'IV', 'm9' ]],
      [[ 'bVII', '9' ]],
      [[ 'I', 'maj7' ]]
    ]
  }
];