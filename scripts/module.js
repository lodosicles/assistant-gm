import { AssistantGM } from './AssistantGM.js';

Hooks.once('init', async function() {
    console.log('AssistantGM | Initializing');
    await AssistantGM.init();

    // Register the custom enricher
    CONFIG.TextEditor.enrichers.push({
        pattern: /@assistant\[([^\]]+)(?:#([^#]+)#)?\]/g,
        enricher: AssistantGM.enrichAssistant.bind(AssistantGM)
    });
});

Hooks.once('ready', async function() {
    console.log('AssistantGM | Ready');
    await AssistantGM.ready();
});
