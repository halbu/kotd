function addChordProg() {
  // Get root
  const keyEl = document.getElementById('key-display');
  let myKey = keyEl.textContent;
  if (myKey.endsWith('m')) {
    myKey = myKey.slice(0, -1);
  }
  let chrom = (myKey.length === 1 || myKey.endsWith('b')) ? flatChrom : sharpChrom;
  let rootIdx = chrom.indexOf(myKey);
  console.log(`Root index: ${rootIdx}`);

  let progData = chordProgressions[Math.floor(Math.random() * chordProgressions.length)];

  let seq = progData.sequence;
  let desc = progData.description;
  let prog = [];

  // Convert the chords from our random progression into the appropriate key
  for (var i = 0; i != 4; ++i) {
    if (seq[i].length === 1) {
      for (var j = 0; j != 4; ++j) { prog.push(romanToChord(seq[i][0], chrom)); }
    } else {
      for (var j = 0; j != 4; ++j) {
        prog.push(romanToChord(seq[i][j], chrom));
      }
    }
  }

  prog = prog.map((chord, i) => { return (i > 0 && chord === prog[i - 1]) ? '-' : chord });

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      document.getElementById(`b${i + 1}c${j + 1}`).textContent = prog[i * 4 + j];
    }
  }

  document.getElementById(`d1`).textContent = desc;

  function romanToChord(r, scale) {
    const add = chordMap[r[0]];
    const newChord = scale[(rootIdx + add) % 12];
    return (newChord + r[1])
  }
}