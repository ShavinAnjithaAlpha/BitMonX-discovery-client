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

## Contributors

- [Shavin Anjitha](http://shavinanjitha.me)

## Acknowledgement

## Changelog

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
