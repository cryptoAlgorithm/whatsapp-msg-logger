const pino = require('pino');

// Create a logging instance
export default pino({
    level: 'error',
});
