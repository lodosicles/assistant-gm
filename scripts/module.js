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

Hooks.on('renderSettingsConfig', (app, html, data) => {
    const modelSetting = html.find(`select[name="assistant-gm.modelName"]`);
    const fetchButton = $('<button type="button" id="fetch-models">Fetch Models</button>');
    modelSetting.after(fetchButton);
    fetchButton.click(async (event) => {
        event.preventDefault();
        await AssistantGM.updateAvailableModels(app);
    });
});
