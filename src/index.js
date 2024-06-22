const registerInDiscovery = require('./discovery/register');
const { fetch_health } = require('./health/controller');
require('./events/exit.event');

function initBitMonX(app) {
  // create a route for the health check url on the app
  app.get('/bitmonx/health', (req, res) => {
    fetch_health(req, res);
  });

  // register the servivce with the discovery service
  // get the config from the config json file
  const config = require('./read_config');
  // get the discovery service url from the config
  const discovery_host = config.discovery.server.host;
  const discovery_port = config.discovery.server.port;

  const max_attempts = config.discovery.meta.max_attempts || 5;
  const retry_interval = config.discovery.meta.retry_interval || 1000;

  registerInDiscovery(
    config,
    discovery_host,
    discovery_port,
    max_attempts,
    retry_interval,
  );
}

module.exports = initBitMonX;
