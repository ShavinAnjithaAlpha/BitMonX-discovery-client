/**
 * @description This class fetches the health of the service such as cpu usage, memory usage, disk usage, uptime and status of the service and then send the health as a JSON response to the client, when the client requests for the health of the service.
 * @requires os
 * @requires getDiskUsage
 * @exports ServiceHealth
 * @class
 * @example
 * const health = ServiceHealth.builder()
 * .fetchCpuUsage()
 * .fetchMemoryUsage()
 * .fetchDiskUsage()
 * .fetchUpTime()
 * .setStatus('OK')
 * .build();
 * console.log(health.toJSON());
 * @author Shavin Anjitha
 */

const { getDiskUsage } = require('./disk_usage');
const os = require('os');

module.exports = class ServiceHealth {
  /**
   * @description This class fetches the health of the service such as cpu usage, memory usage, disk usage, uptime and status of the service and then send the health as a JSON response to the client, when the client requests for the health of the service.
   * @requires os
   * @requires getDiskUsage
   * @exports ServiceHealth
   * @class
   * @example
   * const health = ServiceHealth.builder()
   *  .fetchCpuUsage()
   * .fetchMemoryUsage()
   * .fetchDiskUsage()
   * .fetchUpTime()
   * .setStatus('OK')
   * .build();
   * console.log(health.toJSON());
   **/

  // properties
  cpu_usage;
  memory_usage;
  disk_usage;
  uptime;
  status;

  constructor() {}

  fetchCpuUsage() {
    const cpus = os.cpus();
    this.cpu_usage = cpus.map((cpu) => {
      let total = 0;
      for (let type in cpu.times) {
        total += cpu.times[type];
      }
      return {
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times,
        total: total,
        usage: (1 - cpu.times.idle / total) * 100,
      };
    });

    // calculate the average CPU usage
    let total = 0;
    let idle = 0;
    this.cpu_usage.forEach((cpu) => {
      total += cpu.total;
      idle += cpu.times.idle;
    });
    // push the average CPU usage data into the CPU info array
    this.cpu_usage.push({
      model: 'Average',
      speed: 'N/A',
      times: { idle: idle, total: total },
      total: total,
      usage: (1 - idle / total) * 100,
    });
    return this;
  }

  fetchMemoryUsage() {
    this.memory_usage = process.memoryUsage();
    this.memory_usage.total = os.totalmem();
    this.memory_usage.available = os.freemem();
    this.memory_usage.usage =
      ((this.memory_usage.total - this.memory_usage.available) /
        this.memory_usage.total) *
      100;
    return this;
  }

  fetchUpTime() {
    this.uptime = process.uptime();
    return this;
  }

  fetchDiskUsage() {
    getDiskUsage((err, info) => {
      if (err) return;
      this.disk_usage = info;
    });

    return this;
  }

  static builder() {
    return new ServiceHealth();
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  build() {
    return this;
  }

  toJSON() {
    return {
      cpu_usage: this.cpu_usage,
      memory_usage: this.memory_usage,
      disk_usage: this.disk_usage,
      uptime: this.uptime,
      status: this.status,
    };
  }
};
