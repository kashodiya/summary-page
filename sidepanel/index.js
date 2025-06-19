console.log("Side Panel index.js loaded");

let pageContent = '';
const MAX_MODEL_CHARS = 4000;
const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const settingsSection = document.body.querySelector('#settingsSection');
let isSettingsVisible = false;
// let isSettingsVisible = localStorage.getItem('isSettingsVisible')  === 'true';

// const summaryTypeSelect = document.querySelector('#type');
// const summaryFormatSelect = document.querySelector('#format');
// const summaryLengthSelect = document.querySelector('#length');

// Create variables for the form fields
const litellmUrlInput = document.getElementById('litellmUrl');
const tokenInput = document.getElementById('token');
const modelIdInput = document.getElementById('modelId');
const promptInput = document.getElementById('prompt');


litellmUrlInput.value = localStorage.getItem('litellmUrl') || '';
tokenInput.value = localStorage.getItem('token') || '';
modelIdInput.value = localStorage.getItem('modelId') || '';
promptInput.value = localStorage.getItem('prompt') || "Generate short summary of following in simple English";

// Listen for changes in the input fields and update session storage
litellmUrlInput.addEventListener('input', () => {
    localStorage.setItem('litellmUrl', litellmUrlInput.value);
});

tokenInput.addEventListener('input', () => {
    console.log(`Saving token: ${tokenInput.value}`);
    
    localStorage.setItem('token', tokenInput.value);
});

modelIdInput.addEventListener('input', () => {
    localStorage.setItem('modelId', modelIdInput.value);
});

promptInput.addEventListener('input', () => {
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
        const modelId = modelIdInput.value;
        const prompt = promptInput.value;


        // const prompt = "Summarize following text in short and simple English"

        console.log("Calling LiteLLM api...");
        const response = await fetch(litellmUrl, {
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
        console.error('Error extracting content or calling API:', error);
        return { error: error.message };
    }
}