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

        const handle = $('.assistant-gm-handle');
        const drawerElement = $('#assistant-gm-drawer');

        // Make the handle draggable
        handle.css('cursor', 'move');
        handle.on('mousedown', (e) => {
            e.preventDefault();
            
            const startX = e.pageX - handle.offset().left;
            const drawerWidth = drawerElement.width();
            
            $(document).on('mousemove', (e) => {
                const newLeft = e.pageX - startX;
                const maxLeft = drawerWidth - handle.width();
                const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
                handle.css('left', clampedLeft + 'px');
            });

            $(document).on('mouseup', () => {
                $(document).off('mousemove');
                $(document).off('mouseup');
            });
        });

        // Toggle drawer on handle click
        handle.on('click', (e) => {
            if (e.offsetX < 10 || e.offsetX > handle.width() - 10) {
                drawerElement.toggleClass('open');
            }
        });

        $('#assistant-gm-submit').click(async () => {
            const prompt = $('#assistant-gm-prompt').val();
            const output = $('#assistant-gm-output');
            output.html('<p>Generating...</p>');

            try {
                const modelName = game.settings.get(this.ID, 'modelName');
                const generatedText = await this.api.generateText(modelName, prompt);
                const formattedContent = this.formatText(generatedText);
                
                // Create a new text editor
                const editor = await TextEditor.create({
                    target: output[0],
                    content: formattedContent,
                    editable: false,
                    engine: "prosemirror"
                });

                // Replace the output content with the editor
                output.html(editor);

            } catch (error) {
                console.error('Error generating text:', error);
                output.html(`<p>Error: ${error.message}</p>`);
            }
        });
    }

    static formatText(text) {
        // Convert markdown-like syntax to HTML
        return text
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>');
    }

    static convertToProseMirror(text) {
        const lines = text.split('\n');
        const doc = {type: "doc", content: []};
        let currentList = null;

        for (const line of lines) {
            if (line.startsWith('# ')) {
                doc.content.push({type: "heading", attrs: {level: 1}, content: [{type: "text", text: line.slice(2)}]});
            } else if (line.startsWith('## ')) {
                doc.content.push({type: "heading", attrs: {level: 2}, content: [{type: "text", text: line.slice(3)}]});
            } else if (line.startsWith('- ')) {
                if (!currentList || currentList.type !== "bullet_list") {
                    currentList = {type: "bullet_list", content: []};
                    doc.content.push(currentList);
                }
                currentList.content.push({type: "list_item", content: [{type: "paragraph", content: this.parseInline(line.slice(2))}]});
            } else if (line.trim() === '') {
                doc.content.push({type: "paragraph"});
                currentList = null;
            } else {
                doc.content.push({type: "paragraph", content: this.parseInline(line)});
                currentList = null;
            }
        }

        return doc;
    }

    static parseInline(text) {
        const content = [];
        let currentText = '';
        let bold = false;
        let italic = false;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '*' && text[i+1] === '*') {
                if (currentText) content.push({type: "text", text: currentText, marks: bold ? [{type: "strong"}] : []});
                currentText = '';
                bold = !bold;
                i++;
            } else if (text[i] === '*') {
                if (currentText) content.push({type: "text", text: currentText, marks: italic ? [{type: "em"}] : []});
                currentText = '';
                italic = !italic;
            } else {
                currentText += text[i];
            }
        }

        if (currentText) content.push({type: "text", text: currentText, marks: []});

        return content;
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