// scripts/AssistantGM.js

import { OpenWebUIAPI } from './OpenWebUIAPI.js';

export class AssistantGM {
    static ID = 'assistant-gm';
    static api;

    static async init() {
        console.log('AssistantGM | Initializing');
        if (!game.user.isGM) {
            console.log('AssistantGM | User is not GM, skipping initialization');
            return;
        }
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
            default: 'http://localhost:5932',
            restricted: true  // Only visible to GMs
        });
    
        game.settings.register(this.ID, 'jwtToken', {
            name: 'JWT Token',
            hint: 'Your JWT token for authentication',
            scope: 'world',
            config: true,
            type: String,
            default: '',
            restricted: true  // Only visible to GMs
        });
    
        game.settings.register(this.ID, 'modelName', {
            name: 'AI Model',
            hint: 'Select the AI model to use',
            scope: 'world',
            config: true,
            type: String,
            default: '',
            choices: {},
            restricted: true  // Only visible to GMs
        });
    
        // Add a custom button to the settings form
        game.settings.registerMenu(this.ID, 'fetchModels', {
            name: 'Fetch AI Models',
            label: 'Fetch Models',
            hint: 'Fetch available AI models from the API',
            icon: 'fas fa-sync',
            type: FetchModelsForm,
            restricted: true  // Only visible to GMs
        });
    }

    static initializeAPI() {
        const apiUrl = game.settings.get(this.ID, 'apiUrl');
        const jwtToken = game.settings.get(this.ID, 'jwtToken');
        this.api = new OpenWebUIAPI(apiUrl, jwtToken);
    }

    static async ready() {
        if (!game.user.isGM) return;
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
        if (!game.user.isGM) return;
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
            let startY, startX, startDrawerHeight, startDrawerLeft;
            let moveThreshold = 5; // Pixels to move before deciding between resize and drag
            let initialClickY, initialClickX;
            let hasMovedPastThreshold = false;
        
            handle.on('mousedown', (e) => {
                if (e.button !== 0) return; // Only respond to left mouse button
                isDragging = true;
                startY = initialClickY = e.clientY;
                startX = initialClickX = e.clientX;
                startDrawerHeight = drawerElement.height();
                startDrawerLeft = drawerElement.position().left;
                hasMovedPastThreshold = false;
                e.preventDefault();
        });

        $(document).on('mousemove', (e) => {
            if (!isDragging) return;

            const deltaY = e.clientY - initialClickY;
            const deltaX = e.clientX - initialClickX;
            const totalDelta = Math.sqrt(deltaY * deltaY + deltaX * deltaX);

            if (!hasMovedPastThreshold) {
                if (totalDelta > moveThreshold) {
                    hasMovedPastThreshold = true;
                } else {
                    return;
                }
            }

            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // Vertical movement - resize
                let newHeight = startDrawerHeight + (startY - e.clientY);
                newHeight = Math.max(newHeight, handle.height());
                newHeight = Math.min(newHeight, window.innerHeight - handle.height());
                drawerElement.height(newHeight);
                content.toggle(newHeight > handle.height());
            } else {
                // Horizontal movement - reposition
                let newLeft = startDrawerLeft + (e.clientX - startX);
                newLeft = Math.max(newLeft, 0);
                newLeft = Math.min(newLeft, window.innerWidth - drawerElement.width());
                drawerElement.css('left', newLeft + 'px');
            }
        });

        $(document).on('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (drawerElement.height() <= handle.height()) {
                    drawerElement.height(handle.height());
                    content.hide();
                } else if (drawerElement.height() < 50) { // Arbitrary small height
                    drawerElement.height(handle.height());
                    content.hide();
                } else {
                    content.show();
                }
            }
        });

        this.populateJournalList(journalEntriesList);

        $('#assistant-gm-submit').click(async () => {
            const prompt = $('#assistant-gm-prompt').val();
            const output = $('#assistant-gm-output');
            output.val('Generating...');

            try {
                const modelName = game.settings.get(this.ID, 'modelName');
                
                // Gather selected journal entry content
                let contextContent = '';
                $('input:checked', journalEntriesList).each(function() {
                    const journalId = $(this).val();
                    const journal = game.journal.get(journalId);
                    if (journal) {
                        contextContent += `${journal.name}:\n${journal.pages.contents[0].text.content}\n\n`;
                    }
                });

                // Construct the full prompt
                let fullPrompt = prompt;
                if (contextContent) {
                    fullPrompt += `\n\nUse the following content for context in preparing your response:\n${contextContent}`;
                }

                const generatedText = await this.api.generateText(modelName, fullPrompt);
                output.val(generatedText);
            } catch (error) {
                console.error('Error generating text:', error);
                output.val(`Error: ${error.message}`);
            }
        });
    }

    static populateJournalList(listElement) {
        const journals = game.journal.contents;
        journals.forEach(journal => {
            const journalItem = $(`
                <div class="journal-item">
                    <input type="checkbox" id="journal-${journal.id}" value="${journal.id}">
                    <label for="journal-${journal.id}">${journal.name}</label>
                </div>
            `);
            listElement.append(journalItem);
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