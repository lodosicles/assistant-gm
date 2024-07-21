// scripts/OpenWebUIAPI.js

export class OpenWebUIAPI {
    constructor(apiUrl, apiToken) {
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        console.log(`OpenWebUIAPI initialized with URL: ${this.apiUrl}`);
    }

    async getModels() {
        console.log(`Fetching models from ${this.apiUrl}...`);
        try {
            const response = await fetch(`${this.apiUrl}/v1/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('API response:', data);
            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format: models array not found');
            }
            return data.data.map(model => model.id);
        } catch (error) {
            console.error('Error in getModels:', error);
            throw new Error(`Failed to fetch models: ${error.message}`);
        }
    }

    async generateText(model, prompt) {
        console.log(`Generating text with model: ${model}`);
        try {
            const response = await fetch(`${this.apiUrl}/v1/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    max_tokens: 150
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.choices || !data.choices[0].text) {
                throw new Error('Invalid response format: text not found');
            }
            return data.choices[0].text.trim();
        } catch (error) {
            console.error('Error in generateText:', error);
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }
}
