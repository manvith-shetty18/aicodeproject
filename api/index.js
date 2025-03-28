const serverless = require("serverless-http");
const app = require("./server"); // Import your Express app from server.js

module.exports = serverless(app);
