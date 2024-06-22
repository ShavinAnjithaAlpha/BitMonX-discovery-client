const ServiceHealth = require('./health');

function fetch_health(req, res) {
  const health = ServiceHealth.builder()
    .fetchCpuUsage()
    .fetchMemoryUsage()
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
