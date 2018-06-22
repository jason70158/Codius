/**
 * @fileOverview Options for the command line arguments to use.
 * @name options.js
 * @author Travis Crist
 */

const config = require('../../config.js')

const duration = {
  duration: {
    alias: 'd',
    type: 'number',
    default: config.duration,
    description: 'Duration the contract should run (seconds) defaults to 10 mins'
  }
}

const extendDuration = {
  duration: {
    alias: 'd',
    type: 'number',
    description: 'Duration the contract should be extended (seconds)'
  }
}

const maxMonthlyRate = {
  'max-monthly-rate': {
    alias: 'm',
    type: 'number',
    description: 'Max monthly price per contract per host, requires --units flag to be set. Defaults to 10 XRP.'
  }
}

const units = {
  'units': {
    alias: 'u',
    type: 'string',
    description: 'Units to use for the max monthly price, ex \'XRP\'. Defaults to \'XRP\''
  }
}

const hostCount = {
  'host-count': {
    alias: 'c',
    type: 'number',
    description: 'The number of hosts for the contract to run on, default to 1 if not specified.'
  }
}

const addHostEnv = {
  'add-host-env': {
    alias: 'a',
    type: 'boolean',
    default: false,
    description: 'Adds a $HOST env for each container in the manifest that contains other hosts running the same contract'
  }
}

const setHost = {
  host: {
    alias: 'h',
    type: 'string',
    description: 'Host to use for contract, multiple hosts may be used by repeating this option for each host. Cannot be used with host-count command'
  }
}

const codiusFile = {
  'codius-file': {
    alias: 'f',
    type: 'string',
    description: 'Filename or full path to codius file to be used. If not set the CLI looks in the current directory for the codius.json file.',
    default: 'codius.json'
  }
}

const codiusVarsFile = {
  'codius-vars-file': {
    alias: 'v',
    type: 'string',
    description: 'Filename or full path to the codius variables file to be used. If not set the CLI looks in the current directory for the codiusvars.json file.',
    default: 'codiusvars.json'
  }
}

const codiusHostsFile = {
  'codius-hosts-file': {
    alias: 'z',
    type: 'string',
    description: 'Filename or full path to the codius hosts file to be used. If not set the CLI looks in the current directory for the codiushosts.json file.'
  }
}

const codiusStateFilename = {
  'codius-state': {
    alias: 's',
    type: 'string',
    description: 'Filename for generated codius state file, format: <filename>.codiusstate.json.',
    default: 'default.codiusstate.json'
  }
}

const codiusStateFile = {
  'codius-state-file': {
    alias: 'k',
    type: 'string',
    description: 'Filename or full path to the codius state file to be used. If not set the CLI looks in the current directory for the *.codiusstate.json file.'
  }
}

const overrideCodiusStateFile = {
  'override-codius-state': {
    alias: 'o',
    type: 'boolean',
    description: 'Overrides the current *.codiusstate file if it exists.'
  }
}

const noPrompt = {
  'no-prompt': {
    alias: 'q',
    type: 'boolean',
    default: false,
    description: 'Skip prompt to confirm before uploading.'
  }
}

const extendOptions = {
  ...extendDuration,
  ...maxMonthlyRate,
  ...units,
  ...codiusStateFile,
  ...noPrompt
}

const uploadOptions = {
  ...duration,
  ...maxMonthlyRate,
  ...units,
  ...hostCount,
  ...setHost,
  ...addHostEnv,
  ...codiusFile,
  ...codiusVarsFile,
  ...codiusHostsFile,
  ...codiusStateFilename,
  ...noPrompt,
  ...overrideCodiusStateFile
}

module.exports = {
  uploadOptions,
  extendOptions
}
