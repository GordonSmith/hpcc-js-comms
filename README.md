[![Build Status](https://travis-ci.org/hpcc-systems/hpcc-js-comms.svg?branch=master)](https://travis-ci.org/hpcc-systems/hpcc-js-comms)
[![Join the chat at https://gitter.im/hpcc-systems/hpcc-js-comms](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hpcc-systems/hpcc-js-comms?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# hpcc-js-comms
_Typescript / JavaScript (Node + Browser) Client Libarary for communicating with the [HPCC-Platform](https://github.com/hpcc-systems/HPCC-Platform)._

## QuickStart
Simple workunit life cycle:
```javascript
return Workunit.create("http://x.x.x.x:8010/").then((wu) => {
    return wu.update({ QueryText: "'Hello and Welcome!';" });
}).then((wu) => {
    return wu.submit("hthor");
}).then((wu) => {
    return wu.watchUntilComplete();
}).then((wu) => {
    return wu.fetchResults().then((results) => {
        console.log(results[0].Value);
        return wu;
    });
}).then((wu) => {
    return wu.delete();
});
```
