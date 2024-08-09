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
        const drawer = $(`
            <div id="assistant-gm-drawer" class="assistant-gm-drawer">
                <div class="assistant-gm-handle">Assistant GM</div>
                <div class="assistant-gm-resize-handle"></div>
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
        const resizeHandle = $('.assistant-gm-resize-handle');
    
        let isDragging = false;
        let startY;
        let startHeight;
        let startDrawerBottom;
    
        // Handle drawer opening/closing
        handle.on('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startDrawerBottom = parseInt(drawerElement.css('bottom'));
            e.preventDefault();
        });
    
        // Handle drawer resizing
        resizeHandle.on('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startHeight = drawerElement.height();
            e.preventDefault();
        });
    
        $(document).on('mousemove', (e) => {
            if (!isDragging) return;
    
            const deltaY = startY - e.clientY;
    
            if ($(e.target).is(handle)) {
                // Opening/closing the drawer
                let newBottom = startDrawerBottom + deltaY;
                newBottom = Math.min(Math.max(newBottom, 0), drawerElement.height() - handle.height());
                drawerElement.css('bottom', `${newBottom}px`);
            } else if ($(e.target).is(resizeHandle)) {
                // Resizing the drawer
                let newHeight = startHeight + deltaY;
                newHeight = Math.max(newHeight, 100); // Minimum height
                drawerElement.height(newHeight);
            }
        });
    
        $(document).on('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                const currentBottom = parseInt(drawerElement.css('bottom'));
                if (currentBottom > drawerElement.height() / 2) {
                    drawerElement.css('bottom', '0px'); // Close
                } else {
                    drawerElement.css('bottom', `${drawerElement.height() - handle.height()}px`); // Open
                }
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