const deregister = require('../discovery/deregister');
const { getServiceId, getInstanceId } = require('../instance.details');

// Listen for the exit event
process.on('exit', (code) => {
  deregister(getServiceId(), getInstanceId());
});

// Listen for SIGINT (e.g., Ctrl+C in the terminal)
process.on('SIGINT', () => {
  deregister(getServiceId(), getInstanceId());
  //   process.exit(1); // Exit with a failure code
});

// Listen for SIGTERM (sent from system)
process.on('SIGTERM', () => {
  deregister(getServiceId(), getInstanceId());
  //   process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  deregister(getServiceId(), getInstanceId());
  //   process.exit(1); // Exit with a failure code
});
