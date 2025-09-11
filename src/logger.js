const winston = require('winston');

// Define the format for our logs. We want a timestamp, the log level, and the message.
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
);

// Create the main logger instance.
const logger = winston.createLogger({
  // By default, we'll log anything with a level of 'info' or higher (info, warn, error).
  level: 'info', 
  format: logFormat,
  // This is where the logs will be sent. We call these "transports".
  transports: [
    // Transport 1: A file for all critical errors.
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    
    // Transport 2: A file for all logs (info and above).
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// This is a crucial part for development.
// If the server is NOT running in a "production" environment, we also add a transport to log to the console.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Add colors for readability
      winston.format.simple()     // A simple, clean format for the console
    ),
  }));
}

// Export the configured logger so we can use it anywhere in our app.
module.exports = logger;
