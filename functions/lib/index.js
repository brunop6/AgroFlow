"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherData = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const node_fetch_1 = require("node-fetch");
const functions = require("firebase-functions");
exports.getWeatherData = (0, https_1.onRequest)((request, response) => {
    const lat = request.query.lat;
    const lon = request.query.lon;
    const part = request.query.part;
    const apiKey = functions.config().openweathermap.key;
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${part}&appid=${apiKey}`;
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    (0, node_fetch_1.default)(url)
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
//# sourceMappingURL=index.js.map