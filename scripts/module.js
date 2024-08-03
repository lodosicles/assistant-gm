// scripts/module.js

import { AssistantGM } from './AssistantGM.js';

Hooks.once('init', async function() {
    console.log('AssistantGM | Initializing');
    await AssistantGM.init();
});

Hooks.once('ready', async function() {
    console.log('AssistantGM | Ready');
    await AssistantGM.ready();

    // Add event listener for assistant content updates
    document.addEventListener('assistantContentUpdated', event => {
        const element = event.detail.element;
        const journalSheet = element.closest('.sheet.journal-sheet');
        if (journalSheet) {
            const journalId = journalSheet.dataset.documentId;
            const journal = game.journal.get(journalId);
            if (journal) {
                const content = journalSheet.querySelector('.editor-content').innerHTML;
                journal.update({ content: content });
            }
        }
    });
});

// Add this line to make sure the module is loaded
console.log('AssistantGM | Module loaded');
