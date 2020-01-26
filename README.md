# lessware-aws
aws middleware for lessware framework

## Install
`npm i -S lessware-aws`


## Example Usage
An API Controller using `waitsForEmptyEventLoop`, `service` middlware.

```javascript
const { framework } = require('lessware')
const aws = require('lessware-aws')
const databaseConnection = require('./db-setup')

module.exports = framework([
  // tell lambda to return before all connections are closed
  aws.waitsForEmptyEventLoop(),
  // attach `secrets` to `context.aws`
  aws.service({
    serviceName: 'secrets',
    serviceClass: 'SecretsManager'
  }),
  // example middleware to cache db connection
  async context => {
    // assumes `client.db` exists
    if (!context.db.client) {
      // use the `aws.secrets` service
      const url = await context.aws.secrets.getSecretValue('db-url')
      context.db.client = await databaseConnection(url)
    }
    return context
  },
  // example controller using cached database client
  async context => {
    const doc = await context.db.client.getRecord(event.payload.id)
    return {
      statusCode: 200,
      body: JSON.stringify(doc),
    }
  }
])
```

# Maintainers

When buidling releases,
1. `npm test`
2. `git commit -m "your message"`
3. bump version 
   1. `npm version patch`
   2. `npm version minor`
4. `npm publish`
