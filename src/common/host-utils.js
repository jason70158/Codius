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
const { URL } = require('url')
const { checkStatus } = require('../common/utils.js')

function cleanHostListUrls (hosts) {
  let hostList
  // Singular host options are a string so we have to make them into an array
  if (typeof hosts === 'string') {
    hostList = [hosts]
  } else {
    hostList = hosts
  }

  return hostList.map(host => {
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `https://${host}`
    }
    try {
      const url = new URL(host)
      return url.origin
    } catch (err) {
      throw new Error(err)
    }
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
      if (checkStatus(res)) {
        resolve({ host, response: await res.json() })
      } else {
        resolve({
          host,
          error: res.error.toString() || 'Unknown Error Occurred',
          text: await res.text() || '',
          status: res.status || ''
        })
      }
    }).catch((error) => {
      resolve({ host, error: error.toString() })
    })
  })
}

function checkPrice (maxMonthlyRate, hostQuotedPrice) {
  const priceQuote = new BigNumber(hostQuotedPrice)
  if (priceQuote.isGreaterThan(maxMonthlyRate)) {
    return false
  } else {
    return true
  }
}
async function checkHostsPrices (fetchHostPromises, maxMonthlyRate) {
  logger.debug(`Fetching host prices from ${fetchHostPromises.length} host(s)`)
  const responses = await Promise.all(fetchHostPromises)
  const currency = await getCurrencyDetails()
  const results = await responses.reduce((acc, curr) => {
    if (curr.error) {
      acc.failed.push(curr)
    } else if (!checkPrice(maxMonthlyRate, curr.response.price)) {
      const errorMessage = {
        message: 'Quoted price exceeded specified max price, please increase your max price.',
        host: curr.host,
        quotedPrice: `${curr.response.price.toString()} ${currency}`,
        maxPrice: `${maxMonthlyRate} ${currency}`
      }
      acc.failed.push(errorMessage)
    } else {
      acc.success.push(curr)
    }
    return acc
  }, { success: [], failed: [] })
  return results
}

async function gatherMatchingValidHosts ({ duration, hostCount = 1 }, hostList, maxMonthlyRate, manifestJson) {
  let validHosts = []
  const maxAttempts = hostList.length
  let attemptCount = 0
  let lastFailed = []
  let invalidHosts = []

  while (validHosts.length < hostCount && attemptCount < maxAttempts) {
    logger.debug(`Valid Hosts Found: ${validHosts.length}, attemptCount: ${attemptCount} need: ${hostCount} host(s)`)
    const candidateHosts = sampleSize(hostList, hostCount < 5 ? hostCount : 5).filter((host) => !invalidHosts.includes(host))
    logger.debug(`Candidate Hosts: ${candidateHosts}`)
    logger.debug(`InvalidHosts: ${invalidHosts}`)
    attemptCount += candidateHosts.length
    const fetchPromises = candidateHosts.map((host) => fetchHostPrice(host, duration, manifestJson))
    const priceCheckResults = await checkHostsPrices(fetchPromises, maxMonthlyRate)
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

async function checkPricesOnHosts (hosts, duration, maxMonthlyRate, manifestJson) {
  const fetchPromises = hosts.map((host) => fetchHostPrice(host, duration, manifestJson))
  const priceCheckResults = await checkHostsPrices(fetchPromises, maxMonthlyRate)
  if (priceCheckResults.failed.length !== 0) {
    throw new Error(JSON.stringify(priceCheckResults.failed, null, 2))
  }
  return hosts
}

async function getValidHosts (options, maxMonthlyRate, hostList, manifestJson) {
  let uploadHosts = []
  if (options.host) {
    await checkPricesOnHosts(hostList, options.duration, maxMonthlyRate, manifestJson)
    uploadHosts = hostList
  } else {
    uploadHosts = await gatherMatchingValidHosts(options, hostList, maxMonthlyRate, manifestJson)
  }

  return uploadHosts
}

module.exports = {
  cleanHostListUrls,
  getValidHosts,
  checkPricesOnHosts
}
