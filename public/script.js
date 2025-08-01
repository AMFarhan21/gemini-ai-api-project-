const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// This function creates a message element, appends it to the chat box,
// and returns the element so it can be modified later (e.g., for placeholders).
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  // Scroll to the bottom of the chat box to show the latest message
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the created element
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Add user's message to the chat box
  appendMessage('user', userMessage);
  input.value = ''; // Clear the input field

  // 2. Show a temporary "Thinking..." message and store the element
  const botPlaceholder = appendMessage('bot', 'Thinking...');

  console.log("PRODUCTION ENDPOINT: ", process.env.PRODUCTION_ENDPOINT)

  try {
    // 3. Send the user's message to the backend
    const response = await fetch("https://gemini-ai-api-project.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The backend expects a 'message' array
      body: JSON.stringify({
        message: [{
          role: 'user',
          content: userMessage
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null); // Try to get error details
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(`Server error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // 4. Replace the "Thinking..." message with the AI's reply
    if (data && data.result) {
      botPlaceholder.textContent = data.result;
    } else {
      // 5. Handle cases where no result is received
      botPlaceholder.textContent = "Sorry, no response received.";
    }
  } catch (error) {
    console.error("Error fetching response:", error);
    // 5. Handle fetch errors
    botPlaceholder.textContent = "Failed to get response from server.";
  } finally {
    // Ensure the chat box is scrolled to the bottom after the response
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
