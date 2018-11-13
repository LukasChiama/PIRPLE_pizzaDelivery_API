/* craft functions that will perform auxilliary functions
 that will allow other functions do their duty*/

//load dependencies
const crypto = require('crypto');

parseJsonToObject = function (str) {
  try{
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
}

hashPassword = function (str) {
  const hash = crypto.createHmac("SHA256", 'a secret').update(str).digest('hex');
  return hash;
}