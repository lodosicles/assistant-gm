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
            config: false,
            type: String,
            default: 'http://localhost:5932'
        });

        game.settings.register(this.ID, 'jwtToken', {
            name: 'JWT Token',
            hint: 'Your JWT token for authentication',
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });

        game.settings.register(this.ID, 'modelName', {
            name: 'AI Model',
            hint: 'Select the AI model to use',
            scope: 'world',
            config: false,
            type: String,
            default: '',
            choices: {}
        });

        game.settings.registerMenu(this.ID, 'settingsMenu', {
            name: 'AssistantGM Settings',
            label: 'Open Settings',
            hint: 'Configure the AssistantGM integration settings.',
            icon: 'fas fa-cogs',
            type: AssistantGMSettingsForm,
            restricted: true
        });
    }

    // ... (rest of the methods remain the same)
}

class AssistantGMSettingsForm extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'assistant-gm-settings',
            title: 'AssistantGM Settings',
            template: 'modules/assistant-gm/templates/settings.html',
            width: 500,
            height: 'auto',
            closeOnSubmit: false
        });
    }

    getData(options) {
        const data = super.getData(options);
        data.apiUrl = game.settings.get('assistant-gm', 'apiUrl');
        data.jwtToken = game.settings.get('assistant-gm', 'jwtToken');
        data.modelName = game.settings.get('assistant-gm', 'modelName');
        data.modelChoices = game.settings.settings.get('assistant-gm.modelName').choices;
        return data;
    }

    async _updateObject(event, formData) {
        await game.settings.set('assistant-gm', 'apiUrl', formData.apiUrl);
        await game.settings.set('assistant-gm', 'jwtToken', formData.jwtToken);
        await game.settings.set('assistant-gm', 'modelName', formData.modelName);
        
        AssistantGM.initializeAPI();
        ui.notifications.info('AssistantGM settings updated');
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('#fetch-models').click(this._onFetchModels.bind(this));
    }

    async _onFetchModels(event) {
        event.preventDefault();
        await AssistantGM.updateAvailableModels(this);
    }
}
