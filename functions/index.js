const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { publishMessage } = require('./src/publishMessage');

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

app.post('/publishMessage', (req, res) => {
  const { culture, humidity, timestamp } = req.body;

  if (!culture || !humidity || !timestamp) {
    return res.status(400).send('Missing required fields: culture, humidity, timestamp');
  }

  publishMessage(culture, humidity, timestamp);

  res.status(200).send('Mensagem publicada com sucesso');
});

exports.api = functions.https.onRequest(app);