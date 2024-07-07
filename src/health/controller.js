/**
 * @fileoverview This file contains the controller for the health of the service.
 * @requires ServiceHealth
 * @author Shavin Anjitha
 */

const ServiceHealth = require('./health');

/**
 * Fetch the health of the service
 * @description This function fetches the health of the service such as cpu usage, memory usage, disk usage, uptime and status of the service
 *  and then send the health as a JSON response to the client, when the client requests for the health of the service.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {void}
 */
function fetch_health(req, res) {
  const health = ServiceHealth.builder()
    .fetchCpuUsage()
    .fetchMemoryUsage()
    .fetchDiskUsage()
    .fetchUpTime()
    .setStatus('OK')
    .build();

  res.setHeader('Content-Type', 'application/json');
  res.send(health.toJSON());
  res.end();
}

module.exports = {
  fetch_health,
};
