export default (handler: () => void) => {
    const exitHandler = (options) => {
        if (options.exit) process.exit();
        handler();
    }

    // Do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));

    // Catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));

    // Catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

    // Catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}