// scripts/module.js

import { AssistantGM } from './AssistantGM.js';

Hooks.once('init', () => {
    if (game.user.isGM) {
        console.log('AssistantGM | Hooking init');
        AssistantGM.init();
    }
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('AssistantGM | Hooking ready');
        AssistantGM.ready();
    }
});

console.log('AssistantGM | Module loaded');