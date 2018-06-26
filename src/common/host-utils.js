/**
 * @fileOverview
 * @name hosts-utils.js
 * @author Travis Crist
 */

const fetch = require('ilp-fetch')
const logger = require('riverpig')('codius-cli:host-utils')
const config = require('../config.js')
const BigNumber = require('bignumber.js')
const sampleSize = require('lodash.samplesize')
const { getCurrencyDetails } = require('../common/price.js')

function cleanHostListUrls (hostList) {
  return hostList.map(host => {
    // TODO: Add https start of url checking
    if (host.endsWith('/')) {
      return host.slice(0, -1)
    }
    return host
  })
}

async function fetchHostPrice (host, duration, manifestJson) {
  return new Promise((resolve, reject) => {
    fetch(`${host}/pods?duration=${duration}`, {
      headers: {
        Accept: `application/codius-v${config.version.codius.min}+json`,
        'Content-Type': 'application/json'
      },
      method: 'OPTIONS',
      body: JSON.stringify(manifestJson)
    }).then(async (res) => {
      if (res) {
        resolve({ host, response: await res.json() })
      } else {
        resolve(null)
      }
    }).catch((error) => {
      resolve({ host, error })
    })
  })
}

function checkPrice (maxPriceLocalUnits, hostQuotedPrice) {
  const priceQuote = new BigNumber(hostQuotedPrice)
  if (priceQuote.isGreaterThan(maxPriceLocalUnits)) {
    return false
  } else {
    return true
  }
}
async function checkHostsPrices (fetchHostPromises, maxPriceLocalUnits) {
  logger.debug(`Fetching host prices from ${fetchHostPromises.length}`)
  const responses = await Promise.all(fetchHostPromises)
  const currency = await getCurrencyDetails()
  const results = await responses.reduce((acc, curr) => {
    if (curr.error) {
      acc.failed.push(curr)
    } else if (!checkPrice(maxPriceLocalUnits, curr.response.price)) {
      const errorMessage = {
        message: 'Quoted price exceeded specified max price, please increase your max price.',
        host: curr.host,
        quotedPrice: `${curr.response.price.toString()} ${currency}`,
        maxPrice: `${maxPriceLocalUnits} ${currency}`
      }
      acc.failed.push(errorMessage)
    } else {
      acc.success.push(curr)
    }
    return acc
  }, { success: [], failed: [] })
  return results
}

async function gatherMatchingValidHosts (hostList, duration, maxPriceLocalUnits, hostCount, manifestJson) {
  let validHosts = []
  const maxAttempts = hostList.length
  let attemptCount = 0
  let lastFailed = []
  let invalidHosts = []

  while (validHosts.length < hostCount && attemptCount < maxAttempts) {
    logger.debug(`Valid Hosts Found: ${validHosts.length}, attemptCount: ${attemptCount}`)
    const candidateHosts = sampleSize(hostList, hostCount < 5 ? hostCount : 5).filter((host) => !invalidHosts.includes(host))
    logger.debug(`Candidate Hosts: ${candidateHosts}`)
    logger.debug(`InvalidHosts: ${invalidHosts}`)
    attemptCount += candidateHosts.length
    const fetchPromises = candidateHosts.map((host) => fetchHostPrice(host, duration, manifestJson))
    const priceCheckResults = await checkHostsPrices(fetchPromises, maxPriceLocalUnits)
    if (priceCheckResults.success.length > 0) {
      validHosts = [...validHosts, ...priceCheckResults.success.map((obj) => obj.host)]
    } else {
      lastFailed = priceCheckResults.failed
    }

    if (priceCheckResults.failed.length > 0) {
      invalidHosts = [...invalidHosts, ...priceCheckResults.failed.map((obj) => obj.host)]
    }
  }

  if (validHosts.length < hostCount) {
    const error = {
      message: `Unable to find ${hostCount} hosts with provided max price.`,
      errors: lastFailed
    }
    throw new Error(JSON.stringify(error))
  }
  logger.debug(`Validated Price successfully against ${validHosts.length}`)
  const uploadHosts = validHosts.slice(0, hostCount)
  logger.debug(`Using ${uploadHosts.length} for upload`)
  return uploadHosts
}

async function checkPricesOnHosts (hosts, duration, maxPriceLocalUnits, manifestJson) {
  const fetchPromises = hosts.map((host) => fetchHostPrice(host, duration, manifestJson))
  const priceCheckResults = await checkHostsPrices(fetchPromises, maxPriceLocalUnits)
  if (priceCheckResults.failed.length !== 0) {
    throw new Error(JSON.stringify(priceCheckResults.failed, null, 2))
  }
  return hosts
}

async function getValidHosts ({ duration, hostCount = 1, host }, maxPriceLocalUnits, hostList, manifestJson) {
  let uploadHosts = []
  if (host) {
    // Singular host options are a string so we have to make them into an array
    if (typeof host === 'string') {
      uploadHosts = [host]
    } else {
      uploadHosts = host
    }
    await checkPricesOnHosts(uploadHosts, duration, maxPriceLocalUnits, manifestJson)
  } else {
    uploadHosts = await gatherMatchingValidHosts(hostList, duration, maxPriceLocalUnits, hostCount, manifestJson)
  }

  return cleanHostListUrls(uploadHosts)
}

module.exports = {
  cleanHostListUrls,
  getValidHosts,
  checkPricesOnHosts
}
