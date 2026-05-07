const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Checks if a binary is installed on the system (Windows/Linux)
 * @param {string} cmd Binary name (e.g., 'soffice')
 * @param {string[]} commonPaths Fallback paths for Windows
 * @returns {boolean}
 */
module.exports = function checkBinary(cmd, commonPaths = []) {
  const isWin = process.platform === 'win32';
  const checkCmd = isWin ? `where ${cmd}` : `which ${cmd}`;

  try {
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    if (isWin) {
      for (const p of commonPaths) {
        if (fs.existsSync(p)) {
          // Optionally add to PATH for current process
          const dir = path.dirname(p);
          if (!process.env.PATH.includes(dir)) {
            process.env.PATH = `${dir};${process.env.PATH}`;
          }
          return true;
        }
      }
    }
    return false;
  }
};
