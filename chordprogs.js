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

  prog = prog.map((chord, i) => { return (i > 0 && chord === prog[i - 1]) ? '/' : chord });

  // At this point, we need to programatically generate the HTML that will display the chord progression.
  const rootEl = document.getElementById('chord-chart-container');

  insertEightMeasures(rootEl, 8);
  insertEightMeasures(rootEl, 0);

  for (let i = 0; i < 16; i++) {
    document.getElementById(`m${i}`).textContent = prog[i];
    if (document.getElementById(`m${i}`).textContent !== '/') {
      document.getElementById(`m${i}`).classList.add('chord');
    } else {
      document.getElementById(`m${i}`).classList.add('repeat');
    }
  }

  document.getElementById(`d1`).textContent = desc;

  function romanToChord(r, scale) {
    const add = chordMap[r[0]];
    const newChord = scale[(rootIdx + add) % 12];
    return (newChord + r[1])
  }
}

function insertEightMeasures(rootEl, mIdx) {
  const vertclasses = `vertical-lines-intermediate intermediate`

  rootEl.insertAdjacentHTML('afterend', `
    <div class="chord-chart-container">
      <div class="progBox" id="b1">` +
      // ` + ((mIdx === 0)
      //     ? `<div class="vertical-lines left"><span></span><span></span></div>`
      //     : `<div class="vertical-lines right"><span></span></div>`)
      // + `  
      `<div class="vertical-lines right"><span></span></div>`
      + `  
        <div class="measure" id="m${mIdx + 0}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 1}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 2}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 3}">.</div>
        <div class="vertical-lines right"><span></span></div>
      </div>
      <div class="progBox" id="b1">
        <div class="measure" id="m${mIdx + 4}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 5}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 6}">.</div>
        <div class="${vertclasses}"><span></span></div>
        <div class="measure" id="m${mIdx + 7}">.</div>
        <div class="vertical-lines right"><span></span></div>
      </div>
    `
  );
}