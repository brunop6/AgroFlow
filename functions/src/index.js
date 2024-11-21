const { onRequest } = require('firebase-functions/v1/https');
const stripe = require('stripe')('sk_test_51OS3stIMTZd98XZGRj677cZL2kMsRAew8KtA2uzbFBi4Vp1jmeKhnjkmNE8Nccee3BuSvqCthjkXzd6Ll4Ztx9Aw00X5u5C42G');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post('/getWeatherData', async (request, response) => {
  const lat = request.body.lat;
  const lon = request.body.lon;
  const part = request.body.part || '';
  const apiKey = functions.config().openweathermap.key;

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${part}&appid=${apiKey}`;

  fetch(url)
    .then(apiResponse => {
      if (!apiResponse.ok) {
        throw new Error('Network response was not ok');
      }
      return apiResponse.json();
    })
    .then(data => {
      response.send(data);
    })
    .catch(error => {
      logger.error('Error making the request:', error);
      response.status(500).send('Error making the request');
    });
});

exports.AgroFlowAPI = onRequest(app);