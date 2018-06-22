/**
 * @fileOverview
 * @name codius-state.js
 * @author Travis Crist
 */

const logger = require('riverpig')('codius-cli:codius-state')
const fse = require('fs-extra')
const BigNumber = require('bignumber.js')
const { hashManifest } = require('codius-manifest')
const config = require('../config.js')
const jsome = require('jsome')
const examples = require('../common/examples.js')
const inquirer = require('inquirer')

async function validateOptions (status, { hosts, codiusFile, codiusVarsFile, codiusHostsFile, codiusState, overrideCodiusState, noPrompt }) {
  const currDir = process.cwd()
  const codiusStateExists = await fse.pathExists(codiusState)
  logger.debug(`override codius state: ${overrideCodiusState}`)
  if (codiusStateExists && !overrideCodiusState) {
    const errorMessage = `Codius State File\n ${currDir}/${codiusState}\nalready exists. Please remove "${codiusState} from the current working directory or pass option --override-codius-state`
    throw new Error(errorMessage)
  }

  let codiusExists = await fse.pathExists(codiusFile)
  let codiusVarsExists = await fse.pathExists(codiusVarsFile)
  const codiusHostsExists = await fse.pathExists(codiusHostsFile)

  if (codiusFile === 'codius.json' && codiusVarsFile === 'codiusvars.json' &&
      !codiusExists && !codiusVarsExists && !noPrompt) {
    console.info(`No codius.json or codiusvars.json files present in ${currDir}`)
    const userResp = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createExample',
        message: `Would you like example codius.json and codiusvars.json to be generated in ${currDir}?`,
        default: false
      }
    ])
    console.log(userResp)
    if (userResp.createExample) {
      await examples.createExample('nginx')
      codiusExists = await fse.pathExists(codiusFile)
      codiusVarsExists = await fse.pathExists(codiusVarsFile)
    }
  }

  status.start('Validating File Locations')

  if (!codiusExists) {
    let errorMessage
    if (codiusFile === 'codius.json') {
      errorMessage = `Codius File\n ${currDir}/${codiusFile}\ndoes not exists please add a codius.json file.`
    } else {
      errorMessage = `Codius File\n ${codiusFile}\ndoes not exist, please add a codius.json file.`
    }
    throw new Error(errorMessage)
  }

  if (!codiusVarsExists) {
    let errorMessage
    if (codiusVarsFile === 'codiusvars.json') {
      errorMessage = `Codius Vars File\n ${currDir}/${codiusVarsFile}\ndoes not exists please add a codiusvars.json file.`
    } else {
      errorMessage = `Codius Vars File\n ${codiusFile}\ndoes not exist, please add a codiusvars.json file.`
    }
    throw new Error(errorMessage)
  }

  if (!hosts && codiusHostsFile && !codiusHostsExists) {
    let errorMessage
    if (codiusHostsFile === 'codiushosts.json') {
      errorMessage = `Codius Hosts File\n ${currDir}/${codiusHostsFile}\n does not exists please check the location of your ${codiusHostsFile}.`
    } else {
      errorMessage = `Codius Hosts File\n ${codiusFile}\ndoes not exist, please check the location of your ${codiusHostsFile}.`
    }
    throw new Error(errorMessage)
  }
  status.succeed()
}

function getHostList (codiusStateJson, uploadResponses) {
  const successfulHostList = [...new Set(uploadResponses.success.reduce((acc, curr) => [...acc, curr.host], []))]
  const existingHostList = codiusStateJson ? codiusStateJson.hostList : []
  const fullHostList = [...new Set([...successfulHostList, ...existingHostList])]
  console.log(fullHostList)
  return fullHostList
}

async function saveCodiusState ({ codiusState, maxMonthlyRate = config.price.month.xrp, units = config.price.units, duration }, manifestJson, uploadResponses, codiusStateJson) {
  let hostDetailsObj = (codiusStateJson && codiusStateJson.status &&
    codiusStateJson.status.hostDetails) ? codiusStateJson.status.hostDetails : {}

  uploadResponses.success.forEach(obj => {
    let existingTotal = new BigNumber(0)
    if (hostDetailsObj && hostDetailsObj[obj.host]) {
      existingTotal = new BigNumber(hostDetailsObj[obj.host] ? hostDetailsObj[obj.host].price.totalPaid : 0)
    }
    const updatedTotalPaid = existingTotal.plus(obj.pricePaid)
    hostDetailsObj[obj.host] = {
      url: obj.url,
      expirationDate: obj.expirationDate,
      price: {
        totalPaid: updatedTotalPaid,
        lastPaid: obj.pricePaid,
        units: obj.units
      }
    }
  })

  const codiusStateObj = {
    description: 'Codius State File which is generated from the provided codius.json, codiusvars.json, and codiushosts.json files.',
    manifestHash: hashManifest(manifestJson.manifest),
    generatedManifest: manifestJson,
    options: {
      maxMonthlyRate: maxMonthlyRate,
      units: units,
      duration: duration
    },
    hostList: getHostList(codiusStateJson, uploadResponses),
    status: {
      hostDetails: hostDetailsObj
    }
  }
  logger.debug(`Codius State File Obj: ${jsome(codiusStateObj)}`)
  await fse.writeJson(codiusState, codiusStateObj, { spaces: 2 })
}

module.exports = {
  validateOptions,
  saveCodiusState
}
