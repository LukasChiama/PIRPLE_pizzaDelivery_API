
const environments = {};

environments.staging = {
  'httpPort': 2000,
  'httpsPort': 2020,
  'name': 'staging',
  'hashingSecret': 'a secret',
  'maxChecks': 5,
  'stripe': {
    'source': "tok_visa",
    'auth' : 'sk_test_HvzstZRBoJkVvMVJCB0RhkBN:',
  },
  'mailGun': {
    'domainName': 'sandbox33031c9ca5eb42f980b79b406d8a4676.mailgun.org',
    'auth': 'api:43dd824ea5847a1fa19d5738b940d72f-9525e19d-3b20b0b2'
  }
}

environments.production = {
  'httpPort': 9000,
  'httpsPort': 9090,
  'name': 'production',
  'hashingSecret': 'thisTooNaSecret',
  'maxChecks': 5,
  'stripe': {
    'source':'',
    'auth':'',
  },
  'mailGun': {
    'domainName': '',
    'auth': ''
  }
}


const currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase(): '';

const exportEnv = typeof environments[currentEnv] === 'object' ? environments[currentEnv]: environments.staging;

module.exports = exportEnv;