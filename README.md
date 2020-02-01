# lessware-aws
aws middleware for lessware framework

## Install
`npm i -S lessware-aws`

## API
`waitsForEmptyEventLoop` - a function that returns the middlware function which mutates a Lambda function's `callbackWaitsForEmptyEventLoop` property.
- input parameter: an object whose keys determine behavior,
  - `toWait` - a function whose input is the `context` from the middleware and returns a boolean (default `false`) used to tell Lambda if it should wait for all asynchronous activity to resolve 
  - `contextKey` - the key (default `"ctx"`) storing a Lambda Function's 2nd parameter often called "context"
- output: the middleware function for lessware's `framework` usage.

`service` - a function that returns the middleware function that attaches an instance of a service instance of the AWS SDK.
- input parameter: an object whose keys determine behavior,
  - `service` a string that will be used to store the service instance on the `context` object under a key called `aws`, e.g. `context.aws.secrets` may store the `SecretsManager` instance.
  - `serviceClass`: a string that identifies the service class in the `AWS` SDK to use, e.g. `SecretsManager`

## Example Usage
An API Controller using `waitsForEmptyEventLoop`, `service` middlware.

```javascript
-- todo.js --
// define the API controller for 'todo' records.

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
    // assumes `context.db` exists
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


// -- index.js --
const todo = require('./todo')
const router = {todo}

exports.handler = async (event, ctx) => {
  const controller = router[event.fieldName]

  // invoke the controller that takes one object for framework "context"
  return controller({event, ctx})
}
```

# Maintainers

When buidling releases,
1. `npm test`
2. `git commit -m "your message"`
3. bump version 
   1. `npm version patch`
   2. `npm version minor`
4. `npm publish`
