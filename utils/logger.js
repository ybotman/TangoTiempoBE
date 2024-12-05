const { createLogger, format, transports } = require("winston");
const path = require("path");

// Define log directory
const logDirectory = path.join(__dirname, "public", "logs");

const logger = createLogger({
  level: "info", // Adjust level as needed
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(), // Log to console
    new transports.File({
      filename: path.join(logDirectory, "application.log"),
    }), // Log to file
  ],
});

module.exports = logger;
