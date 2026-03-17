const url = "https://jnqhbeadqrvfcewlznlj.supabase.co/functions/v1/chatbot-ai";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWhiZWFkcXJ2ZmNld2x6bmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjg5MjYsImV4cCI6MjA4ODMwNDkyNn0.xHlhq8_8LRmYqf9dnbcI3aFsU3bq53qQh7FgzSatRO4";

fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "apikey": apiKey
    },
    body: JSON.stringify({
        messages: [{ role: "user", content: "Ola tester" }]
    })
})
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(console.log)
    .catch(console.error);
