const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Create a new database or open an existing one
const db = new sqlite3.Database('kira-thoughts.db');

// Load example data from example.json
const exampleData = require('./training_data.json').data;

function chatbot(userInput) {
    const lowerCaseInput = userInput.toLowerCase();

    // Check if the input exists in the exampleData
    const exampleEntry = exampleData.find(entry => entry.input.toLowerCase() === lowerCaseInput);

    if (exampleEntry) {
        const botResponse = exampleEntry.output;
        saveToDatabase(userInput, botResponse);
        return botResponse;
    } else {
        saveToDatabase(userInput, "I'm not sure how to respond to that.");
        return "I'm not sure how to respond to that.";
    }
}

function saveToDatabase(userInput, botResponse) {
    const timestamp = new Date().toISOString();
    db.run("INSERT INTO chat_history (user_input, bot_response, timestamp) VALUES (?, ?, ?)",
        [userInput, botResponse, timestamp],
        (err) => {
            if (err) {
                console.error('Error saving to database:', err.message);
            } else {
                console.log('Saved to database:', userInput, botResponse);
            }
        });
}

// Create chat_history table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_input TEXT,
    bot_response TEXT,
    timestamp TEXT
)`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        // Continuous loop for training and interaction
        setInterval(() => {
            const randomExampleEntry = exampleData[Math.floor(Math.random() * exampleData.length)];
            const userInput = randomExampleEntry.input;
            const botResponse = chatbot(userInput);
            console.log(`User: ${userInput}`);
            console.log(`Bot: ${botResponse}`);
            console.log("----");
        }, 5000); // Delay of 5000 milliseconds (5 seconds)

        // Don't close the database connection here
    }
});
