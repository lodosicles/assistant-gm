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
            const response = await fetch(`${this.apiUrl}/api/v1/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('Raw API response:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error(`Invalid JSON response: ${text}`);
            }
            console.log('Parsed API response:', data);
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format: expected an array of models');
            }
            return data;
        } catch (error) {
            console.error('Error in getModels:', error);
            throw new Error(`Failed to fetch models: ${error.message}`);
        }
    }

    async generateText(model, prompt) {
        console.log(`Generating text with model: ${model}`);
        try {
            const response = await fetch(`${this.apiUrl}/api/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    max_new_tokens: 250,
                    preset: 'None',
                    do_sample: true,
                    temperature: 0.7,
                    top_p: 0.1,
                    typical_p: 1,
                    epsilon_cutoff: 0,
                    eta_cutoff: 0,
                    tfs: 1,
                    top_a: 0,
                    repetition_penalty: 1.18,
                    top_k: 40,
                    min_length: 0,
                    no_repeat_ngram_size: 0,
                    num_beams: 1,
                    penalty_alpha: 0,
                    length_penalty: 1,
                    early_stopping: false,
                    mirostat_mode: 0,
                    mirostat_tau: 5,
                    mirostat_eta: 0.1,
                    seed: -1,
                    add_bos_token: true,
                    truncation_length: 2048,
                    ban_eos_token: false,
                    skip_special_tokens: true,
                    stopping_strings: []
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Generation response:', data);
            if (!data.results || !data.results[0].text) {
                throw new Error('Invalid response format: text not found');
            }
            return data.results[0].text.trim();
        } catch (error) {
            console.error('Error in generateText:', error);
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }
}
