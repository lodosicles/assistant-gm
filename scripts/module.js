// scripts/module.js

import { AssistantGM } from './AssistantGM.js';

Hooks.once('init', async function() {
    console.log('AssistantGM | Initializing');
    await AssistantGM.init();
});

Hooks.once('ready', async function() {
    console.log('AssistantGM | Ready');
    await AssistantGM.ready();
});

Hooks.on('renderJournalSheet', (app, html, data) => {
    console.log('AssistantGM | Rendering Journal Sheet');
    
    const button = $('<button type="button" class="assistant-gm-generate">Generate AI Content</button>');
    button.click(async () => {
        const journalEntry = app.object;
        const promptInput = $('<input type="text" placeholder="Enter your prompt here">');
        const dialog = new Dialog({
            title: "Generate AI Content",
            content: promptInput[0].outerHTML,
            buttons: {
                generate: {
                    label: "Generate",
                    callback: async (html) => {
                        const prompt = html.find('input').val();
                        await AssistantGM.generateAndAddPage(journalEntry, prompt);
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        });
        dialog.render(true);
    });
    
    html.find('.journal-header-actions').append(button);
    console.log('AssistantGM | Button added to journal sheet');
});

console.log('AssistantGM | Module loaded');