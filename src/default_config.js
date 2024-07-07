module.exports = {
  requestMiddleware: (data, callback) => {
    callback(data);
  },
  discovery: {
    meta: {
      max_attempts: 10,
      retry_interval: 1000,
      fetch_registry_interval: 30000,
    },
  },
  service: {
    health_check_url: '/bitmonx/health',
    health_check_interval: 5000,
    timeout: 5000,
    heartbeat: {
      interval: 30000,
    },
  },
  logger: {
    level: 'debug',
  },
};
