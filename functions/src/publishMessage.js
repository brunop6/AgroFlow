const mqtt = require('mqtt');

function publishMessage(culture, humidity, timestamp) {
  const brokerUrl = 'wss://test.mosquitto.org:8081/mqtt';
  const client = mqtt.connect(brokerUrl); // Use uma variável local para o cliente MQTT

  client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    const topic = 'sensors/humidity';
    const message = JSON.stringify({ culture, humidity, timestamp });

    client.publish(topic, message, (err) => {
      if (err) {
        console.error('Erro ao publicar a mensagem:', err);
      } else {
        console.log('Mensagem publicada com sucesso');
      }
      client.end(); // Encerra a conexão após publicar a mensagem
    });
  });

  client.on('error', (error) => {
    console.error('Erro na conexão com o broker MQTT:', error);
  });
}

module.exports = { publishMessage };