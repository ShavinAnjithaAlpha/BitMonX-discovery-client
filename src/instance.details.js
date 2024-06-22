let service_id = null;
let instance_id = null;

function setServiceId(id) {
  service_id = id;
}

function setInstanceId(id) {
  instance_id = id;
}

function getServiceId() {
  return service_id;
}

function getInstanceId() {
  return instance_id;
}

module.exports = {
  setServiceId,
  setInstanceId,
  getServiceId,
  getInstanceId,
};
