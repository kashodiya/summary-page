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


(function () {
	let mainData = '';
	const selectedText = getSelectedText();
	if (selectedText.length > 0) {
		console.log('Text is selected.');
		mainData = selectedText;
	} else {
		console.log('No text is selected.');
		mainData = extractMainText()
	}

	console.log(mainData);
	return mainData;
})();