module.exports = class ServiceHealth {
  // properties
  cpu_usage;
  memory_usage;
  uptime;
  status;

  constructor() {}

  // fetch the health of the service
  fetchCpuUsage() {
    this.cpu_usage = process.cpuUsage();
    return this;
  }

  fetchMemoryUsage() {
    this.memory_usage = process.memoryUsage();
    return this;
  }

  fetchUpTime() {
    this.uptime = process.uptime();
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
      uptime: this.uptime,
      status: this.status,
    };
  }
};
