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

// Add this line to make sure the module is loaded
console.log('AssistantGM | Module loaded');
