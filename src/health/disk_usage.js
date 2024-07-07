/**
 * @file disk_usage.js
 * @description This file contains the function to get the disk usage details of the system.
 * @exports getDiskUsage
 * @author Shavin Anjitha
 * @requires exec
 * @requires os
 * @requires path
 */

const { exec } = require('child_process');
const os = require('os');
const path = require('path');

/**
 * Get the disk usage details of the system and return it as a JSON object to the callback function provided as an argument to the function.
 * @param {Function} callback - The callback function that handles the disk usage details
 * @returns {void}
 * @example
 * const { getDiskUsage } = require('./disk_usage');
 * getDiskUsage((error, diskInfo) => {
 *  if (error) {
 *   console.error(error);
 * }
 * console.log(diskInfo);
 * });
 * @description This function gets the disk usage details of the system and returns it as a JSON object to the callback function provided as an argument to the function.
 * @exports getDiskUsage
 * @requires exec
 * @requires os
 * @requires path
 */
function getDiskUsage(callback) {
  const platform = os.platform();

  if (platform === 'win32') {
    // For Windows
    exec(
      'wmic logicaldisk get size,freespace,caption',
      (error, stdout, stderr) => {
        if (error) {
          callback(error, null);
          return;
        }
        // parse the stdout as a JSON object
        // split the stdout by new line
        let lines = stdout.split('\n');
        // remove the first line
        lines.shift();
        // remove all the empty lines
        lines = lines.filter((line) => line.trim() !== '');
        const diskInfo = lines.map((line) => {
          const [caption, free, size] = line.trim().split(/\s+/);
          return {
            size: Number(size) / 1024 / 1024 / 1024,
            free: Number(free) / 1024 / 1024 / 1024,
            used: (Number(size) - Number(free)) / 1024 / 1024 / 1024,
            usage: ((Number(size) - Number(free)) / Number(size)) * 100,
            caption,
          };
        });
        callback(null, diskInfo);
      },
    );
  } else {
    // For Unix-based systems
    exec('df -h', (error, stdout, stderr) => {
      if (error) {
        callback(error, null);
        return;
      }

      // parse the stdout as a JSON object
      let lines = stdout.split('\n');
      lines.shift();
      lines = lines.filter((line) => line.trim() !== '');
      const diskInfo = lines.map((line) => {
        const [fs, size, used, available, usage, mounted] = line
          .trim()
          .split(/\s+/);
        return {
          size,
          free: available,
          used,
          usage,
          caption: mounted,
        };
      });

      callback(null, diskInfo);
    });
  }
}

module.exports = {
  getDiskUsage,
};
