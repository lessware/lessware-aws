const AWS = require('aws-sdk')
const { drillDown } = require('deepdown')

const defaultConfigPath = ['config', 'aws']

const defaultConfig = async ctx => drillDown(ctx, defaultConfigPath)

const defaultStore = (context, {serviceName, /*serviceClass*/}, service) => {
  if (!context.aws) {
    context.aws = {}
  }

  context.aws[serviceName] = service
}

const defaultStoreCache = (context, {serviceName, /*serviceClass*/}) => drillDown(context, ['aws', serviceName])

exports.service = ({
  serviceName='secrets',
  serviceClass='SecretsManager',
  config=defaultConfig,
  store={write: defaultStore, read: defaultStoreCache},
}) => async (context) => {

  const service = {serviceName, serviceClass}
  if (!store.read(context, service)) {
    const cfg = await config(context)
    const ctor = AWS[serviceClass]
    store.write(context, service, new ctor(cfg))
  }

  return context
}

const defaultToWait = false

exports.waitsForEmptyEventLoop = ({toWait=() => defaultToWait, contextKey='ctx'}={}) => async context => {
	// per best practices, i.e.
	// https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
	context[contextKey].callbackWaitsForEmptyEventLoop = toWait(context)

  return context
}
