// scripts/OpenWebUIAPI.js

export class OpenWebUIAPI {
    constructor(apiUrl, jwtToken) {
        this.apiUrl = apiUrl;
        this.token = jwtToken;
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

    async generateTextStream(modelId, prompt, onChunk) {
        console.log(`Generating text stream with model ID: ${modelId}`);
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
                    stream: true
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                let boundary = buffer.lastIndexOf('\n');
                
                if (boundary !== -1) {
                    let completeLines = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 1);
                    
                    completeLines.split('\n').forEach(line => {
                        if (line.trim() !== '') {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.response) {
                                    onChunk(parsed.response);
                                }
                            } catch (e) {
                                console.warn('Error parsing JSON:', e, 'Line:', line);
                            }
                        }
                    });
                }
            }

            // Process any remaining data in the buffer
            if (buffer.trim() !== '') {
                try {
                    const parsed = JSON.parse(buffer);
                    if (parsed.response) {
                        onChunk(parsed.response);
                    }
                } catch (e) {
                    console.warn('Error parsing JSON at end of stream:', e, 'Buffer:', buffer);
                }
            }

        } catch (error) {
            console.error('Error in generateTextStream:', error);
            throw error;
        }
    }
}