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
    // NOTE: The default is not specified since it is derived from the codius state file if the parameter is not passed in.
  }
}

const maxMonthlyRate = {
  'max-monthly-rate': {
    alias: 'm',
    type: 'number',
    description: 'Max monthly price per contract per host, requires --units flag to be set. Defaults to 10 XRP.'
    // NOTE: The default is not set using yargs so that when this param is set yargs requires the units param.
  }
}

const units = {
  'units': {
    alias: 'u',
    type: 'string',
    description: 'Units to use for the max monthly price, ex \'XRP\'. Defaults to \'XRP\''
    // NOTE: The default is not set using yargs so that when this param is set yargs requires the max-monthly-rate param.
  }
}

const hostCount = {
  'host-count': {
    alias: 'c',
    type: 'number',
    description: 'The number of hosts for the contract to run on, default to 1 if not specified.'
    // NOTE: The default is not specified so we can check for its exisitance to warn the usere about adding the add-hosts-env options.
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
    type: 'string',
    description: 'Host to use for contract, multiple hosts may be used by repeating this option for each host. Cannot be used with host-count command'
  }
}

const codiusFile = {
  'codius-file': {
    type: 'string',
    description: 'Filename or full path to codius file to be used. If not set the CLI looks in the current directory for the codius.json file.',
    default: 'codius.json'
  }
}

const codiusVarsFile = {
  'codius-vars-file': {
    type: 'string',
    description: 'Filename or full path to the codius variables file to be used. If not set the CLI looks in the current directory for the codiusvars.json file.',
    default: 'codiusvars.json'
  }
}

const codiusHostsFile = {
  'codius-hosts-file': {
    type: 'string',
    description: 'Filename or full path to the codius hosts file to be used. If not set the CLI looks in the current directory for the codiushosts.json file.'
  }
}

const codiusStateFileUpload = {
  'codius-state-file': {
    type: 'string',
    description: 'Filename or full path to the codius state file to be generated. If not set the CLI will make a default.codiusstate.json file.',
    default: 'default.codiusstate.json'
  }
}

const codiusStateFileExtend = {
  'codius-state-file': {
    type: 'string',
    description: 'Filename or full path to the codius state file to be used. If not set the CLI looks in the current directory for the *.codiusstate.json file.'
  }
}

const overwriteCodiusStateFile = {
  'overwrite-codius-state': {
    alias: 'o',
    type: 'boolean',
    description: 'Overwrite the current *.codiusstate.json file if it exists.'
  }
}

const noPrompt = {
  'no-prompt': {
    alias: 'y',
    type: 'boolean',
    default: false,
    description: 'Say yes to all prompts.'
  }
}

const extendOptions = {
  ...extendDuration,
  ...maxMonthlyRate,
  ...units,
  ...codiusStateFileExtend,
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
  ...codiusStateFileUpload,
  ...noPrompt,
  ...overwriteCodiusStateFile
}

const extendManifestOptions = {
  ...setHost,
  ...extendDuration,
  ...maxMonthlyRate,
  ...units,
  ...noPrompt
}

module.exports = {
  uploadOptions,
  extendOptions,
  extendManifestOptions
}
