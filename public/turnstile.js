let turnstileToken = null;

// Callback: Automatically called by Turnstile when the challenge is solved
function onTurnstileSuccess(token) {
  console.log("Turnstile Challenge Solved. Token received.");
  turnstileToken = token;
}

// Callback: Automatically called if the token expires (default 5 minutes)
function onTurnstileExpired() {
  console.warn("Turnstile Token expired. Resetting...");
  turnstileToken = null;
  // Automatically reload a fresh challenge
  turnstile.reset();
}

async function sendDataToProxy() {
  const output = document.getElementById("statusOutput");

  // Fallback check if user hasn't solved the challenge yet
  if (!turnstileToken) {
    // Alternatively, attempt reading directly from the widget runtime
    turnstileToken = turnstile.getResponse();
  }

  if (!turnstileToken) {
    output.innerText = "Please complete the bot check first.";
    return;
  }

  output.innerText = "Sending request to proxy...";

  try {
    const response = await fetch("http://localhost:8088/turnstile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass the token in the custom header expected by your FastAPI endpoint
        "X-Turnstile-Token": turnstileToken
      },
      // Ensure cookies set by the proxy (like 'edi-token') are accepted by the browser
      credentials: "include", 
      body: JSON.stringify({
        query: "example payload"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Server returned status ${response.status}`);
    }

    const data = await response.json();
    output.innerText = "Success! Cookie set and proxy responded.";
    console.log("Server Response:", data);

  } catch (error) {
    console.error("Request failed:", error);
    output.innerText = `Error: ${error.message}`;
  } finally {
    // CRITICAL: Turnstile tokens are single-use. 
    // Always reset the widget so a new token is ready for the next request.
    turnstileToken = null;
    turnstile.reset();
  }
}
