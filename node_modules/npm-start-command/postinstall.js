const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const platform = os.platform()
const upFolder = path.resolve(path.join(__dirname, '..', '..'))

const isApple = platform === 'darwin'

// Do nothing if package is installed globally.
if (require('module').globalPaths.indexOf(upFolder) === -1) {
  var fileName = null

  if (isApple) fileName = 'npm-start.command'

  if (fileName) copyIfItDoesNotExist(fileName)
}

function copyIfItDoesNotExist (fileName) {
  const filePath = path.join(__dirname, fileName)
  const filePathUp = path.join(__dirname, '..', '..', fileName)

  fs.stat(filePath, function (err, pathStat) {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    if (pathStat.isFile()) {
      fs.stat(filePathUp, function (errUp, pathStatUp) {
        // If file does not exist, copy it.
        if (errUp && errUp.code === 'ENOENT') {
          if (isApple) {
            childProcess.spawn('cp', [fileName, '../..'])
          }
        }
      })
    }
  })
}
