const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const transcriptInput = document.getElementById('transcriptInput');

// Click to open file picker
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('drag-over');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('drag-over');
    }, false);
});

// Handle dropped files
uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}, false);

// Handle selected files from file picker
fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Please upload a JSON file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const jsonData = JSON.parse(content);
            // If JSON has a transcript field, use it else stringify the file
            const transcriptText = jsonData.transcript || JSON.stringify(jsonData, null, 2);
            // Put the transcript in textarea
            transcriptInput.value = transcriptText;
            console.log('File loaded successfully:', file.name);
        } catch (error) {
            alert('Error reading JSON file: ' + error.message);
        }
    };

    reader.readAsText(file);
}
