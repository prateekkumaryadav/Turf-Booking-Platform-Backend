const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Outputs JSON format which will be sent to Logstash
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = logger;
