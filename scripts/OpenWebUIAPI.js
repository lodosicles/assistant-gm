// scripts/OpenWebUIAPI.js

export class OpenWebUIAPI {
    constructor(apiUrl, jwtToken) {
        this.apiUrl = apiUrl;
        this.token = jwtToken;
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.trim() !== '') {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.response) {
                                onChunk(parsed.response);
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in generateTextStream:', error);
            throw error;
        }
    }
}