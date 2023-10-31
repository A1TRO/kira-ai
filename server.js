const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/chat', (req, res) => {
    const userInput = req.body.text.toLowerCase();
    chatbot(userInput)
        .then(botResponse => {
            res.json({ reply: botResponse });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ error: "An error occurred while processing your request." });
        });
});

function chatbot(userInput) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('kira-thoughts.db');

        db.serialize(() => {
            const query = `SELECT bot_response FROM chat_history WHERE user_input = ?`;
            db.get(query, [userInput], async (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        resolve(row.bot_response);
                    } else {
                        try {
                            const webResponse = await axios.get('https://example.com'); // Replace with the URL you want to scrape
                            const $ = cheerio.load(webResponse.data);
                            const scrapedData = $('your-selector').text(); // Replace 'your-selector' with the appropriate CSS selector

                            if (scrapedData) {
                                // Insert scraped data into the database
                                const insertQuery = `INSERT INTO chat_history (user_input, bot_response, timestamp) VALUES (?, ?, ?)`;
                                const currentTime = new Date().toISOString();
                                db.run(insertQuery, [userInput, scrapedData, currentTime], insertErr => {
                                    if (insertErr) {
                                        console.error(insertErr);
                                    }
                                });

                                resolve(scrapedData);
                            } else {
                                resolve("I'm not sure how to respond to that.");
                            }
                        } catch (scrapeErr) {
                            console.error(scrapeErr);
                            resolve("I'm not sure how to respond to that.");
                        }
                    }
                }
                db.close();
            });
        });
    });
}


// Handle adding a message to the database
app.post('/add-message', (req, res) => {
    const message = req.body.message;
    const db = new sqlite3.Database('kira-thoughts.db');

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const timestamp = new Date().toISOString(); // Get current timestamp

    // Insert message into chat_history table
    db.run(
        "INSERT INTO chat_history (user_input, bot_response, timestamp) VALUES (?, ?, ?)",
        [message.userInput, message.botResponse, timestamp],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error adding message to the database' });
            }

            res.status(201).json({ message: 'Message added to the database' });
        }
    );
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
