const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/getWeatherData', async (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;
  const part = req.query.exclude || '';
  const apiKey = 'b0fab8755b0cccedc275a37a05774649';

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${part}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching weather data');
  }
});

exports.api = functions.https.onRequest(app);