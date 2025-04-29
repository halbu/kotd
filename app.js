
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

// Update display initially
updateDisplay();

// Update display when date changes (every minute)
setInterval(updateDisplay, 60000);