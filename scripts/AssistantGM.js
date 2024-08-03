// scripts/AssistantGM.js

import { OpenWebUIAPI } from './OpenWebUIAPI.js';

console.log('AssistantGM | AssistantGM.js loaded');

export class AssistantGM {
    static ID = 'assistant-gm';
    static api;

    static async init() {
        console.log('AssistantGM | Initializing');
        try {
            this.registerSettings();
            console.log('AssistantGM | Settings registered');
            this.registerTextEnricher();
            console.log('AssistantGM | Text enricher registered');
        } catch (error) {
            console.error('AssistantGM | Error during initialization:', error);
        }
    }

    static registerSettings() {
        game.settings.register(this.ID, 'apiUrl', {
            name: 'Open WebUI API URL',
            hint: 'The URL of your Open WebUI API',
            scope: 'world',
            config: true,
            type: String,
            default: 'http://localhost:5932'
        });

        game.settings.register(this.ID, 'jwtToken', {
            name: 'JWT Token',
            hint: 'Your JWT token for authentication',
            scope: 'world',
            config: true,
            type: String,
            default: ''
        });

        game.settings.register(this.ID, 'modelName', {
            name: 'AI Model',
            hint: 'Select the AI model to use',
            scope: 'world',
            config: true,
            type: String,
            default: '',
            choices: {}
        });

        // Add a custom button to the settings form
        game.settings.registerMenu(this.ID, 'fetchModels', {
            name: 'Fetch AI Models',
            label: 'Fetch Models',
            hint: 'Fetch available AI models from the API',
            icon: 'fas fa-sync',
            type: FetchModelsForm,
            restricted: true
        });
    }

    static registerTextEnricher() {
        CONFIG.TextEditor.enrichers.push({
            pattern: /@assistant\[([^\]]+)(?:#([^#]+)#)?\]/g,
            enricher: this.enrichAssistant.bind(this)
        });
    }

    static initializeAPI() {
        const apiUrl = game.settings.get(this.ID, 'apiUrl');
        const jwtToken = game.settings.get(this.ID, 'jwtToken');
        this.api = new OpenWebUIAPI(apiUrl, jwtToken);
    }

    static async ready() {
        console.log('AssistantGM | Ready method called');
        try {
            this.initializeAPI();
            console.log('AssistantGM | API initialized');
            await this.updateAvailableModels();
            console.log('AssistantGM | Available models updated');
        } catch (error) {
            console.error('AssistantGM | Error during ready method:', error);
        }
    }


    static async updateAvailableModels() {
        console.log('Fetching available AI models...');
        try {
            const models = await this.api.getModels();
            console.log('Fetched models:', models);
            
            if (models.length === 0) {
                ui.notifications.error('No AI models found. Check your API URL and JWT token.');
                return;
            }

            const modelChoices = Object.fromEntries(models.map(model => [model.name, model.name]));
            
            // Update the choices for the modelName setting
            const setting = game.settings.settings.get(`${this.ID}.modelName`);
            setting.choices = modelChoices;
            
            // If the current model is not in the list, set it to the first available model
            const currentModel = game.settings.get(this.ID, 'modelName');
            if (!models.some(model => model.name === currentModel) || currentModel === '') {
                await game.settings.set(this.ID, 'modelName', models[0].name);
            }
            
            ui.notifications.info('AI models updated successfully');
        } catch (error) {
            console.error('Error fetching models:', error);
            ui.notifications.error(`Failed to fetch AI models: ${error.message}`);
        }
    }

    static async enrichAssistant(match, options) {
        console.log('enrichAssistant called with match:', match);
        const [fullMatch, prompt, journalName] = match;
        const modelName = game.settings.get(this.ID, 'modelName');
        
        let fullPrompt = prompt;
        if (journalName) {
            const journal = game.journal.getName(journalName);
            if (journal) {
                fullPrompt += "\n\nJournal Content:\n" + journal.data.content;
            } else {
                console.warn(`Journal "${journalName}" not found.`);
            }
        }
    
        const loadingSpan = document.createElement('span');
        loadingSpan.classList.add('assistant-loading');
        loadingSpan.textContent = 'Generating...';
    
        const contentSpan = document.createElement('span');
        contentSpan.classList.add('assistant-generated-text');
        contentSpan.style.display = 'none';
    
        const wrapperSpan = document.createElement('span');
        wrapperSpan.classList.add('assistant-wrapper');
        wrapperSpan.appendChild(loadingSpan);
        wrapperSpan.appendChild(contentSpan);
    
        // Start the text generation process
        this.generateTextFromPrompt(modelName, fullPrompt).then(generatedText => {
            loadingSpan.style.display = 'none';
            contentSpan.style.display = 'block';
            contentSpan.innerHTML = generatedText.replace(/\n/g, '<br>');
            
            // Trigger a custom event to notify that the content has been updated
            const event = new CustomEvent('assistantContentUpdated', { detail: { element: wrapperSpan } });
            document.dispatchEvent(event);
        }).catch(error => {
            loadingSpan.textContent = 'Error generating text';
            console.error('Error generating text:', error);
        });
    
        return wrapperSpan;
    }
    
    static async generateTextFromPrompt(modelName, prompt) {
        try {
            return await this.api.generateText(modelName, prompt);
        } catch (error) {
            console.error('Error generating text:', error);
            ui.notifications.error(`Failed to generate text: ${error.message}`);
            return null;
        }
    }

}

class FetchModelsForm extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'fetch-models-form',
            title: 'Fetch AI Models',
            template: `modules/${AssistantGM.ID}/templates/fetch-models-form.html`,
            width: 300,
            height: 'auto'
        });
    }

    getData() {
        return {
            content: 'Click the button below to fetch available AI models from the API.',
            submitText: 'Fetch Models'
        };
    }

    async _updateObject(event, formData) {
        await AssistantGM.updateAvailableModels();
        this.close();
    }
}

console.log('AssistantGM | AssistantGM class defined');
