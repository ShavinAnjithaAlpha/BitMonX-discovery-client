const { exec } = require('child_process');
const os = require('os');
const path = require('path');
// const disk = require('diskusage');

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
      console.log(`Disk Usage:\n${stdout}`);

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

// function getDiskUsageWithPackage() {
//   const platform = os.platform();
//   const diskPath = platform === 'win32' ? 'C:' : path.parse(__dirname).root;

//   disk.check(diskPath, (err, info) => {
//     if (err) {
//       console.error(err);
//     } else {
//       console.log(`Disk Usage for ${diskPath}:`);
//       console.log(`Total: ${(info.total / 1024 / 1024 / 1024).toFixed(2)} GB`);
//       console.log(`Free: ${(info.free / 1024 / 1024 / 1024).toFixed(2)} GB`);
//       console.log(`Used: ${(info.used / 1024 / 1024 / 1024).toFixed(2)} GB`);
//     }
//   });
// }

module.exports = {
  getDiskUsage,
};
