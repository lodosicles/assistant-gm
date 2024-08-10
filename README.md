# AssistantGM

AssistantGM is a module for Foundry VTT that integrates a local large language model into your game via the Open WebUI API. It allows you to generate text based on prompts and selected journal entries, assisting with dynamic content generation. 

I have never coded a module for FoundryVTT before let alone anything in Javascript.  Please forgive any egregious weirdness in the code, my lack of knowledge, and any questionable coding.  I only have limited Python experience. 

Also please note this is obviously not affiliated with Open WebUI or Ollama in any way.

## Features

- Integrates with Open WebUI API for AI text generation.
- Customizable API URL and port.
- Selectable AI models.
- Drawer interface for easy access and interaction.
- Journal entry selection for context-aware generation.
- Resizable and repositionable drawer.

## Limitations

- Responses are returned in markdown format by Open WebUI.  Currently best results for copying and pasting into journals is when the journal entry is also in markdown.
- The journal content is passed to the Open WebUI instance as an addition to your prompt along with the phrase "Use the following content for context in preparing your response:".
  Depending on the context window of the model chosen, and the length of the journal, this may impact the quality of the model's response.  For the time being I recommend you choose a model with a large context window (such as Mistral-Nemo 12B) and setting the context length within Open WebUI as needed under the 'Advanced' menu in 'General' settings.
  Although I still have to test with the context length can be set from within FoundryVTT.
- The journal content is not chunked, and an embedding is not created, for RAG.  This could be one method to enable use of models with smaller context windows.

## Version Notes and Planned Features

### v0.1

- Model selection.
- Prompt generation.
- Journal selection for context in prompt generation via a checkbox system.

### Planned Features

- Reduce the width size of the tab.
- Change colour scheme to better match FoundryVTT,
- Allow user to select whether responses are in markdown or in Prose Mirror.
- Expanded journal selection allowing only individual pages to be sent as context if desired.
- Selected journals to be chunked, and an embedding created when being passed to OpenWebUI.  This will be user selectable in settings.
- Journal selection managed by drag and drop.
- Integration with a text to image system, such as ComfyUI or Automatic1111, to allow generation of images directly within FoundryVTT
- More ...

## Configuration

After installation, you need to configure the module with your Open WebUI API details:

1. Copy the JWT token found under "Settings" and account "Account" in your Open WebUI instance.
2. Go to the "Settings" tab in Foundry VTT.
3. Click to the "Configure Settings" button.
4. Find the "AssistantGM" section.
5. Enter your Open WebUI API URL and JWT token.
6. Click "Save Changes".

You can now click "Fetch Models" to obtain a list of installed large language models.  The module will update this list each time you log in to FoundryVTT.

You will then be able to select a model from the drop down list.  Remember to click "Save Changes" before leaving the settings menu.

## Usage

1. Once configured, you'll see an "AI" tab at the bottom left of your Foundry VTT interface.
2. Click and drag up to open the AssistantGM drawer.
3. Enter your prompt in the text area.
4. Select any relevant journal entries for context by checking the boxes next to their names.
5. Click the "Generate" button to create AI-generated text based on your prompt and selected context.
6. The generated text will appear in the output area, which you can copy and use in your game.
7. Click and drag down to close the AssistantGM drawer.

You can reposition the drawer by clicking and dragging left and right.

## Customization

You can resize the drawer by clicking and dragging the top edge of the drawer when it's open. You can also reposition the drawer horizontally by clicking and dragging the "AI" handle.

## Updating AI Models

To fetch or update the list of available AI models:

1. Go to the module settings.
2. Click the "Fetch Models" button in the AssistantGM section.
3. The available models will be updated, and you can select your preferred model from the dropdown.

## Troubleshooting

If you encounter any issues:

1. Check that your API URL and JWT token are correct in the module settings.
2. Ensure that your Open WebUI API server is running and accessible.

## Support

If you need assistance or want to report a bug, please open an issue on the [GitHub repository](https://github.com/lodosicles/assistant-gm/issues).

## License

This module is licensed under the [MIT License](LICENSE).
