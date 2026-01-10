require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.post('/api/extract', async (req, res) => {
    const { transcript } = req.body;

    if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Analyze this company transcript and extract key information:

Transcript: ${transcript}

Please extract and return the following in JSON format:
- company_name: The name of the company
- industry: The industry/sector
- values: Core company values (array)
- tone: Brand tone/personality
- competitors: List of competitors (array)
- target_users: Description of target audience

Only return valid JSON, no additional text.`
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to generate logos
app.post('/api/generate-logos', async (req, res) => {
    const { companyData } = req.body;

    if (!companyData) {
        return res.status(400).json({ error: 'Company data is required' });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: `Based on this company data, generate 5 different logo designs as SVG code. Each logo should be ONLY black (#000000) with white or transparent background.

Company Data:
${JSON.stringify(companyData, null, 2)}

For each logo:
1. Choose appropriate type (wordmark, pictorial, or abstract icon)
2. Generate complete SVG code
3. Provide rationale for design choices

Return in this JSON format:
{
  "logos": [
    {
      "type": "wordmark|pictorial|abstract",
      "svg": "<svg>...</svg>",
      "rationale": "explanation of design choices"
    }
  ]
}

Only return valid JSON, no additional text.`
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open your browser to http://localhost:${PORT}`);
});
