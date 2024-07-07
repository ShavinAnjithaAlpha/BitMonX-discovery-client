const ServiceHealth = require('./health');

/*
 * Fetch health of the service and return it as JSON
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - JSON response
 * @public
 * @static
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
