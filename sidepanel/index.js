console.log("Side Panel index.js loaded");

let pageContent = '';
const MAX_MODEL_CHARS = 4000;
const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const settingsSection = document.body.querySelector('#settingsSection');
let isSettingsVisible = false;
let speaking = false;
// let isSettingsVisible = localStorage.getItem('isSettingsVisible')  === 'true';

// const summaryTypeSelect = document.querySelector('#type');
// const summaryFormatSelect = document.querySelector('#format');
// const summaryLengthSelect = document.querySelector('#length');

// Create variables for the form fields
const litellmUrlInput = document.getElementById('litellmUrl');
const tokenInput = document.getElementById('token');
const modelIdDropdown = document.getElementById('modelId');
const promptInput = document.getElementById('prompt');
// const modelIdDropdown = document.getElementById("modelId");


litellmUrlInput.value = localStorage.getItem('litellmUrl') || '';
tokenInput.value = localStorage.getItem('token') || '';
modelIdDropdown.value = localStorage.getItem('modelId') || '';
promptInput.value = localStorage.getItem('prompt') || "Generate short summary of following in simple English";

const modelsTxt = localStorage.getItem('models');
// let models;
let models = JSON.parse(modelsTxt);
populateModelDropdown()

// Listen for changes in the input fields and update session storage
litellmUrlInput.addEventListener('input', () => {
    localStorage.setItem('litellmUrl', litellmUrlInput.value);
});

tokenInput.addEventListener('input', () => {
    console.log(`Saving token: ${tokenInput.value}`);

    localStorage.setItem('token', tokenInput.value);
});

modelIdDropdown.addEventListener('change', () => {
    console.log('Storing model id');
    localStorage.setItem('modelId', modelIdDropdown.value);
});

promptInput.addEventListener('input', () => {
    localStorage.setItem('prompt', promptInput.value);
});



document.getElementById('loadModelsButton').addEventListener('click', async () => {
    models = await getModels();
    console.log({ models });

    localStorage.setItem('models', JSON.stringify(models));

    while (modelIdDropdown.options.length > 0) {
        modelIdDropdown.remove(0);
    }    
    populateModelDropdown();
});

function populateModelDropdown(){
    if(!models){
        console.log('Models not found in local storage');
        return;
    }
    let modelId = localStorage.getItem('modelId');
    console.log(`Creating model dropdown with value: ${modelId}`);
    
    models.data.forEach(function (model) {
        var option = document.createElement("option");
        option.value = model.id;
        option.text = model.id;
        if (model.id === modelId) {
            option.selected = true;
        }        
        modelIdDropdown.appendChild(option);
    });
}

document.getElementById('resetPromptButton').addEventListener('click', async () => {
    promptInput.value = "Generate short summary of following in simple English";
    localStorage.setItem('prompt', promptInput.value);
});

document.getElementById('getSummaryButton').addEventListener('click', async () => {
    console.log("Btn clicked...");
    // Send a message to the background script
    chrome.runtime.sendMessage({ action: "getText" }, async (response) => {
        console.log("Response from background script: " + response.text);
        showSummary('Loading...');
        let summary = await generateSummary(response.text);
        showSummary(summary);
    });
});


document.getElementById('textToSpeechButton').addEventListener('click', async () => {
    if (speaking) {
        speechSynthesis.cancel();
        speaking = false;
    } else {
        let text = "";

        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type !== 'Control') {
            text = document.selection.createRange().text;
        }

        if (text === "") {
            console.log("Using full summary for speak");
            text = summaryElement.innerHTML;
        } else {
            console.log("Using selected text for speak");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        speaking = true;
    }
});


document.getElementById('settingsButton').addEventListener('click', async () => {
    if (isSettingsVisible) {
        settingsSection.style.display = 'none';
    } else {
        settingsSection.style.display = 'block';
    }
    isSettingsVisible = !isSettingsVisible;
    // localStorage.setItem('isSettingsVisible', isSettingsVisible.toString());
});



async function updateWarning(warning) {
    warningElement.textContent = warning;
    if (warning) {
        warningElement.removeAttribute('hidden');
    } else {
        warningElement.setAttribute('hidden', '');
    }
}

async function showSummary(text) {
    // summaryElement.innerHTML = purify.sanitize(marked.parse(text));
    summaryElement.innerHTML = text;
}




async function generateSummary(text) {
    try {

        const litellmUrl = litellmUrlInput.value;
        const token = tokenInput.value;
        const modelId = modelIdDropdown.value;
        const prompt = promptInput.value;


        // const prompt = "Summarize following text in short and simple English"

        console.log("Calling LiteLLM api...");
        const response = await fetch(`${litellmUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: 'user', content: `${prompt}:\n\n ${text}` }
                ]
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const result = await response.json();
        // const textResult = JSON.stringify(result, null, 2);
        const textResult = result.choices[0].message.content;

        // Return the result
        return textResult;
    } catch (error) {
        console.error('Error summarizing or calling API:', error);
        return { error: error.message };
    }
}

async function getModels() {
    try {
        const litellmUrl = litellmUrlInput.value;
        const token = tokenInput.value;
        console.log("Getting LiteLLM models...");
        const response = await fetch(`${litellmUrl}/models?return_wildcard_routes=false&include_model_access_groups=false`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const result = await response.json();
        return result
    } catch (error) {
        console.error('Error getting models or calling API:', error);
        return { error: error.message };
    }
}