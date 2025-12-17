// Import the necessary modules
const express = require('express'); // A framework for creating a web server
const fs = require('fs'); // A module for working with the file system (reading/writing files)
const path = require('path'); // A module for working with file paths
const cors = require('cors'); // Middleware for handling CORS (Cross-Origin Resource Sharing)
const crypto = require('crypto'); // A module for cryptographic functions, used for generating IDs

// Create an instance of the Express application
const app = express();
// Define the port on which the server will run
const PORT = 3000;
// Construct the absolute path to the data file
const CSV_PATH = path.join(__dirname, 'Data', 'competitors.csv');


// Use CORS to allow requests from other domains (e.g., from our frontend)
app.use(cors());
// Middleware for parsing the JSON body of incoming requests
app.use(express.json());
// Middleware for serving static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static('public'));

// A function for parsing (processing) data from CSV format
const parseCSV = (data) => {
    // Convert the data to a string, trim whitespace from the edges, split into lines by the newline character, and filter out empty lines
    const lines = data.toString().trim().split('\n').filter(line => line.trim() !== '');
    // If there are fewer than two lines (header + data), return an empty array
    if (lines.length < 2) return [];
    // The first line contains the headers. Split it by commas and trim whitespace from each header.
    const headers = lines[0].split(',').map(h => h.trim());
    // Process the remaining lines (data)

    return lines.slice(1).map(line => {
        // Split the data line by commas
        const values = line.split(',').map(v => v.trim());
        // If the number of values doesn't match the number of headers, the row is invalid—return null.
        if (values.length !== headers.length) return null;
        // Create an object for the current row
        let obj = {};
        // Populate the object: assign each header its corresponding value
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    }).filter(Boolean); // Filter out all null values that may have appeared due to invalid rows
};

// --- API Endpoints  ---

// Endpoint for retrieving the list of all competitors (GET method)
app.get('/api/competitors', (req, res) => {
    // Check if the CSV file exists
    if (!fs.existsSync(CSV_PATH)) {
        return res.status(404).json({ message: 'Competitors file not found.' });
    }
    // Read the file with UTF-8 encoding
    fs.readFile(CSV_PATH, 'utf8', (err, data) => {
        // If an error occurs while reading, send a 500 error
        if (err) {
            return res.status(500).json({ message: 'Error reading competitors file.' });
        }
        // Parse the CSV data
        const competitors = parseCSV(data);
        // Send the data in JSON format
        res.json(competitors);
    });
});

// Endpoint for adding a new competitor (POST method)
app.post('/api/competitors', (req, res) => {
    // Extract data from the request body
    const { companyName, registrationDate, status } = req.body;

    // Check whether all required data has been provided
    if (!companyName || !registrationDate || !status) {
        return res.status(400).json({ message: 'Company name and registration date are required.' });
    }

    // Create a new competitor object with a unique RegNumber
    const newCompetitor = {
        RegNumber: `REG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        CompanyName: companyName,
        RegistrationDate: registrationDate,
        Status: status
    };

    // Construct a string to append to the CSV file
    const csvLine = `\n${newCompetitor.RegNumber},${newCompetitor.CompanyName},${newCompetitor.RegistrationDate},${newCompetitor.Status}`;

    // Append the new row to the end of the file
    fs.appendFile(CSV_PATH, csvLine, 'utf8', (err) => {
        // If an error occurs while writing, send a 500 error
        if (err) {
            return res.status(500).json({ message: 'Error saving new competitor.' });
        }
        // Send a successful 201 (Created) status and the new competitor's data
        res.status(201).json(newCompetitor);
    });
});

// Main endpoint that serves the application's HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server and begin listening on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
