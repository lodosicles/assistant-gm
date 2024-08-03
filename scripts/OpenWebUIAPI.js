// scripts/OpenWebUIAPI.js

export class OpenWebUIAPI {
    constructor(apiUrl, jwtToken) {
        this.apiUrl = apiUrl;
        this.token = jwtToken;
        console.log(`OpenWebUIAPI initialized with URL: ${this.apiUrl}`);
    }

    async getModels() {
        console.log(`Fetching models from ${this.apiUrl}...`);
        try {
            const response = await fetch(`${this.apiUrl}/ollama/api/tags`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched models:', data);
            if (!data.models || !Array.isArray(data.models)) {
                throw new Error('Invalid response format: models array not found');
            }
            return data.models;
        } catch (error) {
            console.error('Error in getModels:', error);
            throw new Error(`Failed to fetch models: ${error.message}`);
        }
    }

    async generateText(modelId, prompt) {
        console.log(`Generating text with model ID: ${modelId}`);
        try {
            const response = await fetch(`${this.apiUrl}/ollama/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    model: modelId,
                    prompt: prompt,
                    stream: false
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Generation response:', data);
            if (!data.response) {
                throw new Error('Invalid response format: text not found');
            }
            return data.response.trim();
        } catch (error) {
            console.error('Error in generateText:', error);
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }
}