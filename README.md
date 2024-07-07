# BitMonX Disocvery Client for Node.js

A Node.js client for the BisMonX Discovery Server. This client is used to register a service with the discovery server and to send health data to the discovery server.

## Features

- Automatic registration of services with the discovery server
- Heartbeat mechanism to renew it's lease with the discovery server
- endpoint for the discovery server to query the health of the service
- Automatic reregistration of services in case of a network failure with retry mechanism
- Automatic Service registry fetching to cache the services in the client
- querying capability to get the services info from the cache as well as the discovery server

## Installing

Install the package using npm:

```shell
npm install bitmonx-discovery-client --save-dev
```

## Usage

### Add BitMonX Discovery Client to your project

First, create a json config file name `bitmonx.config.json` in the root of your project. The file should contain the following fields:

```json
{
  "discovery": {
    "server": {
      "host": "localhost",
      "port": 8765,
      "protocol": "http"
    },
    "meta": {
      "max_attempts": 10,
      "retry_interval": 1000,
      "fetch_registry_interval": 5000
    }
  },
  "service": {
    "name": "service_name",
    "instance_name": "app_name",
    "mapping": "/api/v1/mapping",
    "host": "localhost",
    "port": 8888,
    "health_check_url": "/bitmonx/health",
    "health_check_interval": 3000,
    "timeout": 5000,
    "heartbeat": {
      "interval": 10000
    },
    "metadata": {
      "protocol": "http",
      "version": "1.0.0",
      "environment": "dev"
    }
  }
}
```

The bitmonx-discovery-client package provides a class `BitMonX` that you can use to start the client. The `init` method of the class takes an express app or http server as an argument. The client will start the service registration and health check endpoints on the express app.

```javascript
const express = require('express');
const BitMonX = require('bitmonx-discovery-client');
// Create an express app
const app = express();

// Create an instance of BitMonX client
const bitmonx = new BitMonX();
// start the client with the express app
bitmonx.init(app);
```

### Register with BitMonX Discovery & start application heartbeats

```javascript
const app = express();
bitmonx.init(app);
```

### De-register with BitMonX Discovery & stop application heartbeats

```javascript
bitmonx.stop();
```

### Get service ID of the application

```javascript
const serviceId = bitmonx.getServiceId();
```

### Get instance ID of the application

```javascript
const instanceId = bitmonx.getInstanceId();
```

### Providing Custom Request Middleware

The bitmonx client exposes the ability to modify the outgoint request options object prior to the request being made for BitMonX dicovery server. This will be called for every request made to the discovery server. If the middleware returns anything other than an object, the discovery request will immediately fail and perform a retry in background if configured.

```javascript
const bitmonx = new BitMonX({
  requestMiddleware: (options, callback) => {
    // Modify the options object
    options.headers['Authorization'] = ' Bearer ' + 'token';
    // Call the callback with the modified options object
    callback(options);
});
```

### Querying the local cache for services

The bitmonx client caches the services that are registered with the discovery server. The cache will be invalidate after every fresh registry fetching from the discovery server. You can query the cache to get the services that are registered with the discovery server.

You can query the instances by their registerd instance name or service name.
It will return an object containing the service information.

```javascript
const instance = bitmonx.getInstanceByInstanceName('app_name');
const instances = bitmonx.getInstancesByServiceName('service_name');
```

Also, you can query the cache using the service mapping. It will return an object containing the service information.

```javascript
const instances = bitmonx.getServiceByMapping('/api/v1/mapping');
```

## Advanced Configuration Options

| Option                                   | Description                                                                          | Default           |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ----------------- |
| `requestMiddleware`                      | The middleware function to modify the request options object                         | `null`            |
| `discovery.server.host`                  | The host of the discovery server                                                     | `NA`              |
| `discovery.server.port`                  | The port of the discovery server                                                     | `NA`              |
| `discovery.server.protocol`              | The protocol of the discovery server                                                 | `http`            |
| `discovery.meta.max_attempts`            | The maximum number of attempts to retry the request                                  | `10`              |
| `discovery.meta.retry_interval`          | The interval between retries in milliseconds                                         | `1000`            |
| `discovery.meta.fetch_registry_interval` | The interval between fetching the registry from the discovery server in milliseconds | `30000`           |
| `discovery.meta.fetch_regsitry_filter`   | The filter to fetch the registry from the discovery server                           | `ALL`             |
| `service.name`                           | The name of the service                                                              | `NA`              |
| `service.instance_name`                  | The name of the instance                                                             | `NA`              |
| `service.mapping`                        | The mapping of the service                                                           | `NA`              |
| `service.host`                           | The host of the service                                                              | `NA`              |
| `service.port`                           | The port of the service                                                              | `NA`              |
| `service.health_check_url`               | The health check URL of the service                                                  | `/bitmonx/health` |
| `service.health_check_interval`          | The interval between health checks in milliseconds                                   | `30000`           |
| `service.timeout`                        | The timeout for the health check in milliseconds                                     | `30000`           |
| `service.heartbeat.interval`             | The interval between heartbeats in milliseconds                                      | `30000`           |
| `service.metadata.protocol`              | The protocol of the service                                                          | `http`            |
| `service.metadata.version`               | The version of the service                                                           | `1.0.0`           |
| `service.metadata.environment`           | The environment of the service                                                       | `dev`             |

## Events

BitMonX client is an instance of EventEmitter. It emits the following events:

| Event Name        | Description                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `started`         | Emitted when the service is started and the client is initialized               |
| `registered`      | Emitted when the service is successfully registered with the discovery server   |
| `deregistered`    | Emitted when the service is successfully deregistered with the discovery server |
| `heartbeat`       | Emitted when the service sends a heartbeat to the discovery server              |
| `registryFetched` | Emitted when the service fetches the registry from the discovery server         |

## Contributors

- [Shavin Anjitha](http://shavinanjitha.me)

## Acknowledgement

This project is developed as a part of the BitMonX project.

This project would not have been possible without the support from:

- The developers of _async_ and _lodash_, which are used in this project.

This project is isnpired from the [Eureka Client](https://github.com/Netflix/eureka), which is a Java client for the Eureka server which is used to register services with the Eureka server.

## Changelog

See the [CHANGELOG](CHANGELOG.md) file for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```

```

```

```
