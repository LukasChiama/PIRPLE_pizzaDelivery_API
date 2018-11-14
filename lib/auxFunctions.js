/* craft functions that will perform auxilliary functions
 that will allow other functions do their duty*/

//load dependencies
const crypto = require('crypto');

const aux = {};

aux.parseJsonToObject = function (str) {
  try{
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
}

aux.hashPassword = function (str) {
  const hash = crypto.createHmac("SHA256", 'a secret').update(str).digest('hex');
  return hash;
}

aux.createToken = function (num) {
  num = typeof num === 'number' && num > 0 ? num: false;
  if(num){
    
    const posChar = '010234abcdefghijklmno56789pqrstuvwxyz';
    let str = '';

    for (i = 0; i < num; i++){
      randomChar = posChar.charAt(Math.floor(Math.random() * posChar.length));

      str += randomChar;
    }

    return str;

  } else {
    return false;
  }
}


module.exports = aux;