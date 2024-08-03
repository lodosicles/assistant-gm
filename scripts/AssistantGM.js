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
            default: 'http://localhost:3000'
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
    
    static async ready() {
        console.log('AssistantGM | Ready method called');
        try {
            this.initializeAPI();
            await this.updateAvailableModels();
            console.log('AssistantGM | Available models updated');
        } catch (error) {
            console.error('AssistantGM | Error during ready method:', error);
        }
    }
    
    static initializeAPI() {
        const apiUrl = game.settings.get(this.ID, 'apiUrl');
        const jwtToken = game.settings.get(this.ID, 'jwtToken');
        this.api = new OpenWebUIAPI(apiUrl, jwtToken);
        console.log('AssistantGM | API initialized');
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

    static registerTextEnricher() {
        CONFIG.TextEditor.enrichers.push({
            pattern: /@assistant\[([^\]]+)(?:#([^#]+)#)?\]/g,
            enricher: this.enrichAssistant.bind(this)
        });
    }

    static async enrichAssistant(match, options) {
        console.log('Enriching assistant content:', match);
        if (!this.api) {
            console.error('API not initialized');
            return '<span class="assistant-error">Error: API not initialized</span>';
        }

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
            console.log('Generating text with prompt:', fullPrompt);
            const generatedText = await this.api.generateText(modelName, fullPrompt);
            console.log('Generated text:', generatedText);
            return `<span class="assistant-generated-text">${generatedText.replace(/\n/g, '<br>')}</span>`;
        } catch (error) {
            console.error('Error generating text:', error);
            ui.notifications.error(`Failed to generate text: ${error.message}`);
            return `<span class="assistant-error">Error: ${error.message}</span>`;
        }
    }

    static async generateTextFromPromptStream(modelName, prompt, placeholderId) {
        if (!this.api) {
            console.error('API not initialized. Initializing now...');
            this.initializeAPI();
        }
        if (!this.api || typeof this.api.generateTextStream !== 'function') {
            throw new Error('API not properly initialized or generateTextStream method not found');
        }

        let generatedText = '';

        try {
            await this.api.generateTextStream(modelName, prompt, (chunk) => {
                generatedText += chunk;
                this.updateJournalContent(placeholderId, generatedText);
            });
        } catch (error) {
            console.error('Error generating text:', error);
            this.updateJournalContent(placeholderId, `Error generating text: ${error.message}`);
        }
    }

    static async updateJournalContent(placeholderId, content) {
        const journalEntry = this.findJournalEntryByPlaceholderId(placeholderId);
        if (!journalEntry) return;

        const updatedContent = journalEntry.content.replace(
            new RegExp(`<span id="${placeholderId}"[^>]*>.*?</span>`),
            `<span id="${placeholderId}" class="assistant-wrapper">${content}</span>`
        );

        await journalEntry.update({content: updatedContent});
    }

    static findJournalEntryByPlaceholderId(placeholderId) {
        return game.journal.contents.find(je => je.content && je.content.includes(placeholderId));
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
