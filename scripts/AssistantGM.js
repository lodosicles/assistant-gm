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
            default: 'http://localhost:5000',
            onChange: value => {
                console.log(`Open WebUI API URL changed to: ${value}`);
                this.initializeAPI();
            }
        });

        game.settings.register(this.ID, 'apiToken', {
            name: 'Open WebUI API Token',
            hint: 'Your API token for authentication',
            scope: 'world',
            config: true,
            type: String,
            default: '',
            onChange: value => {
                console.log('Open WebUI API Token changed');
                this.initializeAPI();
            }
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
    }

    static registerTextEnricher() {
        CONFIG.TextEditor.enrichers.push({
            pattern: /@assistant\[([^\]]+)(?:#([^#]+)#)?\]/g,
            enricher: this.enrichAssistant.bind(this)
        });
    }

    static initializeAPI() {
        const apiUrl = game.settings.get(this.ID, 'apiUrl');
        const apiToken = game.settings.get(this.ID, 'apiToken');
        this.api = new OpenWebUIAPI(apiUrl, apiToken);
    }

    static async ready() {
        console.log('AssistantGM | Ready');
        this.initializeAPI();
        await this.updateAvailableModels();
    }

    static async updateAvailableModels(settingsApp) {
        console.log('Fetching available AI models...');
        try {
            const models = await this.api.getModels();
            console.log('Fetched models:', models);
            
            if (models.length === 0) {
                ui.notifications.error('No AI models found. Check your API URL and token.');
                return;
            }

            const modelChoices = Object.fromEntries(models.map(model => [model, model]));
            
            // Update the choices for the modelName setting
            const setting = game.settings.settings.get(`${this.ID}.modelName`);
            setting.choices = modelChoices;
            
            // If the current model is not in the list, set it to the first available model
            const currentModel = game.settings.get(this.ID, 'modelName');
            if (!models.includes(currentModel) || currentModel === '') {
                await game.settings.set(this.ID, 'modelName', models[0]);
            }
            
            // Refresh the settings form
            if (settingsApp) {
                settingsApp.render(true);
            }
            ui.notifications.info('AI models updated successfully');
        } catch (error) {
            console.error('Error fetching models:', error);
            ui.notifications.error(`Failed to fetch AI models: ${error.message}`);
        }
    }

    static async enrichAssistant(match, options) {
        const [, prompt, journalName] = match;
        const model = game.settings.get(this.ID, 'modelName');
        
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
            const generatedText = await this.api.generateText(model, fullPrompt);
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
        const model = game.settings.get(this.ID, 'modelName');
        try {
            return await this.api.generateText(model, prompt);
        } catch (error) {
            console.error('Error generating text:', error);
            ui.notifications.error(`Failed to generate text: ${error.message}`);
            return null;
        }
    }

    static async fetchModelsForSettings(settingsApp) {
        await this.updateAvailableModels(settingsApp);
    }
}
