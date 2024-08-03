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
    const content = html.find('.editor-content');
    TextEditor.enrichHTML(content.html(), {async: true}).then(result => {
        console.log('AssistantGM | Enriched content:', result);
        content.html(result);
    });

    const button = $('<button>Generate AI Content</button>');
    button.click(async () => {
        console.log('AssistantGM | Manually triggering content generation');
        const content = html.find('.editor-content');
        const enriched = await TextEditor.enrichHTML(content.html(), {async: true});
        content.html(enriched);
    });
    html.find('.editor-content').before(button);
});

// Add this line to make sure the module is loaded
console.log('AssistantGM | Module loaded');