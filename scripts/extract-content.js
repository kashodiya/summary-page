// Helper function to calculate the text density of an element
function textDensity(element) {
    const text = element.textContent.trim();
    const html = element.innerHTML.trim();
    if (!text || !html) return 0;
    const textLength = text.length;
    const htmlLength = html.length;
    return textLength / htmlLength;
}

// Helper function to check if an element is likely part of the main content
function isMainContent(element) {
    const densityThreshold = 0.2; // Adjust this threshold as needed
    const minTextLength = 100;    // Minimum text length to consider
    const tagName = element.tagName.toLowerCase();
    const density = textDensity(element);
    // Common tags that are usually not part of the main content
    const nonContentTags = ['header', 'footer', 'nav', 'aside', 'script', 'style', 'img'];
    
    // Check if the element contains any non-text content
    const containsNonTextContent = Array.from(element.children).some(child => {
        return child.tagName.toLowerCase() === 'img' || child.tagName.toLowerCase() === 'script';
    });
    
    return (
        tagName === 'div' || tagName === 'section' || tagName === 'article' || tagName === 'p' ||
        tagName === 'main'
    ) && density > densityThreshold && element.textContent.length > minTextLength &&
        !nonContentTags.includes(tagName) && !containsNonTextContent;
}

// Recursive function to extract text from the main content
function extractTextFromElement(element, mainText) {
    if (isMainContent(element)) {
        mainText.push(element.textContent);
    } else {
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                extractTextFromElement(child, mainText);
            }
        });
    }
}

// Function to extract text from the main content
function extractMainText() {
    let mainText = [];
    const body = document.querySelector('body');
    extractTextFromElement(body, mainText);
    return mainText.filter(text => text.trim().length > 0).join('\n\n').trim();
}

// Function to get the selected text
function getSelectedText() {
	let selectedText = '';
	if (window.getSelection) {
		selectedText = window.getSelection().toString();
	} else if (document.selection && document.selection.type !== 'Control') {
		selectedText = document.selection.createRange().text;
	}
	return selectedText;
}

async function fetchTranscript() {
    if (!window.location.href.includes('youtube.com/watch')) {
        console.log('This script only works on YouTube video pages.');
        return null;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
        console.log('Could not find video ID.');
        return null;
    }

    // Find the transcript button and click it if it's not already open
    const transcriptButton = document.querySelector('button[aria-label="Show transcript"]');
    if (transcriptButton) {
        transcriptButton.click();
    }

    // Wait for the transcript to load
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    const transcriptElements = document.querySelectorAll('yt-formatted-string.ytd-transcript-segment-renderer');
    if (transcriptElements.length === 0) {
        console.log('Transcript not found. It may not be available for this video.');
        return null;
    }

    let fullTranscript = '';
    transcriptElements.forEach(element => {
        fullTranscript += element.textContent + ' ';
    });

    return fullTranscript.trim();
}


(async function () {
	let mainData = '';

    if(window.location.hostname.includes('youtube.com')){
        mainData = await fetchTranscript();
    }else{
        const selectedText = getSelectedText();
        if (selectedText.length > 0) {
            console.log('Text is selected.');
            mainData = selectedText;
        } else {
            console.log('No text is selected.');
            mainData = extractMainText()
        }
    }

	console.log(mainData);
	return mainData;
})();