function deregister(service_id, instance_id) {
  // read the config from the cofing.json file
  const config = require('../read_config');
  const host = config.discovery.server.host;
  const port = config.discovery.server.port;

  fetch(
    `http://${host}:${port}/bitmonx/deregister?serviceId=${service_id}&instanceId=${instance_id}`,
    {
      method: 'DLELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
    .then((res) => {
      console.log('service deregistered successfully');
      return;
    })
    .catch((err) => {
      console.log('Could not deregister the service');
    });
}

module.exports = deregister;
