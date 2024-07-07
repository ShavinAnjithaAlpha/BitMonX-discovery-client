/**
 * This file is used to store the service_id and instance_id of the service and instance that the user wants to view details of.
 * @author Shavin Anjitha
 */

let service_id = null;
let instance_id = null;

/*
 * Set the service_id of the service
 * @param {string} id - The service_id of the service
 */
function setServiceId(id) {
  service_id = id;
}

/*
 * Set the instance_id of the instance
 * @param {string} id - The instance_id of the instance
 */
function setInstanceId(id) {
  instance_id = id;
}

/*
 * Get the service_id of the service
 * @returns {string} The service_id of the service
 */
function getServiceId() {
  return service_id;
}

/*
 * Get the instance_id of the instance
 * @returns {string} The instance_id of the instance
 */
function getInstanceId() {
  return instance_id;
}

module.exports = {
  setServiceId,
  setInstanceId,
  getServiceId,
  getInstanceId,
};
