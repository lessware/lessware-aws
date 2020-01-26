const AWS = require('aws-sdk')
const { drillDown } = require('deepdown')

const defaultConfigPath = ['config', 'aws']

exports.service = ({serviceName='secrets', serviceClass='SecretsManager', configPath=defaultConfigPath}) => async (context) => {
  if (!context.aws) {
    context.aws = {}
  }

  if (!context.aws[serviceName]) {
    const ctor = AWS[serviceClass]
    context.aws[serviceName] = new ctor(drillDown(context, configPath))
  }

  return context
}

exports.waitsForEmptyEventLoop = ({toWait=false, contextKey='ctx'}={}) => async context => {
	// per best practices, i.e.
	// https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
	context[contextKey].callbackWaitsForEmptyEventLoop = toWait

  return context
}
