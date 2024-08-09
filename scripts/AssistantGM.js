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
            this.createDrawer();
            console.log('AssistantGM | Drawer created');
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

    static createDrawer() {
        if ($('#assistant-gm-drawer').length) {
            return; // Drawer already exists, don't create another one
        }
    
        const drawer = $(`
            <div id="assistant-gm-drawer" class="assistant-gm-drawer">
                <div class="assistant-gm-handle">AI</div>
                <div class="assistant-gm-content">
                    <textarea id="assistant-gm-prompt" placeholder="Enter your prompt here"></textarea>
                    <button id="assistant-gm-submit">Generate</button>
                    <textarea id="assistant-gm-output" readonly></textarea>
                </div>
            </div>
        `);
    
        $('body').append(drawer);
    
        const drawerElement = $('#assistant-gm-drawer');
        const handle = $('.assistant-gm-handle');
        const content = $('.assistant-gm-content');
    
        let isDragging = false;
        let isResizing = false;
        let startY, startX, startDrawerHeight, startDrawerLeft;
    
        handle.on('mousedown', (e) => {
            if (e.button !== 0) return; // Only respond to left mouse button
            if (drawerElement.height() > handle.height()) {
                isResizing = true;
            } else {
                isDragging = true;
            }
            startY = e.clientY;
            startX = e.clientX;
            startDrawerHeight = drawerElement.height();
            startDrawerLeft = drawerElement.position().left;
            e.preventDefault();
        });
    
        $(document).on('mousemove', (e) => {
            if (isResizing) {
                const deltaY = startY - e.clientY;
                let newHeight = startDrawerHeight + deltaY;
                newHeight = Math.max(newHeight, handle.height());
                newHeight = Math.min(newHeight, window.innerHeight - handle.height());
                drawerElement.height(newHeight);
                content.toggle(newHeight > handle.height());
            } else if (isDragging) {
                const deltaX = e.clientX - startX;
                let newLeft = startDrawerLeft + deltaX;
                newLeft = Math.max(newLeft, 0);
                newLeft = Math.min(newLeft, window.innerWidth - drawerElement.width());
                drawerElement.css('left', newLeft + 'px');
            }
        });
    
        $(document).on('mouseup', () => {
            isDragging = false;
            isResizing = false;
            if (drawerElement.height() <= handle.height()) {
                drawerElement.height(handle.height());
                content.hide();
            }
        });
    
        $('#assistant-gm-submit').click(async () => {
            const prompt = $('#assistant-gm-prompt').val();
            const output = $('#assistant-gm-output');
            output.val('Generating...');
    
            try {
                const modelName = game.settings.get(this.ID, 'modelName');
                const generatedText = await this.api.generateText(modelName, prompt);
                output.val(generatedText);
            } catch (error) {
                console.error('Error generating text:', error);
                output.val(`Error: ${error.message}`);
            }
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