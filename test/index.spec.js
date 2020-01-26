/* eslint-env mocha */

const { assert } = require('chai')
const awsmid = require('../src')
const { framework } = require('lessware')
const sinon = require('sinon')
const AWS = require('aws-sdk')

const testConfig = {
  isIntegration: JSON.parse(process.env.TEST_INTEGRATION || 'false'),
  paramName: process.env.NAME_AWS_PARAM,
  aws: {
    region: process.env.AWS_DEFAULT_REGION,
    profile: process.env.AWS_PROFILE,
  },
  secretName: process.env.NAME_AWS_SECRET,
}

const fakeCtor = mocks => {
  return function ctor() {
    const self = this
    Object.keys(mocks).forEach(methodName => {
      self[methodName] = mocks[methodName]
    })
  }
}

const awsMethod = result => ({
  promise: async () => Promise.resolve(result),
})

describe('aws', function() {
  describe('waitsForEmptyEventLoop', function() {
    it('should have default toWait=false', async function() {
      const chain = framework([
        awsmid.waitsForEmptyEventLoop(),
      ])
  
      const functionContext = {}
      const results = await chain({ctx: functionContext})
      assert.deepEqual(functionContext, {callbackWaitsForEmptyEventLoop: false})
      assert.isOk(results)
    })

    it('should allow customizations', async function() {
      const chain = framework([
        awsmid.waitsForEmptyEventLoop({toWait: true, contextKey: 'context'}),
      ])

      const functionContext = {}
      const results = await chain({context: functionContext})
      assert.deepEqual(functionContext, {callbackWaitsForEmptyEventLoop: true})
      assert.isOk(results)
    })
  })

  describe('service', function() {
    const tests = [
      {serviceName: 'secrets', serviceClass: 'SecretsManager', methodTests: [
        {methodName: 'getSecretValue', should: 'should work', mockResult: {data: 'foo',}, methodParams: {SecretId: testConfig.secretName}},
      ]},
      {serviceName: 'ssm', serviceClass: 'SSM', methodTests: [
        {methodName: 'getParameter', should: 'should work', mockResult: {data: 'foo'}, methodParams: {Name: testConfig.paramName}},
      ]},
    ]

    tests.forEach(serviceTest => {
      const {serviceName, serviceClass, methodTests} = serviceTest

      describe(serviceClass, function() {

        methodTests.forEach(methodTest => {
          const {methodName, methodParams, should, mockResult} = methodTest

          describe(methodName, function() {
            const serviceMock = {
              [methodName]: sinon.stub(),
            }

            before(() => {
              !testConfig.isIntegration && sinon.stub(AWS, serviceClass).callsFake(fakeCtor(serviceMock))

              const call = serviceMock[methodName].onCall(0)
              call['returns'](awsMethod(mockResult))
            })

            after(() => {
              sinon.restore()
            })

            it(should, async function() {
              const chain = framework([
                awsmid.service({serviceName, serviceClass}),
                async context => {
                  // TODO: support more than only the promise-style `resolves` mockResult
                  const srvc = context.aws[serviceName]
                  return srvc[methodName](methodParams).promise()
                },
              ])

              const config = {
                aws: {region: testConfig.aws.region}
              }

              const result = await chain({config})
              assert.deepEqual(result, mockResult)
            })
          })
        })
      })
    })
  })
})
