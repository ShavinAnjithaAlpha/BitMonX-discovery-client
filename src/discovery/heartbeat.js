const { getServiceId, getInstanceId } = require('../instance.details');
const registerInDiscovery = require('./register');

const DEFAULT_HEARTBEAT_INTERVAL = 10000;

function sendHeartBeat() {
  // get the heratbeat interval from the configurations
  const config = require('../read_config');
  const interval =
    config.service?.heartbeat?.interval ?? DEFAULT_HEARTBEAT_INTERVAL;

  // disovery server
  const discovery_host = config.discovery.server.host;
  const discovery_port = config.discovery.server.port;
  const discovery_url = `http://${discovery_host}:${discovery_port}/bitmonx/heartbeat?serviceId=${getServiceId()}&instanceId=${getInstanceId()}`;

  // create a periodic tasks that can send the heartbeat signal to the discovery server
  const heartbeatTask = setInterval(() => {
    fetch(discovery_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        console.log('[HEARTBEAT] Sending heartbeat to the discovery server');
      })
      .catch((err) => {
        // try to reregistered in the discovery server if available
        registerInDiscovery(
          config,
          discovery_host,
          discovery_port,
          config.discovery.meta.max_attempts,
          config.discovery.meta.retry_interval,
        );
        // clear the heartbeat task
        clearInterval(heartbeatTask);
        return;
      });
  }, interval);
}

module.exports = sendHeartBeat;
