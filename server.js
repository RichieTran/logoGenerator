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

Your goal is to extract the following information from the transcript:
1. company_name: The name of the company being discussed
2. industry: The industry or sector the company operates in
3. values: An array of core company values (look for statements about what the company believes in, prioritizes, or stands for)
4. tone: The brand tone or personality (e.g., professional, casual, innovative, traditional, friendly, authoritative)
5. competitors: An array listing any competitors mentioned or implied
6. target_users: A description of the target audience or customer base

Before providing your final JSON output, use the scratchpad below to work through your analysis:

<scratchpad>
- Read through the transcript carefully
- Note where you find each piece of information
- If certain information is not explicitly stated, make reasonable inferences based on context
- If information cannot be found or inferred, note that you'll use null or an empty array as appropriate
- Plan out your JSON structure
</scratchpad>

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
                model: 'claude-opus-4-5-20251101',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: `You will be generating 5 different logo designs as SVG code based on company data. Here is the company data:

<company_data>
${JSON.stringify(companyData, null, 2)}
</company_data>

Your task is to create 5 distinct logo designs that are appropriate for this company. Follow these steps:

**Step 1: Analysis**
First, carefully review the company data provided. Pay attention to:
- Company name and industry
- Brand values, mission, or description
- Target audience
- Any competitor information provided

If competitor logos or design styles are mentioned in the company data, analyze them and ensure your designs are differentiated while remaining appropriate for the industry.

**Step 2: Design Requirements**
Each logo must adhere to these strict requirements:
- Use ONLY black (#000000) for all visible elements
- Background must be white or transparent (no background color specified in SVG)
- Must be complete, valid SVG code
- Should be scalable and work at different sizes
- Must be appropriate for the company's industry and brand

Aim to follow these principles:
- **Simple**: Easy to recognize and remember at a glance.
- **Distinctive**: Clearly different from competitors; avoids clichés.
- **Relevant**: Fits the brand’s purpose, audience, and tone.
- **Scalable**: Legible and recognizable at any size, from favicon to billboard.
- **Versatile**: Functions in color, black & white, and across mediums.
- **Timeless**: Avoids trends that date quickly.
- **Clear**: Communicates without explanation or excess detail.

**Step 3: Logo Types**
Create a diverse set of 5 logos using these types:
- **Wordmark**: Typography-based design using the company name
- **Pictorial**: Recognizable icon or symbol related to the company
- **Abstract**: Geometric or abstract shapes that represent the brand

Aim for variety across your 5 designs.

**Step 4: SVG Technical Requirements**
- Include proper SVG opening tag with viewBox attribute (e.g., viewBox="0 0 200 200")
- Use appropriate SVG elements (path, circle, rect, text, polygon, etc.)
- Ensure all paths are closed and properly formatted
- Keep the design clean and professional
- Test that your SVG syntax is valid

**Step 5: Planning**
Before generating the logos, use a scratchpad to plan your approach:

<scratchpad>
- Summarize key aspects of the company
- Note any competitor designs mentioned and how to differentiate
- List 5 different logo concepts you'll create
- Consider what makes each design appropriate and unique
</scratchpad>

**Step 6: Generate Logos**
Create all 5 logos with complete SVG code and rationales.

**Output Format**
You must return your response as valid JSON only, with no additional text before or after. Use this exact structure:

\`\`\`json
{
  "logos": [
    {
      "type": "wordmark",
      "svg": "<svg viewBox=\\"0 0 200 200\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
      "rationale": "Explanation of why this design works for the company, including how it differentiates from competitors if applicable"
    }
  ]
}
\`\`\`

In your rationale for each logo, explain:
- Why you chose this particular design approach
- How it reflects the company's brand/industry
- If competitor information was provided, how your design differentiates from or improves upon competitor approaches
- What makes this design effective

**Important Constraints:**
- Return ONLY valid JSON - no markdown code blocks, no explanatory text outside the JSON
- All SVG code must be properly escaped within the JSON strings (use \\" for quotes inside the SVG)
- Ensure all 5 logos are distinctly different from each other
- Every logo must use only black (#000000) with no other colors

Begin generating the logos now.`
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

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Open your browser to http://localhost:${PORT}`);
    });
}

module.exports = app;
