import express from "express";
import * as mm from "music-metadata";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import stringSimilarity from "string-similarity";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FUNCTION DECLARATION BELOW START

async function extractCoverArt(filePath) {
    try {
        const metadata = await mm.parseFile(filePath);

        // Check if there is embedded artwork
        const picture = metadata.common.picture;
        if (picture && picture.length > 0) {
            const cover = picture[0]; // Typically, the first picture is the cover art

            // Write the cover art to a file
            const outputPath = path.join(__dirname, "cover.jpg");
            fs.writeFileSync(outputPath, cover.data);
            console.log(`Cover art saved to ${outputPath}`);
        } else {
            console.log("No cover art found in the MP3 file.");
            return error;
        }
    } catch (error) {
        console.error("Error reading metadata:", error);
        res.status(500).send("Error loading song");
    }
}

function findClosestMatch(query, files) {
    const matches = stringSimilarity.findBestMatch(query, files);
    return matches.bestMatch.rating >= 0.1 ? matches.bestMatch.target : null;
}

// FUNCTION DECLARATION ABOVE END
// Server init code below: -- DO NOT EDIT DURING PRODUCTION
const app = express();
const PORT = 3000;

app.use(express.static("static"));

// Handle requests for the cover art
app.get("/cover", (req, res) => {
    console.log("Received request for /cover\nQuery: " + req.query.q);
    const query = req.query.q;

    if (!query) {
        return res.status(400).send("Query parameter 'q' is required.");
    }

    // Search for the closest match in the music folder
    const musicFolder = path.join(__dirname, "music");

    fs.readdir(musicFolder, (err, files) => {
        if (err) {
            console.error("Error reading music folder:", err);
            return res.status(500).send("Error reading music folder.");
        }

        // Filter only MP3 files
        const mp3Files = files.filter(file => path.extname(file) === ".mp3");

        if (mp3Files.length === 0) {
            console.log("nothing found");
            return res.status(404).sendFile(path.join(__dirname, "tempCover.png"));
        }

        const closestMatch = findClosestMatch(query, mp3Files);

        if (!closestMatch) {
            console.log("No close matches found.");
            return res.status(404).sendFile(path.join(__dirname, "tempCover.png"));
        }

        const matchedFile = path.join(musicFolder, closestMatch);
        console.log(`Closest match found: ${closestMatch}`);

        // Extract cover art from the matched file
        extractCoverArt(matchedFile).then(() => {
            res.sendFile(path.join(__dirname, "cover.jpg"));
        }).catch(error => {
            console.error("Error extracting cover art:", error);
            res.sendFile(path.join(__dirname, "tempCover.png"));
        });
    });
});


// Handle requests for audio files
app.get("/songs", (req, res) => {
    console.log("Received request for /songs\nQuery: " + req.query.q);
    const query = req.query.q;

    if (!query) {
        return res.status(400).send("Query parameter 'q' is required.");
    }

    // Search for the closest match in the music folder
    const musicFolder = path.join(__dirname, "music");

    fs.readdir(musicFolder, (err, files) => {
        if (err) {
            console.error("Error reading music folder:", err);
            return res.status(500).send("Error reading music folder.");
        }

        // Filter only MP3 files
        const mp3Files = files.filter(file => path.extname(file) === ".mp3");

        if (mp3Files.length === 0) {
            return res.status(404).send("No audio files found in the music folder.");
        }

        const closestMatch = findClosestMatch(query, mp3Files);

        if (!closestMatch) {
            return res.status(404).send("No close matches found.");
        }

        const matchedFile = path.join(musicFolder, closestMatch);
        console.log(`Closest match found: ${closestMatch}`);

        // Send the matched audio file
        res.sendFile(matchedFile, err => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).send("Error sending file.");
            }
        });
    });
});

app.listen(PORT, () => {
    console.log("Server is running at http://localhost:3000");
});