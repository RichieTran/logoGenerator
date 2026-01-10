const uploadArea = document.getElementById('JSONinput');
const fileInput = document.getElementById('fileInput');
const transcriptInput = document.getElementById('textInput');
const submitButton = document.getElementById('submitButton');
const resultsModal = document.getElementById('resultsModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Store extracted data globally
let extractedData = null;

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

// Button click to process transcript (First API call - extract data)
submitButton.addEventListener('click', async () => {
    const transcript = transcriptInput.value.trim();

    if (!transcript) {
        alert('Please provide a transcript first');
        return;
    }

    try {
        console.log('Making API request...');

        const response = await fetch('http://localhost:3000/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcript: transcript
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        console.log('Extracted data:', content);

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
            displayExtractedData(extractedData);
        } else {
            throw new Error('Failed to parse JSON from response');
        }

    } catch (error) {
        console.error('Error calling backend API:', error);
        alert('Error processing transcript: ' + error.message);
    }
});

// Display extracted data in modal
function displayExtractedData(data) {
    let html = `
        <div class="info-section">
            <h3>Company Name</h3>
            <input type="text" id="companyName" value="${data.company_name || ''}"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
        </div>

        <div class="info-section">
            <h3>Industry</h3>
            <input type="text" id="industry" value="${data.industry || ''}"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
        </div>

        <div class="info-section">
            <h3>Core Values</h3>
            <div id="valuesContainer">
                ${(data.values || []).map((value, index) => `
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" class="value-input" value="${value}"
                               style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
                        <button onclick="removeValue(${index})"
                                style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; font-weight: 600;">−</button>
                    </div>
                `).join('')}
            </div>
            <button id="addValue" style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; margin-top: 0.5rem; font-weight: 600;">+</button>
        </div>

        <div class="info-section">
            <h3>Brand Tone</h3>
            <input type="text" id="tone" value="${data.tone || ''}"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
        </div>

        <div class="info-section">
            <h3>Competitors</h3>
            <div id="competitorsContainer">
                ${(data.competitors || []).map((comp, index) => `
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" class="competitor-input" value="${comp}"
                               style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
                        <button onclick="removeCompetitor(${index})"
                                style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; font-weight: 600;">−</button>
                    </div>
                `).join('')}
            </div>
            <button id="addCompetitor" style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; margin-top: 0.5rem; font-weight: 600;">+</button>
        </div>

        <div class="info-section">
            <h3>Target Users</h3>
            <textarea id="targetUsers" rows="3"
                      style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; resize: none; font-family: inherit;">${data.target_users || ''}</textarea>
        </div>

        <button class="generate-logos-button" id="generateLogos">
            Generate Logos
        </button>
    `;

    modalBody.innerHTML = html;
    resultsModal.classList.add('active');

    document.querySelector('.modal-header h2').textContent = 'Company Information';

    document.getElementById('generateLogos').addEventListener('click', () => {
        extractedData = {
            company_name: document.getElementById('companyName').value,
            industry: document.getElementById('industry').value,
            values: Array.from(document.querySelectorAll('.value-input')).map(input => input.value).filter(v => v.trim()),
            tone: document.getElementById('tone').value,
            competitors: Array.from(document.querySelectorAll('.competitor-input')).map(input => input.value).filter(c => c.trim()),
            target_users: document.getElementById('targetUsers').value
        };
        generateLogos();
    });

    document.getElementById('addValue').addEventListener('click', () => {
        const container = document.getElementById('valuesContainer');
        const index = document.querySelectorAll('.value-input').length;
        const newInput = document.createElement('div');
        newInput.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
        newInput.innerHTML = `
            <input type="text" class="value-input" placeholder="Enter value"
                   style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
            <button onclick="this.parentElement.remove()"
                    style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; font-weight: 600;">−</button>
        `;
        container.appendChild(newInput);
    });

    document.getElementById('addCompetitor').addEventListener('click', () => {
        const container = document.getElementById('competitorsContainer');
        const newInput = document.createElement('div');
        newInput.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
        newInput.innerHTML = `
            <input type="text" class="competitor-input" placeholder="Enter competitor"
                   style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit;">
            <button onclick="this.parentElement.remove()"
                    style="width: 32px; height: 32px; background-color: #000; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; font-weight: 600;">−</button>
        `;
        container.appendChild(newInput);
    });
}

window.removeValue = function(index) {
    const inputs = document.querySelectorAll('.value-input');
    if (inputs[index]) {
        inputs[index].parentElement.remove();
    }
};

window.removeCompetitor = function(index) {
    const inputs = document.querySelectorAll('.competitor-input');
    if (inputs[index]) {
        inputs[index].parentElement.remove();
    }
};

// Second API call - Generate logos
async function generateLogos() {
    if (!extractedData) {
        alert('No data available to generate logos');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/generate-logos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                companyData: extractedData
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        console.log('Generated logos:', content);

        // Parse and display logos
        // Remove markdown code blocks if present
        let jsonText = content;
        const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1];
        }

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const logosData = JSON.parse(jsonMatch[0]);
            displayLogos(logosData.logos);
        } else {
            throw new Error('Failed to parse logos JSON');
        }

    } catch (error) {
        console.error('Error generating logos:', error);
        alert('Error generating logos: ' + error.message);
    }
}

// Display logos in the modal
function displayLogos(logos) {
    console.log('Logos generated:', logos);

    // Update modal header
    document.querySelector('.modal-header h2').textContent = 'Potential Logos';

    let html = '';

    logos.forEach((logo, index) => {
        html += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <div style="background-color: #f5f5f5; padding: 2rem; border-radius: 8px; width: 100%; display: flex; justify-content: center;">
                        ${logo.svg}
                    </div>
                    <div style="width: 100%;">
                        <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #333;">
                            Logo ${index + 1} - ${logo.type.charAt(0).toUpperCase() + logo.type.slice(1)}
                        </p>
                        <p style="margin: 0; color: #666; font-size: 0.9rem; line-height: 1.5;">
                            ${logo.rationale}
                        </p>
                    </div>
                    <button onclick="downloadSVG(${index})" style="width: 100%; padding: 0.75rem; background-color: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Download SVG
                    </button>
                </div>
            </div>
        `;
    });

    modalBody.innerHTML = html;

    // Store logos globally for download function
    window.generatedLogos = logos;
}

// Download SVG function
window.downloadSVG = function(index) {
    const logo = window.generatedLogos[index];
    const blob = new Blob([logo.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-${index + 1}-${logo.type}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Close modal
closeModal.addEventListener('click', () => {
    resultsModal.classList.remove('active');
});
resultsModal.addEventListener('click', (e) => {
    if (e.target === resultsModal) {
        resultsModal.classList.remove('active');
    }
});
