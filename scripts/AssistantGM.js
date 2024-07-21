// scripts/AssistantGM.js

import { OpenWebUIAPI } from './OpenWebUIAPI.js';

export class AssistantGM {
    static ID = 'assistant-gm';
    static api;

    static async init() {
        console.log('AssistantGM | Initializing');
        this.registerSettings();
        this.registerTextEnricher();
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
        console.log('AssistantGM | Ready');
        this.initializeAPI();
        await this.updateAvailableModels();
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
        const [, prompt, journalName] = match;
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

        try {
            const generatedText = await this.api.generateText(modelName, fullPrompt);
            const span = document.createElement('span');
            span.classList.add('assistant-generated-text');
            span.textContent = generatedText;
            return span;
        } catch (error) {
            console.error('Error generating text:', error);
            ui.notifications.error(`Failed to generate text: ${error.message}`);
            return null;
        }
    }

    static async generateTextFromPrompt(prompt) {
        const modelName = game.settings.get(this.ID, 'modelName');
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
            template: 'templates/apps/form-application.html',
            width: 300,
            height: 'auto'
        });
    }

    getData() {
        return {
            content: '<p>Click the button below to fetch available AI models from the API.</p>'
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('button[type="submit"]').text('Fetch Models');
    }

    async _updateObject(event, formData) {
        await AssistantGM.updateAvailableModels();
        this.close();
    }
}
