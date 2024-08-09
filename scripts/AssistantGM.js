// scripts/AssistantGM.js

import { OpenWebUIAPI } from './OpenWebUIAPI.js';

export class AssistantGM {
    static ID = 'assistant-gm';
    static api;

    static async init() {
        console.log('AssistantGM | Initializing');
        try {
            this.registerSettings();
            console.log('AssistantGM | Settings registered');
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

    static createDrawer() {
        const drawer = $(`
            <div id="assistant-gm-drawer" class="assistant-gm-drawer">
                <div class="assistant-gm-handle">Assistant GM</div>
                <div class="assistant-gm-content">
                    <textarea id="assistant-gm-prompt" placeholder="Enter your prompt here"></textarea>
                    <button id="assistant-gm-submit">Generate</button>
                    <div id="assistant-gm-output"></div>
                </div>
            </div>
        `);

        $('body').append(drawer);

        $('#assistant-gm-submit').click(async () => {
            const prompt = $('#assistant-gm-prompt').val();
            const output = $('#assistant-gm-output');
            output.text('Generating...');

            try {
                const modelName = game.settings.get(this.ID, 'modelName');
                const generatedText = await this.api.generateText(modelName, prompt);
                output.text(generatedText);
            } catch (error) {
                console.error('Error generating text:', error);
                output.text(`Error: ${error.message}`);
            }
        });

        $('.assistant-gm-handle').click(() => {
            $('#assistant-gm-drawer').toggleClass('open');
        });
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