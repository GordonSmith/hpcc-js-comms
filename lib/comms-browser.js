(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.HPCCComms = global.HPCCComms || {})));
}(this, (function (exports) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var es6Promise = createCommonjsModule(function (module, exports) {
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.1.0
 */

(function (global, factory) {
    module.exports = factory();
}(commonjsGlobal, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = commonjsRequire;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof commonjsRequire === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
      GET_THEN_ERROR.error = null;
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof commonjsGlobal !== 'undefined') {
        local = commonjsGlobal;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

});

var auto = es6Promise.polyfill();

var prefix = "$";

function Map() {}

Map.prototype = map.prototype = {
  constructor: Map,
  has: function(key) {
    return (prefix + key) in this;
  },
  get: function(key) {
    return this[prefix + key];
  },
  set: function(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function() {
    for (var property in this) if (property[0] === prefix) delete this[property];
  },
  keys: function() {
    var keys = [];
    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
    return keys;
  },
  values: function() {
    var values = [];
    for (var property in this) if (property[0] === prefix) values.push(this[property]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
    return entries;
  },
  size: function() {
    var size = 0;
    for (var property in this) if (property[0] === prefix) ++size;
    return size;
  },
  empty: function() {
    for (var property in this) if (property[0] === prefix) return false;
    return true;
  },
  each: function(f) {
    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
  }
};

function map(object, f) {
  var map = new Map;

  // Copy constructor.
  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;

    if (f == null) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f(o = object[i], i, object), o);
  }

  // Convert object to map.
  else if (object) for (var key in object) map.set(key, object[key]);

  return map;
}

function Set() {}

var proto = map.prototype;

Set.prototype = set.prototype = {
  constructor: Set,
  has: proto.has,
  add: function(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function set(object, f) {
  var set = new Set;

  // Copy constructor.
  if (object instanceof Set) object.each(function(value) { set.add(value); });

  // Otherwise, assume it’s an array.
  else if (object) {
    var i = -1, n = object.length;
    if (f == null) while (++i < n) set.add(object[i]);
    else while (++i < n) set.add(f(object[i], i, object));
  }

  return set;
}

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$2(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$2(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$2(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var request = function(url, callback) {
  var request,
      event = dispatch("beforesend", "progress", "load", "error"),
      mimeType,
      headers = map(),
      xhr = new XMLHttpRequest,
      user = null,
      password = null,
      response,
      responseType,
      timeout = 0;

  // If IE does not support CORS, use XDomainRequest.
  if (typeof XDomainRequest !== "undefined"
      && !("withCredentials" in xhr)
      && /^(http(s)?:)?\/\//.test(url)) xhr = new XDomainRequest;

  "onload" in xhr
      ? xhr.onload = xhr.onerror = xhr.ontimeout = respond
      : xhr.onreadystatechange = function(o) { xhr.readyState > 3 && respond(o); };

  function respond(o) {
    var status = xhr.status, result;
    if (!status && hasResponse(xhr)
        || status >= 200 && status < 300
        || status === 304) {
      if (response) {
        try {
          result = response.call(request, xhr);
        } catch (e) {
          event.call("error", request, e);
          return;
        }
      } else {
        result = xhr;
      }
      event.call("load", request, result);
    } else {
      event.call("error", request, o);
    }
  }

  xhr.onprogress = function(e) {
    event.call("progress", request, e);
  };

  request = {
    header: function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers.get(name);
      if (value == null) headers.remove(name);
      else headers.set(name, value + "");
      return request;
    },

    // If mimeType is non-null and no Accept header is set, a default is used.
    mimeType: function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return request;
    },

    // Specifies what type the response value should take;
    // for instance, arraybuffer, blob, document, or text.
    responseType: function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return request;
    },

    timeout: function(value) {
      if (!arguments.length) return timeout;
      timeout = +value;
      return request;
    },

    user: function(value) {
      return arguments.length < 1 ? user : (user = value == null ? null : value + "", request);
    },

    password: function(value) {
      return arguments.length < 1 ? password : (password = value == null ? null : value + "", request);
    },

    // Specify how to convert the response content to a specific type;
    // changes the callback value on "load" events.
    response: function(value) {
      response = value;
      return request;
    },

    // Alias for send("GET", …).
    get: function(data, callback) {
      return request.send("GET", data, callback);
    },

    // Alias for send("POST", …).
    post: function(data, callback) {
      return request.send("POST", data, callback);
    },

    // If callback is non-null, it will be used for error and load events.
    send: function(method, data, callback) {
      xhr.open(method, url, true, user, password);
      if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
      if (xhr.setRequestHeader) headers.each(function(value, name) { xhr.setRequestHeader(name, value); });
      if (mimeType != null && xhr.overrideMimeType) xhr.overrideMimeType(mimeType);
      if (responseType != null) xhr.responseType = responseType;
      if (timeout > 0) xhr.timeout = timeout;
      if (callback == null && typeof data === "function") callback = data, data = null;
      if (callback != null && callback.length === 1) callback = fixCallback(callback);
      if (callback != null) request.on("error", callback).on("load", function(xhr) { callback(null, xhr); });
      event.call("beforesend", request, xhr);
      xhr.send(data == null ? null : data);
      return request;
    },

    abort: function() {
      xhr.abort();
      return request;
    },

    on: function() {
      var value = event.on.apply(event, arguments);
      return value === event ? request : value;
    }
  };

  if (callback != null) {
    if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
    return request.get(callback);
  }

  return request;
};

function fixCallback(callback) {
  return function(error, xhr) {
    callback(error == null ? xhr : null);
  };
}

function hasResponse(xhr) {
  var type = xhr.responseType;
  return type && type !== "text"
      ? xhr.response // null on error
      : xhr.responseText; // "" on error
}

var type = function(defaultMimeType, response) {
  return function(url, callback) {
    var r = request(url).mimeType(defaultMimeType).response(response);
    if (callback != null) {
      if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
      return r.get(callback);
    }
    return r;
  };
};

type("text/html", function(xhr) {
  return document.createRange().createContextualFragment(xhr.responseText);
});

type("application/json", function(xhr) {
  return JSON.parse(xhr.responseText);
});

type("text/plain", function(xhr) {
  return xhr.responseText;
});

type("application/xml", function(xhr) {
  var xml = xhr.responseXML;
  if (!xml) throw new Error("parse error");
  return xml;
});

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "]";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

var dsv = function(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
      delimiterCode = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns;
    return rows;
  }

  function parseRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        N = text.length,
        I = 0, // current character index
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    function token() {
      if (I >= N) return EOF; // special case: end of file
      if (eol) return eol = false, EOL; // special case: end of line

      // special case: quotes
      var j = I, c;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < N) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            ++i;
          }
        }
        I = i + 2;
        c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) ++I;
        } else if (c === 10) {
          eol = true;
        }
        return text.slice(j + 1, i).replace(/""/g, "\"");
      }

      // common case: find next delimiter or newline
      while (I < N) {
        var k = 1;
        c = text.charCodeAt(I++);
        if (c === 10) eol = true; // \n
        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
        else if (c !== delimiterCode) continue;
        return text.slice(j, I - k);
      }

      // special case: last token before EOF
      return text.slice(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
      if (f && (a = f(a, n++)) == null) continue;
      rows.push(a);
    }

    return rows;
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    })).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(text) {
    return text == null ? ""
        : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
        : text;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatRows: formatRows
  };
};

var csv$1 = dsv(",");

var csvParse = csv$1.parse;

var tsv = dsv("\t");

var tsvParse = tsv.parse;

var dsv$1 = function(defaultMimeType, parse) {
  return function(url, row, callback) {
    if (arguments.length < 3) callback = row, row = null;
    var r = request(url).mimeType(defaultMimeType);
    r.row = function(_) { return arguments.length ? r.response(responseOf(parse, row = _)) : row; };
    r.row(row);
    return callback ? r.get(callback) : r;
  };
};

function responseOf(parse, row) {
  return function(request$$1) {
    return parse(request$$1.responseText, row);
  };
}

dsv$1("text/csv", csvParse);

dsv$1("text/tab-separated-values", tsvParse);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

function endsWith(origString, searchString, position) {
    var subjectString = origString.toString();
    if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.lastIndexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
}

var Transport = (function () {
    function Transport(baseUrl) {
        this.opts({ baseUrl: baseUrl });
    }
    Transport.prototype.opts = function (_) {
        if (arguments.length === 0)
            return this._opts;
        this._opts = __assign({}, this._opts, _);
        return this;
    };
    Transport.prototype.serialize = function (obj) {
        var str = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            }
        }
        return str.join("&");
    };
    Transport.prototype.deserialize = function (body) {
        return JSON.parse(body);
    };
    Transport.prototype.stripSlashes = function (str) {
        while (str.indexOf("/") === 0) {
            str = str.substring(1);
        }
        while (endsWith(str, "/")) {
            str = str.substring(0, str.length - 1);
        }
        return str;
    };
    Transport.prototype.joinUrl = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.stripSlashes(this._opts.baseUrl) + "/" + args.map(function (arg) {
            return _this.stripSlashes(arg);
        }).join("/");
    };
    return Transport;
}());

var _nodeRequest = null;

var _d3Request = null;
function initD3Request(request) {
    _d3Request = request;
}
var XHRTransport = (function (_super) {
    __extends(XHRTransport, _super);
    function XHRTransport(baseUrl, verb, userID, password, rejectUnauthorized) {
        if (userID === void 0) { userID = ""; }
        if (password === void 0) { password = ""; }
        if (rejectUnauthorized === void 0) { rejectUnauthorized = true; }
        var _this = _super.call(this, baseUrl) || this;
        _this.verb = verb;
        _this.userID = userID;
        _this.password = password;
        _this.rejectUnauthorized = rejectUnauthorized;
        return _this;
    }
    XHRTransport.prototype.nodeRequestSend = function (action, request, responseType) {
        var _this = this;
        if (responseType === void 0) { responseType = "json"; }
        return new Promise(function (resolve, reject) {
            var options = {
                method: _this.verb,
                uri: _this.joinUrl(action),
                auth: {
                    user: _this.userID,
                    pass: _this.password,
                    sendImmediately: true
                },
                username: _this.userID,
                password: _this.password
            };
            switch (_this.verb) {
                case "GET":
                    options.uri += "?" + _this.serialize(request);
                    break;
                case "POST":
                    options.headers = {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/x-www-form-urlencoded"
                    };
                    options.rejectUnauthorized = _this.rejectUnauthorized;
                    options.body = _this.serialize(request);
                    break;
                default:
            }
            _nodeRequest(options, function (err, resp, body) {
                if (err) {
                    reject(new Error(err));
                }
                else if (resp && resp.statusCode === 200) {
                    resolve(responseType === "json" ? _this.deserialize(body) : body);
                }
                else {
                    reject(new Error(body));
                }
            });
        });
    };
    XHRTransport.prototype.d3Send = function (action, request, responseType) {
        var _this = this;
        if (responseType === void 0) { responseType = "json"; }
        return new Promise(function (resolve, reject) {
            var options = {
                method: _this.verb,
                uri: _this.joinUrl(action),
                auth: {
                    user: _this.userID,
                    pass: _this.password,
                    sendImmediately: true
                },
                username: _this.userID,
                password: _this.password
            };
            switch (_this.verb) {
                case "GET":
                    options.uri += "?" + _this.serialize(request);
                    break;
                case "POST":
                    options.headers = {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/x-www-form-urlencoded"
                    };
                    options.rejectUnauthorized = _this.rejectUnauthorized;
                    options.body = _this.serialize(request);
                    break;
                default:
            }
            var xhr = _d3Request(options.uri);
            if (_this.verb === "POST") {
                xhr
                    .header("X-Requested-With", "XMLHttpRequest")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Origin", null);
            }
            xhr
                .send(_this.verb, options.body, function (err, req) {
                if (err) {
                    reject(new Error(err));
                }
                else if (req && req.status === 200) {
                    resolve(responseType === "json" ? _this.deserialize(req.responseText) : req.responseText);
                }
                else {
                    reject(new Error(req.responseText));
                }
            });
        });
    };
    XHRTransport.prototype.send = function (action, request, responseType) {
        if (responseType === void 0) { responseType = "json"; }
        if (_nodeRequest) {
            return this.nodeRequestSend(action, request, responseType);
        }
        else if (_d3Request) {
            return this.d3Send(action, request, responseType);
        }
        throw new Error("No transport");
    };
    return XHRTransport;
}(Transport));
var XHRGetTransport = (function (_super) {
    __extends(XHRGetTransport, _super);
    function XHRGetTransport(baseUrl, userID, password, rejectUnauthorized) {
        if (userID === void 0) { userID = ""; }
        if (password === void 0) { password = ""; }
        if (rejectUnauthorized === void 0) { rejectUnauthorized = true; }
        return _super.call(this, baseUrl, "GET", userID, password, rejectUnauthorized) || this;
    }
    return XHRGetTransport;
}(XHRTransport));
var XHRPostTransport = (function (_super) {
    __extends(XHRPostTransport, _super);
    function XHRPostTransport(baseUrl, userID, password, rejectUnauthorized) {
        if (userID === void 0) { userID = ""; }
        if (password === void 0) { password = ""; }
        if (rejectUnauthorized === void 0) { rejectUnauthorized = true; }
        return _super.call(this, baseUrl, "POST", userID, password, rejectUnauthorized) || this;
    }
    return XHRPostTransport;
}(XHRTransport));

var JSONPTransport = (function (_super) {
    __extends(JSONPTransport, _super);
    function JSONPTransport(baseUrl, timeout) {
        if (timeout === void 0) { timeout = 60; }
        var _this = _super.call(this, baseUrl) || this;
        _this.timeout = timeout;
        return _this;
    }
    JSONPTransport.prototype.send = function (action, request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var respondedTimeout = _this.timeout * 1000;
            var respondedTick = 5000;
            var callbackName = "jsonp_callback_" + Math.round(Math.random() * 999999);
            window[callbackName] = function (response) {
                respondedTimeout = 0;
                doCallback();
                resolve(response);
            };
            var script = document.createElement("script");
            var url = _this.joinUrl(action);
            url += url.indexOf("?") >= 0 ? "&" : "?";
            script.src = url + "jsonp=" + callbackName + "&" + _this.serialize(request);
            document.body.appendChild(script);
            var progress = setInterval(function () {
                if (respondedTimeout <= 0) {
                    clearInterval(progress);
                }
                else {
                    respondedTimeout -= respondedTick;
                    if (respondedTimeout <= 0) {
                        clearInterval(progress);
                        // console.log("Request timeout:  " + script.src);
                        doCallback();
                        reject(Error("Request timeout:  " + script.src));
                    }
                    else {
                        // console.log("Request pending (" + respondedTimeout / 1000 + " sec):  " + script.src);
                    }
                }
            }, respondedTick);
            function doCallback() {
                delete window[callbackName];
                document.body.removeChild(script);
            }
        });
    };
    
    return JSONPTransport;
}(Transport));

exports.createTransport = function (baseUrl, opts) {
    var retVal = new XHRPostTransport(baseUrl);
    if (opts) {
        retVal.opts(opts);
    }
    return retVal;
};
function setTransportFactory(newFunc) {
    var retVal = exports.createTransport;
    exports.createTransport = newFunc;
    return retVal;
}

/**
 * A generic Stack
 */
var Stack = (function () {
    function Stack() {
        this.stack = [];
    }
    /**
     * Push element onto the stack
     *
     * @param e - element to push
     */
    Stack.prototype.push = function (e) {
        this.stack.push(e);
        return e;
    };
    /**
     * Pop element off the stack
     */
    Stack.prototype.pop = function () {
        return this.stack.pop();
    };
    /**
     * Top item on the stack
     *
     * @returns Top element on the stack
     */
    Stack.prototype.top = function () {
        return this.stack.length ? this.stack[this.stack.length - 1] : undefined;
    };
    /**
     * Depth of stack
     *
     * @returns Depth
     */
    Stack.prototype.depth = function () {
        return this.stack.length;
    };
    return Stack;
}());

var XMLNode = (function () {
    function XMLNode(node) {
        this.name = "";
        this.attributes = {};
        this.children = [];
        this.content = "";
        this.name = node.name;
    }
    XMLNode.prototype.appendAttribute = function (key, val) {
        this.attributes[key] = val;
    };
    XMLNode.prototype.appendContent = function (content) {
        this.content += content;
    };
    XMLNode.prototype.appendChild = function (child) {
        this.children.push(child);
    };
    return XMLNode;
}());
var SAXStackParser = (function () {
    function SAXStackParser() {
        this.stack = new Stack();
    }
    SAXStackParser.prototype.walkDoc = function (node) {
        this.startXMLNode({
            name: node.nodeName
        });
        if (node.attributes) {
            for (var i = 0; i < node.attributes.length; ++i) {
                var attribute = node.attributes.item(i);
                this.attributes(attribute.nodeName, attribute.nodeValue);
            }
        }
        if (node.childNodes) {
            for (var i = 0; i < node.childNodes.length; ++i) {
                var childNode = node.childNodes.item(i);
                if (childNode.nodeType === childNode.TEXT_NODE) {
                    this.characters(childNode.nodeValue);
                }
                else {
                    this.walkDoc(childNode);
                }
            }
        }
        this.endXMLNode({
            name: node.nodeName
        });
    };
    SAXStackParser.prototype.parse = function (xml) {
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(xml, "application/xml");
        this.startDocument();
        this.walkDoc(doc);
        this.endDocument();
    };
    //  Callbacks  ---
    SAXStackParser.prototype.startDocument = function () {
    };
    SAXStackParser.prototype.endDocument = function () {
    };
    SAXStackParser.prototype.startXMLNode = function (node) {
        var newNode = new XMLNode(node);
        if (!this.stack.depth()) {
            this.root = newNode;
        }
        else {
            this.stack.top().appendChild(newNode);
        }
        return this.stack.push(newNode);
    };
    SAXStackParser.prototype.endXMLNode = function (_) {
        return this.stack.pop();
    };
    SAXStackParser.prototype.attributes = function (key, val) {
        this.stack.top().appendAttribute(key, val);
    };
    SAXStackParser.prototype.characters = function (text) {
        this.stack.top().appendContent(text);
    };
    return SAXStackParser;
}());
function xml2json(xml) {
    var saxParser = new SAXStackParser();
    saxParser.parse(xml);
    return saxParser.root;
}
var XSDNode = (function () {
    function XSDNode(e) {
        this.e = e;
    }
    XSDNode.prototype.fix = function () {
        delete this.e;
    };
    return XSDNode;
}());
var XSDXMLNode = (function (_super) {
    __extends(XSDXMLNode, _super);
    function XSDXMLNode(e) {
        var _this = _super.call(this, e) || this;
        _this.children = [];
        return _this;
    }
    XSDXMLNode.prototype.append = function (child) {
        this.children.push(child);
    };
    XSDXMLNode.prototype.fix = function () {
        this.name = this.e.attributes["name"];
        this.type = this.e.attributes["type"];
        for (var i = this.children.length - 1; i >= 0; --i) {
            var row = this.children[i];
            if (row.name === "Row" && row.type === undefined) {
                (_a = this.children).push.apply(_a, row.children);
                this.children.splice(i, 1);
            }
        }
        _super.prototype.fix.call(this);
        var _a;
    };
    return XSDXMLNode;
}(XSDNode));
var XSDSimpleType = (function (_super) {
    __extends(XSDSimpleType, _super);
    function XSDSimpleType(e) {
        return _super.call(this, e) || this;
    }
    XSDSimpleType.prototype.append = function (e) {
        switch (e.name) {
            case "xs:restriction":
                this._restricition = e;
                break;
            case "xs:maxLength":
                this._maxLength = e;
                break;
            default:
        }
    };
    XSDSimpleType.prototype.fix = function () {
        this.name = this.e.attributes["name"];
        this.type = this._restricition.attributes["base"];
        this.maxLength = +this._maxLength.attributes["value"];
        delete this._restricition;
        delete this._maxLength;
        _super.prototype.fix.call(this);
    };
    return XSDSimpleType;
}(XSDNode));
var XSDSchema = (function () {
    function XSDSchema() {
        this.simpleTypes = {};
    }
    XSDSchema.prototype.calcWidth = function (type, name) {
        var retVal = -1;
        switch (type) {
            case "xs:boolean":
                retVal = 5;
                break;
            case "xs:integer":
                retVal = 8;
                break;
            case "xs:nonNegativeInteger":
                retVal = 8;
                break;
            case "xs:double":
                retVal = 8;
                break;
            case "xs:string":
                retVal = 32;
                break;
            default:
                var numStr = "0123456789";
                var underbarPos = type.lastIndexOf("_");
                var length_1 = underbarPos > 0 ? underbarPos : type.length;
                var i = length_1 - 1;
                for (; i >= 0; --i) {
                    if (numStr.indexOf(type.charAt(i)) === -1)
                        break;
                }
                if (i + 1 < length_1) {
                    retVal = parseInt(type.substring(i + 1, length_1), 10);
                }
                if (type.indexOf("data") === 0) {
                    retVal *= 2;
                }
                break;
        }
        if (retVal < name.length)
            retVal = name.length;
        return retVal;
    };
    return XSDSchema;
}());
var XSDParser = (function (_super) {
    __extends(XSDParser, _super);
    function XSDParser() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.schema = new XSDSchema();
        _this.simpleTypes = {};
        _this.xsdStack = new Stack();
        return _this;
    }
    XSDParser.prototype.startXMLNode = function (node) {
        var e = _super.prototype.startXMLNode.call(this, node);
        switch (e.name) {
            case "xs:element":
                var xsdXMLNode = new XSDXMLNode(e);
                if (!this.schema.root) {
                    this.schema.root = xsdXMLNode;
                }
                else if (this.xsdStack.depth()) {
                    this.xsdStack.top().append(xsdXMLNode);
                }
                this.xsdStack.push(xsdXMLNode);
                break;
            case "xs:simpleType":
                this.simpleType = new XSDSimpleType(e);
            default:
                break;
        }
        return e;
    };
    XSDParser.prototype.endXMLNode = function (node) {
        var e = this.stack.top();
        switch (e.name) {
            case "xs:element":
                var xsdXMLNode = this.xsdStack.pop();
                xsdXMLNode.fix();
                break;
            case "xs:simpleType":
                this.simpleType.fix();
                this.simpleTypes[this.simpleType.name] = this.simpleType;
                delete this.simpleType;
                break;
            default:
                if (this.simpleType) {
                    this.simpleType.append(e);
                }
        }
        return _super.prototype.endXMLNode.call(this, node);
    };
    return XSDParser;
}(SAXStackParser));
function parseXSD(xml) {
    var saxParser = new XSDParser();
    saxParser.parse(xml);
    return saxParser.schema;
}

function isArray(arg) {
    return Object.prototype.toString.call(arg) === "[object Array]";
}

var ESPExceptions = (function (_super) {
    __extends(ESPExceptions, _super);
    function ESPExceptions(action, request, exceptions) {
        var _this = _super.call(this, "ESPException:  " + exceptions.Source) || this;
        _this.isESPExceptions = true;
        _this.action = action;
        _this.request = request;
        _this.Source = exceptions.Source;
        _this.Exception = exceptions.Exception;
        return _this;
    }
    return ESPExceptions;
}(Error));
var ESPTransport = (function (_super) {
    __extends(ESPTransport, _super);
    function ESPTransport(transport, service, version) {
        var _this = _super.call(this, "") || this;
        _this._transport = transport;
        _this._service = service;
        _this._version = version;
        return _this;
    }
    ESPTransport.prototype.toESPStringArray = function (target, arrayName) {
        if (isArray(target[arrayName])) {
            for (var i = 0; i < target[arrayName].length; ++i) {
                target[arrayName + "_i" + i] = target[arrayName][i];
            }
            delete target[arrayName];
        }
        return target;
    };
    ESPTransport.prototype.send = function (action, _request, responseType) {
        if (_request === void 0) { _request = {}; }
        if (responseType === void 0) { responseType = "json"; }
        var request = __assign({}, _request, { ver_: this._version });
        var serviceAction = this.joinUrl(this._service, action + ".json");
        return this._transport.send(serviceAction, request, responseType).then(function (response) {
            if (responseType === "json") {
                if (response.Exceptions) {
                    throw new ESPExceptions(action, request, response.Exceptions);
                }
                var retVal = response[(action === "WUCDebug" ? "WUDebug" : action) + "Response"];
                if (!retVal) {
                    throw new ESPExceptions(action, request, {
                        Source: "ESPConnection.transmit",
                        Exception: [{ Code: 0, Message: "Missing Response" }]
                    });
                }
                return retVal;
            }
            return response;
        });
    };
    return ESPTransport;
}(Transport));

var WUStateID;
(function (WUStateID) {
    WUStateID[WUStateID["Unknown"] = 0] = "Unknown";
    WUStateID[WUStateID["Compiled"] = 1] = "Compiled";
    WUStateID[WUStateID["Running"] = 2] = "Running";
    WUStateID[WUStateID["Completed"] = 3] = "Completed";
    WUStateID[WUStateID["Failed"] = 4] = "Failed";
    WUStateID[WUStateID["Archived"] = 5] = "Archived";
    WUStateID[WUStateID["Aborting"] = 6] = "Aborting";
    WUStateID[WUStateID["Aborted"] = 7] = "Aborted";
    WUStateID[WUStateID["Blocked"] = 8] = "Blocked";
    WUStateID[WUStateID["Submitted"] = 9] = "Submitted";
    WUStateID[WUStateID["Scheduled"] = 10] = "Scheduled";
    WUStateID[WUStateID["Compiling"] = 11] = "Compiling";
    WUStateID[WUStateID["Wait"] = 12] = "Wait";
    WUStateID[WUStateID["UploadingFiled"] = 13] = "UploadingFiled";
    WUStateID[WUStateID["DebugPaused"] = 14] = "DebugPaused";
    WUStateID[WUStateID["DebugRunning"] = 15] = "DebugRunning";
    WUStateID[WUStateID["Paused"] = 16] = "Paused";
    WUStateID[WUStateID["LAST"] = 17] = "LAST";
    WUStateID[WUStateID["NotFound"] = 999] = "NotFound";
})(WUStateID || (WUStateID = {}));

(function (WUAction) {
    WUAction[WUAction["Unknown"] = 0] = "Unknown";
    WUAction[WUAction["Compile"] = 1] = "Compile";
    WUAction[WUAction["Check"] = 2] = "Check";
    WUAction[WUAction["Run"] = 3] = "Run";
    WUAction[WUAction["ExecuteExisting"] = 4] = "ExecuteExisting";
    WUAction[WUAction["Pause"] = 5] = "Pause";
    WUAction[WUAction["PauseNow"] = 6] = "PauseNow";
    WUAction[WUAction["Resume"] = 7] = "Resume";
    WUAction[WUAction["Debug"] = 8] = "Debug";
    WUAction[WUAction["__size"] = 9] = "__size";
})(exports.WUAction || (exports.WUAction = {}));



var Service = (function () {
    function Service(transport) {
        if (typeof transport === "string") {
            transport = exports.createTransport(transport);
        }
        this._transport = new ESPTransport(transport, "WsWorkunits", "1.67");
    }
    Service.prototype.WUQuery = function (request) {
        if (request === void 0) { request = {}; }
        return this._transport.send("WUQuery", request);
    };
    Service.prototype.WUInfo = function (_request) {
        var request = __assign({ Wuid: "", TruncateEclTo64k: true, IncludeExceptions: false, IncludeGraphs: false, IncludeSourceFiles: false, IncludeResults: false, IncludeResultsViewNames: false, IncludeVariables: false, IncludeTimers: false, IncludeDebugValues: false, IncludeApplicationValues: false, IncludeWorkflows: false, IncludeXmlSchemas: false, IncludeResourceURLs: false, SuppressResultSchemas: true }, _request);
        return this._transport.send("WUInfo", request);
    };
    Service.prototype.WUCreate = function () {
        return this._transport.send("WUCreate");
    };
    Service.prototype.objToESPArray = function (id, obj, request) {
        var count = 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                request[id + "s." + id + "." + count + ".Name"] = key;
                request[id + "s." + id + "." + count + ".Value"] = obj[key];
                ++count;
            }
        }
        request[id + "s." + id + ".itemcount"] = count;
    };
    Service.prototype.WUUpdate = function (request, appValues, debugValues) {
        if (appValues === void 0) { appValues = {}; }
        if (debugValues === void 0) { debugValues = {}; }
        this.objToESPArray("ApplicationValue", appValues, request);
        this.objToESPArray("DebugValue", debugValues, request);
        return this._transport.send("WUUpdate", request);
    };
    Service.prototype.WUSubmit = function (request) {
        return this._transport.send("WUSubmit", request);
    };
    Service.prototype.WUResubmit = function (request) {
        this._transport.toESPStringArray(request, "Wuids");
        return this._transport.send("WUResubmit", request);
    };
    Service.prototype.WUQueryDetails = function (request) {
        return this._transport.send("WUQueryDetails", request);
    };
    Service.prototype.WUListQueries = function (request) {
        return this._transport.send("WUListQueries", request);
    };
    Service.prototype.WUPushEvent = function (request) {
        return this._transport.send("WUPushEvent", request);
    };
    Service.prototype.WUAction = function (request) {
        this._transport.toESPStringArray(request, "Wuids");
        request.ActionType = request.WUActionType; //  v5.x compatibility
        return this._transport.send("WUAction", request);
    };
    Service.prototype.WUGetZAPInfo = function (request) {
        return this._transport.send("WUGetZAPInfo", request);
    };
    Service.prototype.WUShowScheduled = function (request) {
        return this._transport.send("WUShowScheduled", request);
    };
    Service.prototype.WUQuerySetAliasAction = function (request) {
        return this._transport.send("WUQuerySetAliasAction", request);
    };
    Service.prototype.WUQuerySetQueryAction = function (request) {
        return this._transport.send("WUQuerySetQueryAction", request);
    };
    Service.prototype.WUPublishWorkunit = function (request) {
        return this._transport.send("WUPublishWorkunit", request);
    };
    Service.prototype.WUGetGraph = function (request) {
        return this._transport.send("WUGetGraph", request);
    };
    Service.prototype.WUResult = function (request) {
        return this._transport.send("WUResult", request);
    };
    Service.prototype.WUQueryGetGraph = function (request) {
        return this._transport.send("WUQueryGetGraph", request);
    };
    Service.prototype.WUFile = function (request) {
        return this._transport.send("WUFile", request, "text");
    };
    Service.prototype.WUGetStats = function (request) {
        return this._transport.send("WUGetStats", request);
    };
    Service.prototype.WUDetails = function (request) {
        return this._transport.send("WUDetails", request);
    };
    Service.prototype.WUCDebug = function (request) {
        return this._transport.send("WUCDebug", request).then(function (response) {
            var retVal = xml2json(response.Result);
            if (retVal.children.length) {
                return retVal.children[0];
            }
            return null;
        });
    };
    return Service;
}());

var Service$1 = (function () {
    function Service(transport) {
        if (typeof transport === "string") {
            transport = exports.createTransport(transport);
        }
        this._transport = new ESPTransport(transport, "WsTopology", "1.25");
    }
    Service.prototype.TpLogicalClusterQuery = function (request) {
        if (request === void 0) { request = {}; }
        return this._transport.send("WUUpdate", request);
    };
    Service.prototype.DefaultTpLogicalClusterQuery = function (request) {
        if (request === void 0) { request = {}; }
        return this.TpLogicalClusterQuery(request).then(function (response) {
            if (response.default) {
                return response.default;
            }
            var firstHThor;
            var first;
            response.TpLogicalClusters.TpLogicalCluster.some(function (item, idx) {
                if (idx === 0) {
                    first = item;
                }
                if (item.Type === "hthor") {
                    firstHThor = item;
                    return true;
                }
                return false;
            });
            return firstHThor || first;
        });
    };
    return Service;
}());

var Service$2 = (function () {
    function Service(transport) {
        if (typeof transport === "string") {
            transport = exports.createTransport(transport);
        }
        this._transport = new ESPTransport(transport, "WsSMC", "1.19");
    }
    Service.prototype.Activity = function (request) {
        return this._transport.send("Activity", request);
    };
    return Service;
}());

var Service$3 = (function () {
    function Service(transport) {
        if (typeof transport === "string") {
            transport = exports.createTransport(transport);
        }
        this._transport = new ESPTransport(transport, "WsDFU", "1.35");
    }
    return Service;
}());

//  Ported to TypeScript from:  https://github.com/bevacqua/hash-sum
function pad(hash, len) {
    while (hash.length < len) {
        hash = "0" + hash;
    }
    return hash;
}
function fold(hash, text) {
    if (text.length === 0) {
        return hash;
    }
    for (var i = 0; i < text.length; ++i) {
        var chr = text.charCodeAt(i);
        // tslint:disable:no-bitwise
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
        // tslint:enable:no-bitwise
    }
    return hash < 0 ? hash * -2 : hash;
}
function foldObject(hash, o, seen) {
    return Object.keys(o).sort().reduce(function (input, key) {
        return foldValue(input, o[key], key, seen);
    }, hash);
}
function foldValue(input, value, key, seen) {
    var hash = fold(fold(fold(input, key), toString(value)), typeof value);
    if (value === null) {
        return fold(hash, "null");
    }
    if (value === undefined) {
        return fold(hash, "undefined");
    }
    if (typeof value === "object") {
        if (seen.indexOf(value) !== -1) {
            return fold(hash, "[Circular]" + key);
        }
        seen.push(value);
        return foldObject(hash, value, seen);
    }
    return fold(hash, value.toString());
}
function toString(o) {
    return Object.prototype.toString.call(o);
}
function hashSum(o) {
    return pad(foldValue(0, o, "", []).toString(16), 8);
}

/**
 * inner - return inner property of Object
 * Usage:  inner("some.prop.to.locate", obj);
 *
 * @param prop - property to locate
 * @param obj - object to locate property in
 */
/**
 * inner - return inner property of Object
 * Usage:  inner("some.prop.to.locate", obj);
 *
 * @param prop - property to locate
 * @param obj - object to locate property in
 */ function inner(prop, obj) {
    if (prop === void 0 || obj === void 0)
        return void 0;
    for (var _i = 0, _a = prop.split("."); _i < _a.length; _i++) {
        var item = _a[_i];
        if (!obj.hasOwnProperty(item)) {
            return undefined;
        }
        obj = obj[item];
    }
    return obj;
}
/**
 * exists - return inner property of Object
 * Usage:  inner("some.prop.to.locate", obj);
 *
 * @param prop - property to locate
 * @param obj - object to locate property in
 */
function exists(prop, obj) {
    return inner(prop, obj) !== undefined;
}

var ObserverHandle = (function () {
    function ObserverHandle(eventTarget, eventID, callback) {
        this.eventTarget = eventTarget;
        this.eventID = eventID;
        this.callback = callback;
    }
    ObserverHandle.prototype.release = function () {
        this.eventTarget.removeObserver(this.eventID, this.callback);
    };
    ObserverHandle.prototype.unwatch = function () {
        this.release();
    };
    return ObserverHandle;
}());
var Observable = (function () {
    function Observable() {
        var events = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            events[_i] = arguments[_i];
        }
        this._eventObservers = {};
        this._knownEvents = events;
    }
    Observable.prototype.addObserver = function (eventID, callback) {
        var eventObservers = this._eventObservers[eventID];
        if (!eventObservers) {
            eventObservers = [];
            this._eventObservers[eventID] = eventObservers;
        }
        eventObservers.push(callback);
        return new ObserverHandle(this, eventID, callback);
    };
    Observable.prototype.removeObserver = function (eventID, callback) {
        var eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (var i = eventObservers.length - 1; i >= 0; --i) {
                if (eventObservers[i] === callback) {
                    eventObservers.splice(i, 1);
                }
            }
        }
        return this;
    };
    Observable.prototype.dispatchEvent = function (eventID) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (var _a = 0, eventObservers_1 = eventObservers; _a < eventObservers_1.length; _a++) {
                var observer = eventObservers_1[_a];
                observer.apply(void 0, args);
            }
        }
        return this;
    };
    Observable.prototype._hasObserver = function (eventID) {
        var eventObservers = this._eventObservers[eventID];
        for (var observer in eventObservers) {
            if (eventObservers[observer]) {
                return true;
            }
        }
        return false;
    };
    Observable.prototype.hasObserver = function (_eventID) {
        if (_eventID !== void 0) {
            return this._hasObserver(_eventID);
        }
        for (var eventID in this._eventObservers) {
            if (this._hasObserver(eventID)) {
                return true;
            }
        }
        return false;
    };
    return Observable;
}());

var StateObject = (function () {
    function StateObject() {
        this._espState = {};
        this._espStateCache = {};
        this._events = new Observable();
    }
    StateObject.prototype.clear = function (newVals) {
        this._espState = {};
        this._espStateCache = {};
        if (newVals !== void 0) {
            this.set(newVals);
        }
    };
    StateObject.prototype.get = function (key, defValue) {
        if (key === void 0) {
            return this._espState;
        }
        return this.has(key) ? this._espState[key] : defValue;
    };
    StateObject.prototype.innerXXX = function (qualifiedID, defValue) {
        return exists(qualifiedID, this._espState) ? inner(qualifiedID, this._espState) : defValue;
    };
    StateObject.prototype.set = function (keyOrNewVals, newVal, batchMode) {
        if (batchMode === void 0) { batchMode = false; }
        if (typeof keyOrNewVals === "string") {
            return this.setSingle(keyOrNewVals, newVal, batchMode);
        }
        return this.setAll(keyOrNewVals);
    };
    StateObject.prototype.setSingle = function (key, newVal, batchMode) {
        var oldCacheVal = this._espStateCache[key];
        var newCacheVal = hashSum(newVal);
        if (oldCacheVal !== newCacheVal) {
            this._espStateCache[key] = newCacheVal;
            var oldVal = this._espState[key];
            this._espState[key] = newVal;
            var changedInfo = { id: key, oldValue: oldVal, newValue: newVal };
            if (!batchMode) {
                this._events.dispatchEvent("propChanged", changedInfo);
                this._events.dispatchEvent("changed", [changedInfo]);
            }
            return changedInfo;
        }
        return null;
    };
    StateObject.prototype.setAll = function (_) {
        var changed = [];
        for (var key in _) {
            if (_.hasOwnProperty(key)) {
                var changedInfo = this.setSingle(key, _[key], true);
                if (changedInfo) {
                    changed.push(changedInfo);
                }
            }
        }
        if (changed.length) {
            for (var _i = 0, changed_1 = changed; _i < changed_1.length; _i++) {
                var changeInfo = changed_1[_i];
                this._events.dispatchEvent(("propChanged"), changeInfo);
            }
            this._events.dispatchEvent(("changed"), changed);
        }
        return changed;
    };
    StateObject.prototype.has = function (key) {
        return this._espState[key] !== void 0;
    };
    StateObject.prototype.on = function (eventID, propIDOrCallback, callback) {
        if (this.isCallback(propIDOrCallback)) {
            switch (eventID) {
                case "changed":
                    return this._events.addObserver(eventID, propIDOrCallback);
                default:
            }
        }
        else {
            switch (eventID) {
                case "propChanged":
                    return this._events.addObserver(eventID, function (changeInfo) {
                        if (changeInfo.id === propIDOrCallback) {
                            callback(changeInfo);
                        }
                    });
                default:
            }
        }
        return this;
    };
    StateObject.prototype.isCallback = function (propIDOrCallback) {
        return (typeof propIDOrCallback === "function");
    };
    StateObject.prototype.hasEventListener = function () {
        return this._events.hasObserver();
    };
    return StateObject;
}());
var Cache = (function () {
    function Cache(calcID) {
        this._cache = {};
        this._calcID = calcID;
    }
    Cache.hash = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return hashSum(__assign({}, args));
    };
    Cache.prototype.has = function (espObj) {
        return this._calcID(espObj) in this._cache;
    };
    Cache.prototype.set = function (obj) {
        this._cache[this._calcID(obj)] = obj;
        return obj;
    };
    Cache.prototype.get = function (espObj, factory) {
        var retVal = this._cache[this._calcID(espObj)];
        if (!retVal) {
            return this.set(factory());
        }
        return retVal;
    };
    return Cache;
}());

//  TODO switch to propper logger  ---
//  TODO switch to propper logger  ---
var Level;
(function (Level) {
    Level[Level["debug"] = 0] = "debug";
    Level[Level["info"] = 1] = "info";
    Level[Level["notice"] = 2] = "notice";
    Level[Level["warning"] = 3] = "warning";
    Level[Level["error"] = 4] = "error";
    Level[Level["critical"] = 5] = "critical";
    Level[Level["alert"] = 6] = "alert";
    Level[Level["emergency"] = 7] = "emergency";
})(Level || (Level = {}));
var Logging = (function () {
    function Logging() {
    }
    Logging.prototype.log = function (level, msg) {
        var d = new Date();
        var n = d.toISOString();
        // tslint:disable-next-line:no-console
        console.log(n + " <" + Level[level] + ">:  " + msg);
    };
    Logging.prototype.debug = function (msg) {
        this.log(Level.debug, msg);
    };
    Logging.prototype.info = function (msg) {
        this.log(Level.info, msg);
    };
    Logging.prototype.notice = function (msg) {
        this.log(Level.notice, msg);
    };
    Logging.prototype.warning = function (msg) {
        this.log(Level.warning, msg);
    };
    Logging.prototype.error = function (msg) {
        this.log(Level.error, msg);
    };
    Logging.prototype.critical = function (msg) {
        this.log(Level.critical, msg);
    };
    Logging.prototype.alert = function (msg) {
        this.log(Level.alert, msg);
    };
    Logging.prototype.emergency = function (msg) {
        this.log(Level.emergency, msg);
    };
    return Logging;
}());
var logger = new Logging();

var Graph = (function (_super) {
    __extends(Graph, _super);
    function Graph(connection, wuid, eclGraph, eclTimers) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        var duration = 0;
        for (var _i = 0, eclTimers_1 = eclTimers; _i < eclTimers_1.length; _i++) {
            var eclTimer = eclTimers_1[_i];
            if (eclTimer.GraphName === eclGraph.Name && !eclTimer.HasSubGraphId) {
                duration = Math.round(eclTimer.Seconds * 1000) / 1000;
                break;
            }
        }
        _this.set(__assign({ Wuid: wuid, Time: duration }, eclGraph));
        return _this;
    }
    Object.defineProperty(Graph.prototype, "properties", {
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Name", {
        get: function () { return this.get("Name"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Label", {
        get: function () { return this.get("Label"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Type", {
        get: function () { return this.get("Type"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Complete", {
        get: function () { return this.get("Complete"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "WhenStarted", {
        get: function () { return this.get("WhenStarted"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "WhenFinished", {
        get: function () { return this.get("WhenFinished"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "Time", {
        get: function () { return this.get("Time"); },
        enumerable: true,
        configurable: true
    });
    return Graph;
}(StateObject));
var GraphCache = (function (_super) {
    __extends(GraphCache, _super);
    function GraphCache() {
        return _super.call(this, function (obj) {
            return Cache.hash([obj.Name]);
        }) || this;
    }
    return GraphCache;
}(Cache));
//  XGMML Graph ---
var ATTR_DEFINITION = "definition";
var GraphItem = (function () {
    function GraphItem(parent, id, attrs) {
        this.parent = parent;
        this.id = id;
        this.attrs = attrs;
    }
    GraphItem.prototype.className = function () {
        return this.constructor.name;
    };
    GraphItem.prototype.hasECLDefinition = function () {
        return this.attrs[ATTR_DEFINITION] !== undefined;
    };
    GraphItem.prototype.getECLDefinition = function () {
        var match = /([a-z]:\\(?:[-\w\.\d]+\\)*(?:[-\w\.\d]+)?|(?:\/[\w\.\-]+)+)\((\d*),(\d*)\)/.exec(this.attrs[ATTR_DEFINITION]);
        if (match) {
            var _file = match[1], _row = match[2], _col = match[3];
            _file.replace("/./", "/");
            return {
                id: this.id,
                file: _file,
                line: +_row,
                column: +_col
            };
        }
        throw "Bad definition:  " + this.attrs[ATTR_DEFINITION];
    };
    return GraphItem;
}());
var Subgraph = (function (_super) {
    __extends(Subgraph, _super);
    function Subgraph(parent, id, attrs) {
        var _this = _super.call(this, parent, id, attrs) || this;
        _this.subgraphs = [];
        _this.subgraphsMap = {};
        _this.vertices = [];
        _this.verticesMap = {};
        _this.edges = [];
        _this.edgesMap = {};
        if (parent) {
            parent.addSubgraph(_this);
        }
        return _this;
    }
    Subgraph.prototype.addSubgraph = function (subgraph) {
        if (this.subgraphsMap[subgraph.id] !== undefined) {
            throw "Subgraph already exists";
        }
        this.subgraphsMap[subgraph.id] = subgraph;
        this.subgraphs.push(subgraph);
    };
    Subgraph.prototype.addVertex = function (vertex) {
        if (this.verticesMap[vertex.id] !== undefined) {
            throw "Vertex already exists";
        }
        this.verticesMap[vertex.id] = vertex;
        this.vertices.push(vertex);
    };
    Subgraph.prototype.addEdge = function (edge) {
        if (this.edgesMap[edge.id] !== undefined) {
            throw "Edge already exists";
        }
        this.edgesMap[edge.id] = edge;
        this.edges.push(edge);
    };
    Subgraph.prototype.getNearestDefinition = function (backwards) {
        if (backwards === void 0) { backwards = true; }
        if (this.hasECLDefinition()) {
            return this.getECLDefinition();
        }
        if (backwards) {
            for (var i = this.vertices.length - 1; i >= 0; --i) {
                var vertex = this.vertices[i];
                if (vertex.hasECLDefinition()) {
                    return vertex.getECLDefinition();
                }
            }
        }
        var retVal;
        this.vertices.some(function (vertex) {
            retVal = vertex.getNearestDefinition();
            if (retVal) {
                return true;
            }
            return false;
        });
        return retVal;
    };
    return Subgraph;
}(GraphItem));
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    function Vertex(parent, id, label, attrs) {
        var _this = _super.call(this, parent, id, attrs) || this;
        _this.inEdges = [];
        _this.outEdges = [];
        _this.label = label;
        parent.addVertex(_this);
        return _this;
    }
    Vertex.prototype.getNearestDefinition = function () {
        if (this.hasECLDefinition()) {
            return this.getECLDefinition();
        }
        var retVal;
        this.inEdges.some(function (edge) {
            retVal = edge.getNearestDefinition();
            if (retVal) {
                return true;
            }
            return false;
        });
        return retVal;
    };
    return Vertex;
}(GraphItem));
var XGMMLGraph = (function (_super) {
    __extends(XGMMLGraph, _super);
    function XGMMLGraph(id) {
        var _this = _super.call(this, null, id, {}) || this;
        _this.allSubgraphs = {};
        _this.allVertices = {};
        _this.allEdges = {};
        return _this;
    }
    XGMMLGraph.prototype.breakpointLocations = function (path) {
        var retVal = [];
        for (var key in this.allVertices) {
            if (this.allVertices.hasOwnProperty(key)) {
                var vertex = this.allVertices[key];
                if (vertex.hasECLDefinition()) {
                    var definition = vertex.getECLDefinition();
                    if (definition && !path || path === definition.file) {
                        retVal.push(definition);
                    }
                }
            }
        }
        return retVal.sort(function (l, r) {
            return l.line - r.line;
        });
    };
    return XGMMLGraph;
}(Subgraph));
var Edge = (function (_super) {
    __extends(Edge, _super);
    function Edge(parent, id, sourceID, targetID, attrs) {
        var _this = _super.call(this, parent, id, attrs) || this;
        _this.sourceID = sourceID;
        _this.targetID = targetID;
        parent.addEdge(_this);
        return _this;
    }
    Edge.prototype.getNearestDefinition = function () {
        if (this.hasECLDefinition()) {
            return this.getECLDefinition();
        }
        return this.source.getNearestDefinition();
    };
    return Edge;
}(Subgraph));
function walkXmlJson(node, callback, stack) {
    stack = stack || [];
    stack.push(node);
    callback(node.name, node.attributes, node.children, stack);
    node.children.forEach(function (childNode) {
        walkXmlJson(childNode, callback, stack);
    });
    stack.pop();
}
function flattenAtt(nodes) {
    var retVal = {};
    nodes.forEach(function (node) {
        if (node.name === "att") {
            retVal[node.attributes["name"]] = node.attributes["value"];
        }
    });
    return retVal;
}
function createXGMMLGraph(id, graphs) {
    var graph = new XGMMLGraph(id);
    var stack = [graph];
    walkXmlJson(graphs, function (tag, attributes, children, _stack) {
        var top = stack[stack.length - 1];
        switch (tag) {
            case "graph":
                break;
            case "node":
                if (children.length && children[0].children.length && children[0].children[0].name === "graph") {
                    var subgraph = new Subgraph(top, "graph" + attributes["id"], flattenAtt(children));
                    graph.allSubgraphs[subgraph.id] = subgraph;
                    stack.push(subgraph);
                }
                else {
                    var vertex = new Vertex(top, attributes["id"], attributes["label"], flattenAtt(children));
                    graph.allVertices[vertex.id] = vertex;
                }
                break;
            case "edge":
                var edge = new Edge(top, attributes["id"], attributes["source"], attributes["target"], flattenAtt(children));
                graph.allEdges[edge.id] = edge;
                break;
            default:
        }
    });
    for (var key in graph.allEdges) {
        if (graph.allEdges.hasOwnProperty(key)) {
            var edge = graph.allEdges[key];
            try {
                edge.source = graph.allVertices[edge.sourceID];
                edge.target = graph.allVertices[edge.targetID];
                edge.source.outEdges.push(edge);
                edge.target.inEdges.push(edge);
            }
            catch (e) { }
        }
    }
    return graph;
}

var Resource = (function (_super) {
    __extends(Resource, _super);
    function Resource(connection, wuid, url) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        var cleanedURL = url.split("\\").join("/");
        var urlParts = cleanedURL.split("/");
        var matchStr = "res/" + wuid + "/";
        var displayPath = "";
        var displayName = "";
        if (cleanedURL.indexOf(matchStr) === 0) {
            displayPath = cleanedURL.substr(matchStr.length);
            displayName = urlParts[urlParts.length - 1];
        }
        _this.set({
            Wuid: wuid,
            URL: url,
            DisplayName: displayName,
            DisplayPath: displayPath
        });
        return _this;
    }
    Object.defineProperty(Resource.prototype, "properties", {
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resource.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resource.prototype, "URL", {
        get: function () { return this.get("URL"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resource.prototype, "DisplayName", {
        get: function () { return this.get("DisplayName"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resource.prototype, "DisplayPath", {
        get: function () { return this.get("DisplayPath"); },
        enumerable: true,
        configurable: true
    });
    return Resource;
}(StateObject));

var Result = (function (_super) {
    __extends(Result, _super);
    function Result(connection, wuid, eclResult, resultViews) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        _this.set(__assign({ Wuid: wuid, ResultViews: resultViews }, eclResult));
        return _this;
    }
    Object.defineProperty(Result.prototype, "properties", {
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Name", {
        get: function () { return this.get("Name"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Sequence", {
        get: function () { return this.get("Sequence"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Value", {
        get: function () { return this.get("Value"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Link", {
        get: function () { return this.get("Link"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "FileName", {
        get: function () { return this.get("FileName"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "IsSupplied", {
        get: function () { return this.get("IsSupplied"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "ShowFileContent", {
        get: function () { return this.get("ShowFileContent"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "Total", {
        get: function () { return this.get("Total"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "ECLSchemas", {
        get: function () { return this.get("ECLSchemas"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "NodeGroup", {
        get: function () { return this.get("NodeGroup"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Result.prototype, "ResultViews", {
        get: function () { return this.get("ResultViews"); },
        enumerable: true,
        configurable: true
    });
    Result.prototype.isComplete = function () {
        return this.Total !== -1;
    };
    Result.prototype.fetchXMLSchema = function () {
        var _this = this;
        if (this.xsdSchema) {
            return Promise.resolve(this.xsdSchema);
        }
        return this.WUResult().then(function (response) {
            if (exists("Result.XmlSchema.xml", response)) {
                _this.xsdSchema = parseXSD(response.Result.XmlSchema.xml);
                return _this.xsdSchema;
            }
            return _this;
        });
    };
    Result.prototype.fetchResult = function () {
        return this.WUResult(0, -1, true).then(function (response) {
            if (exists("Result.Row", response)) {
                return response.Result.Row;
            }
            return [];
        });
    };
    Result.prototype.WUResult = function (start, count, suppressXmlSchema) {
        if (start === void 0) { start = 0; }
        if (count === void 0) { count = 1; }
        if (suppressXmlSchema === void 0) { suppressXmlSchema = false; }
        var request = {};
        if (this.Wuid && this.Sequence !== undefined) {
            request.Wuid = this.Wuid;
            request.Sequence = this.Sequence;
        }
        else if (this.Name && this.NodeGroup) {
            request.LogicalName = this.Name;
            request.Cluster = this.NodeGroup;
        }
        else if (this.Name) {
            request.LogicalName = this.Name;
        }
        request.Start = start;
        request.Count = count;
        request.SuppressXmlSchema = suppressXmlSchema;
        return this.connection.WUResult(request).then(function (response) {
            return response;
        });
    };
    return Result;
}(StateObject));
var ResultCache = (function (_super) {
    __extends(ResultCache, _super);
    function ResultCache() {
        return _super.call(this, function (obj) {
            return Cache.hash([obj.Sequence, obj.Name, obj.FileName]);
        }) || this;
    }
    return ResultCache;
}(Cache));

var SourceFile = (function (_super) {
    __extends(SourceFile, _super);
    function SourceFile(connection, wuid, eclSourceFile) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        _this.set(__assign({ Wuid: wuid }, eclSourceFile));
        return _this;
    }
    Object.defineProperty(SourceFile.prototype, "properties", {
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceFile.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceFile.prototype, "FileCluster", {
        get: function () { return this.get("FileCluster"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceFile.prototype, "Name", {
        get: function () { return this.get("Name"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceFile.prototype, "Count", {
        get: function () { return this.get("Count"); },
        enumerable: true,
        configurable: true
    });
    return SourceFile;
}(StateObject));

function espTime2Seconds(duration) {
    if (!duration) {
        return 0;
    }
    else if (!isNaN(duration)) {
        return parseFloat(duration);
    }
    //  GH:  <n>ns or <m>ms or <s>s or [<d> days ][<h>:][<m>:]<s>[.<ms>]
    var nsIndex = duration.indexOf("ns");
    if (nsIndex !== -1) {
        return parseFloat(duration.substr(0, nsIndex)) / 1000000000;
    }
    var msIndex = duration.indexOf("ms");
    if (msIndex !== -1) {
        return parseFloat(duration.substr(0, msIndex)) / 1000;
    }
    var sIndex = duration.indexOf("s");
    if (sIndex !== -1 && duration.indexOf("days") === -1) {
        return parseFloat(duration.substr(0, sIndex));
    }
    var dayTimeParts = duration.split(" days ");
    var days = parseFloat(dayTimeParts.length > 1 ? dayTimeParts[0] : 0.0);
    var time = dayTimeParts.length > 1 ? dayTimeParts[1] : dayTimeParts[0];
    var secs = 0.0;
    var timeParts = time.split(":").reverse();
    for (var j = 0; j < timeParts.length; ++j) {
        secs += parseFloat(timeParts[j]) * Math.pow(60, j);
    }
    return (days * 24 * 60 * 60) + secs;
}

var Timer = (function (_super) {
    __extends(Timer, _super);
    function Timer(connection, wuid, eclTimer) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        var secs = espTime2Seconds(eclTimer.Value);
        _this.set(__assign({ Wuid: wuid, Seconds: Math.round(secs * 1000) / 1000, HasSubGraphId: eclTimer.SubGraphId !== undefined, XXX: true }, eclTimer));
        return _this;
    }
    Object.defineProperty(Timer.prototype, "properties", {
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "Name", {
        get: function () { return this.get("Name"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "Value", {
        get: function () { return this.get("Value"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "Seconds", {
        get: function () { return this.get("Seconds"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "GraphName", {
        get: function () { return this.get("GraphName"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "SubGraphId", {
        get: function () { return this.get("SubGraphId"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "HasSubGraphId", {
        get: function () { return this.get("HasSubGraphId"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Timer.prototype, "count", {
        get: function () { return this.get("count"); },
        enumerable: true,
        configurable: true
    });
    return Timer;
}(StateObject));

var WUStateID$1 = WUStateID;
var WorkunitCache = (function (_super) {
    __extends(WorkunitCache, _super);
    function WorkunitCache() {
        return _super.call(this, function (obj) {
            return obj.Wuid;
        }) || this;
    }
    return WorkunitCache;
}(Cache));
var _workunits = new WorkunitCache();
var Workunit = (function (_super) {
    __extends(Workunit, _super);
    //  ---  ---  ---
    function Workunit(connection, topologyConnection, wuid) {
        var _this = _super.call(this) || this;
        _this._debugMode = false;
        _this._monitorTickCount = 0;
        _this._resultCache = new ResultCache();
        _this._graphCache = new GraphCache();
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        if (topologyConnection instanceof Service$1) {
            _this.topologyConnection = topologyConnection;
        }
        else {
            _this.topologyConnection = new Service$1(topologyConnection || connection);
        }
        _this.clearState(wuid);
        return _this;
    }
    Object.defineProperty(Workunit.prototype, "properties", {
        //  Accessors  ---
        get: function () { return this.get(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Wuid", {
        get: function () { return this.get("Wuid"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Owner", {
        get: function () { return this.get("Owner", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Cluster", {
        get: function () { return this.get("Cluster", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Jobname", {
        get: function () { return this.get("Jobname", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Description", {
        get: function () { return this.get("Description", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ActionEx", {
        get: function () { return this.get("ActionEx", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "StateID", {
        get: function () { return this.get("StateID", WUStateID.Unknown); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "State", {
        get: function () { return WUStateID[this.StateID]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Protected", {
        get: function () { return this.get("Protected", false); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Exceptions", {
        get: function () { return this.get("Exceptions", { ECLException: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResultViews", {
        get: function () { return this.get("ResultViews", []); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResultCount", {
        get: function () { return this.get("ResultCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Results", {
        get: function () { return this.get("Results", { ECLResult: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "CResults", {
        get: function () {
            var _this = this;
            return this.Results.ECLResult.map(function (eclResult) {
                return _this._resultCache.get(eclResult, function () {
                    return new Result(_this.connection, _this.Wuid, eclResult, _this.ResultViews);
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "SequenceResults", {
        get: function () {
            var retVal = {};
            this.CResults.forEach(function (result) {
                retVal[result.Sequence] = result;
            });
            return retVal;
        },
        enumerable: true,
        configurable: true
    });
    
    Object.defineProperty(Workunit.prototype, "Timers", {
        get: function () { return this.get("Timers", { ECLTimer: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "CTimers", {
        get: function () {
            var _this = this;
            return this.Timers.ECLTimer.map(function (eclTimer) {
                return new Timer(_this.connection, _this.Wuid, eclTimer);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "GraphCount", {
        get: function () { return this.get("GraphCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Graphs", {
        get: function () { return this.get("Graphs", { ECLGraph: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "CGraphs", {
        get: function () {
            var _this = this;
            return this.Graphs.ECLGraph.map(function (eclGraph) {
                return _this._graphCache.get(eclGraph, function () {
                    return new Graph(_this.connection, _this.Wuid, eclGraph, _this.CTimers);
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ThorLogList", {
        get: function () { return this.get("ThorLogList"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResourceURLCount", {
        get: function () { return this.get("ResourceURLCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResourceURLs", {
        get: function () { return this.get("ResourceURLs", { URL: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "CResourceURLs", {
        get: function () {
            var _this = this;
            return this.ResourceURLs.URL.map(function (url) {
                return new Resource(_this.connection, _this.Wuid, url);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "TotalClusterTime", {
        get: function () { return this.get("TotalClusterTime", ""); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "DateTimeScheduled", {
        get: function () { return this.get("DateTimeScheduled"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "IsPausing", {
        get: function () { return this.get("IsPausing"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ThorLCR", {
        get: function () { return this.get("ThorLCR"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ApplicationValues", {
        get: function () { return this.get("ApplicationValues", { ApplicationValue: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "HasArchiveQuery", {
        get: function () { return this.get("HasArchiveQuery"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "StateEx", {
        get: function () { return this.get("StateEx"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "PriorityClass", {
        get: function () { return this.get("PriorityClass"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "PriorityLevel", {
        get: function () { return this.get("PriorityLevel"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Snapshot", {
        get: function () { return this.get("Snapshot"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResultLimit", {
        get: function () { return this.get("ResultLimit"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "EventSchedule", {
        get: function () { return this.get("EventSchedule"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "HaveSubGraphTimings", {
        get: function () { return this.get("HaveSubGraphTimings"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Query", {
        get: function () { return this.get("Query"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "HelpersCount", {
        get: function () { return this.get("HelpersCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Helpers", {
        get: function () { return this.get("Helpers", { ECLHelpFile: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "DebugValues", {
        get: function () { return this.get("DebugValues"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "AllowedClusters", {
        get: function () { return this.get("AllowedClusters"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ErrorCount", {
        get: function () { return this.get("ErrorCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "WarningCount", {
        get: function () { return this.get("WarningCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "InfoCount", {
        get: function () { return this.get("InfoCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "AlertCount", {
        get: function () { return this.get("AlertCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "SourceFileCount", {
        get: function () { return this.get("SourceFileCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "SourceFiles", {
        get: function () { return this.get("SourceFiles", { ECLSourceFile: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "CSourceFiles", {
        get: function () {
            var _this = this;
            return this.SourceFiles.ECLSourceFile.map(function (eclSourceFile) {
                return new SourceFile(_this.connection, _this.Wuid, eclSourceFile);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "VariableCount", {
        get: function () { return this.get("VariableCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Variables", {
        get: function () { return this.get("Variables", { ECLVariable: [] }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "TimerCount", {
        get: function () { return this.get("TimerCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "HasDebugValue", {
        get: function () { return this.get("HasDebugValue"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ApplicationValueCount", {
        get: function () { return this.get("ApplicationValueCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "XmlParams", {
        get: function () { return this.get("XmlParams"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "AccessFlag", {
        get: function () { return this.get("AccessFlag"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ClusterFlag", {
        get: function () { return this.get("ClusterFlag"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "ResultViewCount", {
        get: function () { return this.get("ResultViewCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "DebugValueCount", {
        get: function () { return this.get("DebugValueCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "WorkflowCount", {
        get: function () { return this.get("WorkflowCount", 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "Archived", {
        get: function () { return this.get("Archived"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Workunit.prototype, "DebugState", {
        get: function () { return this.get("DebugState", {}); },
        enumerable: true,
        configurable: true
    });
    Workunit.create = function (connection, topologyConnection) {
        var retVal = new Workunit(connection, topologyConnection);
        return retVal.connection.WUCreate().then(function (response) {
            _workunits.set(retVal);
            retVal.set(response.Workunit);
            return retVal;
        });
    };
    Workunit.attach = function (arg0, arg1, arg2, state) {
        var retVal;
        if (arg0 instanceof Service && arg1 instanceof Service$1) {
            retVal = _workunits.get({ Wuid: arg2 }, function () {
                return new Workunit(arg0, arg1, arg2);
            });
        }
        else {
            retVal = _workunits.get({ Wuid: arg1 }, function () {
                return new Workunit(arg0, arg1);
            });
            state = arg2;
        }
        if (state) {
            retVal.set(state);
        }
        return retVal;
    };
    Workunit.exists = function (wuid) {
        return _workunits.has({ Wuid: wuid });
    };
    Workunit.prototype.clearState = function (wuid) {
        this.clear({
            Wuid: wuid,
            StateID: WUStateID$1.Unknown
        });
        this._monitorTickCount = 0;
    };
    Workunit.prototype.update = function (request, appData, debugData) {
        var _this = this;
        return this.connection.WUUpdate(__assign({}, request, {
            Wuid: this.Wuid,
            StateOrig: this.State,
            JobnameOrig: this.Jobname,
            DescriptionOrig: this.Description,
            ProtectedOrig: this.Protected,
            ClusterOrig: this.Cluster,
            ApplicationValues: appData,
            DebugValues: debugData
        })).then(function (response) {
            _this.set(response.Workunit);
            return _this;
        });
    };
    Workunit.prototype.submit = function (_cluster, action, resultLimit) {
        var _this = this;
        if (action === void 0) { action = exports.WUAction.Run; }
        var clusterPromise;
        if (_cluster !== void 0) {
            clusterPromise = Promise.resolve(_cluster);
        }
        else {
            clusterPromise = this.topologyConnection.DefaultTpLogicalClusterQuery().then(function (response) {
                return response.Name;
            });
        }
        this._debugMode = false;
        if (action === exports.WUAction.Debug) {
            action = exports.WUAction.Run;
            this._debugMode = true;
        }
        return clusterPromise.then(function (cluster) {
            return _this.connection.WUUpdate({
                Wuid: _this.Wuid,
                Action: action,
                ResultLimit: resultLimit
            }, {}, { Debug: _this._debugMode }).then(function (response) {
                _this.set(response.Workunit);
                _this._submitAction = action;
                return _this.connection.WUSubmit({ Wuid: _this.Wuid, Cluster: cluster }).then(function () {
                    return _this;
                });
            });
        });
    };
    Workunit.prototype.isComplete = function () {
        switch (this.StateID) {
            case WUStateID$1.Compiled:
                return this.ActionEx === "compile" || this._submitAction === exports.WUAction.Compile;
            case WUStateID$1.Completed:
            case WUStateID$1.Failed:
            case WUStateID$1.Aborted:
            case WUStateID$1.NotFound:
                return true;
            default:
        }
        return false;
    };
    Workunit.prototype.isFailed = function () {
        switch (this.StateID) {
            case WUStateID$1.Failed:
                return true;
            default:
        }
        return false;
    };
    Workunit.prototype.isDeleted = function () {
        switch (this.StateID) {
            case WUStateID$1.NotFound:
                return true;
            default:
        }
        return false;
    };
    Workunit.prototype.isDebugging = function () {
        switch (this.StateID) {
            case WUStateID$1.DebugPaused:
            case WUStateID$1.DebugRunning:
                return true;
            default:
        }
        return false;
    };
    Workunit.prototype.isRunning = function () {
        switch (this.StateID) {
            case WUStateID$1.Compiled:
            case WUStateID$1.Running:
            case WUStateID$1.Aborting:
            case WUStateID$1.Blocked:
            case WUStateID$1.DebugPaused:
            case WUStateID$1.DebugRunning:
                return true;
            default:
        }
        return false;
    };
    Workunit.prototype.setToFailed = function () {
        return this.WUAction("SetToFailed");
    };
    Workunit.prototype.pause = function () {
        return this.WUAction("Pause");
    };
    Workunit.prototype.pauseNow = function () {
        return this.WUAction("PauseNow");
    };
    Workunit.prototype.resume = function () {
        return this.WUAction("Resume");
    };
    Workunit.prototype.abort = function () {
        return this.WUAction("Abort");
    };
    Workunit.prototype.delete = function () {
        return this.WUAction("Delete");
    };
    Workunit.prototype.restore = function () {
        return this.WUAction("Restore");
    };
    Workunit.prototype.deschedule = function () {
        return this.WUAction("Deschedule");
    };
    Workunit.prototype.reschedule = function () {
        return this.WUAction("Reschedule");
    };
    Workunit.prototype.refresh = function (full) {
        var _this = this;
        if (full === void 0) { full = false; }
        var refreshPromise = full ? this.WUInfo() : this.WUQuery();
        var debugPromise = this.debugStatus();
        return Promise.all([
            refreshPromise,
            debugPromise
        ]).then(function () {
            return _this;
        });
    };
    Workunit.prototype.fetchResults = function () {
        var _this = this;
        return this.WUInfo({ IncludeResults: true }).then(function () {
            return _this.CResults;
        });
    };
    
    //  Monitoring  ---
    Workunit.prototype._monitor = function () {
        var _this = this;
        if (this._monitorHandle || this.isComplete()) {
            this._monitorTickCount = 0;
            return;
        }
        this._monitorHandle = setTimeout(function () {
            var refreshPromise = _this.hasEventListener() ? _this.refresh(true) : Promise.resolve(null);
            refreshPromise.then(function () {
                _this._monitor();
            });
            delete _this._monitorHandle;
        }, this._monitorTimeoutDuraction());
    };
    Workunit.prototype._monitorTimeoutDuraction = function () {
        ++this._monitorTickCount;
        if (this._monitorTickCount <= 1) {
            return 0;
        }
        else if (this._monitorTickCount <= 3) {
            return 500;
        }
        else if (this._monitorTickCount <= 10) {
            return 1000;
        }
        else if (this._monitorTickCount <= 20) {
            return 3000;
        }
        else if (this._monitorTickCount <= 30) {
            return 5000;
        }
        return 10000;
    };
    //  Events  ---
    Workunit.prototype.on = function (eventID, propIDorCallback, callback) {
        var _this = this;
        if (this.isCallback(propIDorCallback)) {
            switch (eventID) {
                case "completed":
                    _super.prototype.on.call(this, "propChanged", "StateID", function (changeInfo) {
                        if (_this.isComplete()) {
                            propIDorCallback([changeInfo]);
                        }
                    });
                    break;
                case "changed":
                    _super.prototype.on.call(this, eventID, propIDorCallback);
                    break;
                default:
            }
        }
        else {
            switch (eventID) {
                case "changed":
                    _super.prototype.on.call(this, eventID, propIDorCallback, callback);
                    break;
                default:
            }
        }
        this._monitor();
        return this;
    };
    Workunit.prototype.watch = function (callback, triggerChange) {
        var _this = this;
        if (triggerChange === void 0) { triggerChange = true; }
        if (typeof callback !== "function") {
            throw new Error("Invalid Callback");
        }
        if (triggerChange) {
            setTimeout(function () {
                var props = _this.properties;
                var changes = [];
                for (var key in props) {
                    if (props.hasOwnProperty(props)) {
                        changes.push({ id: key, newValue: props[key], oldValue: undefined });
                    }
                }
                callback(changes);
            }, 0);
        }
        var retVal = _super.prototype.on.call(this, "changed", callback);
        this._monitor();
        return retVal;
    };
    Workunit.prototype.watchUntilComplete = function (callback) {
        var _this = this;
        return new Promise(function (resolve, _) {
            var watchHandle = _this.watch(function (changes) {
                if (callback) {
                    callback(changes);
                }
                if (_this.isComplete()) {
                    watchHandle.release();
                    resolve(_this);
                }
            });
        });
    };
    Workunit.prototype.watchUntilRunning = function (callback) {
        var _this = this;
        return new Promise(function (resolve, _) {
            var watchHandle = _this.watch(function (changes) {
                if (callback) {
                    callback(changes);
                }
                if (_this.isComplete() || _this.isRunning()) {
                    watchHandle.release();
                    resolve(_this);
                }
            });
        });
    };
    //  WsWorkunits passthroughs  ---
    Workunit.prototype.WUQuery = function (_request) {
        var _this = this;
        if (_request === void 0) { _request = {}; }
        return this.connection.WUQuery(__assign({}, _request, { Wuid: this.Wuid })).then(function (response) {
            _this.set(response.Workunits.ECLWorkunit[0]);
            return response;
        }).catch(function (e) {
            //  deleted  ---
            var wuMissing = e.Exception.some(function (exception) {
                if (exception.Code === 20081) {
                    _this.clearState(_this.Wuid);
                    _this.set("StateID", WUStateID$1.NotFound);
                    return true;
                }
                return false;
            });
            if (!wuMissing) {
                logger.warning("Unexpected exception:  ");
                throw e;
            }
            return {};
        });
    };
    Workunit.prototype.WUCreate = function () {
        var _this = this;
        return this.connection.WUCreate().then(function (response) {
            _this.set(response.Workunit);
            _workunits.set(_this);
            return response;
        });
    };
    Workunit.prototype.WUInfo = function (_request) {
        var _this = this;
        if (_request === void 0) { _request = {}; }
        var includeResults = _request.IncludeResults || _request.IncludeResultsViewNames;
        return this.connection.WUInfo(__assign({}, _request, { Wuid: this.Wuid, IncludeResults: includeResults, IncludeResultsViewNames: includeResults, SuppressResultSchemas: false })).then(function (response) {
            if (response.Workunit.ResourceURLCount) {
                response.Workunit.ResourceURLCount = response.Workunit.ResourceURLCount - 1;
            }
            if (response.Workunit.ResourceURLs && response.Workunit.ResourceURLs.URL) {
                response.Workunit.ResourceURLs.URL = response.Workunit.ResourceURLs.URL.filter(function (_, idx) {
                    return idx > 0;
                });
            }
            _this.set(response.Workunit);
            _this.set({
                ResultViews: includeResults ? response.ResultViews : [],
                HelpersCount: response.Workunit.Helpers && response.Workunit.Helpers.ECLHelpFile ? response.Workunit.Helpers.ECLHelpFile.length : 0
            });
            return response;
        }).catch(function (e) {
            //  deleted  ---
            var wuMissing = e.Exception.some(function (exception) {
                if (exception.Code === 20080) {
                    _this.clearState(_this.Wuid);
                    _this.set("StateID", WUStateID$1.NotFound);
                    return true;
                }
                return false;
            });
            if (!wuMissing) {
                logger.warning("Unexpected exception:  ");
                throw e;
            }
            return {};
        });
    };
    Workunit.prototype.WUAction = function (actionType) {
        var _this = this;
        return this.connection.WUAction({
            Wuids: [this.Wuid],
            WUActionType: actionType
        }).then(function (response) {
            return _this.refresh().then(function () {
                _this._monitor();
                return response;
            });
        });
    };
    Workunit.prototype.WUResubmit = function (clone, resetWorkflow) {
        var _this = this;
        return this.connection.WUResubmit({
            Wuids: [this.Wuid],
            CloneWorkunit: clone,
            ResetWorkflow: resetWorkflow
        }).then(function (response) {
            _this.clearState(_this.Wuid);
            return _this.refresh().then(function () {
                _this._monitor();
                return response;
            });
        });
    };
    Workunit.prototype.WUCDebug = function (command, opts) {
        if (opts === void 0) { opts = {}; }
        var optsStr = "";
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                optsStr += " " + key + "='" + opts[key] + "'";
            }
        }
        return this.connection.WUCDebug({
            Wuid: this.Wuid,
            Command: "<debug:" + command + " uid='" + this.Wuid + "'" + optsStr + "/>"
        }).then(function (response) {
            return response;
        });
    };
    Workunit.prototype.debug = function (command, opts) {
        if (!this.isDebugging()) {
            return Promise.resolve(null);
        }
        return this.WUCDebug(command, opts).then(function (response) {
            return response.children.filter(function (xmlNode) {
                return xmlNode.name === command;
            })[0];
        }).catch(function (_) {
            // console.log(e);
            return Promise.resolve(null);
        });
    };
    Workunit.prototype.debugStatus = function () {
        var _this = this;
        if (!this.isDebugging()) {
            return Promise.resolve({
                DebugState: { state: "unknown" }
            });
        }
        return this.debug("status").then(function (response) {
            response = response || new XMLNode("null");
            var debugState = __assign({}, _this.DebugState, response.attributes);
            _this.set({
                DebugState: debugState
            });
            return response;
        });
    };
    Workunit.prototype.debugContinue = function (mode) {
        if (mode === void 0) { mode = ""; }
        return this.debug("continue", {
            mode: mode
        });
    };
    Workunit.prototype.debugStep = function (mode) {
        return this.debug("step", {
            mode: mode
        });
    };
    Workunit.prototype.debugPause = function () {
        return this.debug("interrupt");
    };
    Workunit.prototype.debugQuit = function () {
        return this.debug("quit");
    };
    Workunit.prototype.debugDeleteAllBreakpoints = function () {
        return this.debug("delete", {
            idx: 0
        });
    };
    Workunit.prototype.debugBreakpointResponseParser = function (rootNode) {
        return rootNode.children.map(function (childNode) {
            if (childNode.name === "break") {
                return childNode.attributes;
            }
        });
    };
    Workunit.prototype.debugBreakpointAdd = function (id, mode, action) {
        var _this = this;
        return this.debug("breakpoint", {
            id: id,
            mode: mode,
            action: action
        }).then(function (rootNode) { return _this.debugBreakpointResponseParser(rootNode); });
    };
    Workunit.prototype.debugBreakpointList = function () {
        var _this = this;
        return this.debug("list").then(function (rootNode) {
            return _this.debugBreakpointResponseParser(rootNode);
        });
    };
    Workunit.prototype.debugGraph = function () {
        var _this = this;
        if (this._debugAllGraph && this.DebugState["_prevGraphSequenceNum"] === this.DebugState["graphSequenceNum"]) {
            return Promise.resolve(this._debugAllGraph);
        }
        return this.debug("graph", { name: "all" }).then(function (response) {
            _this.DebugState["_prevGraphSequenceNum"] = _this.DebugState["graphSequenceNum"];
            _this._debugAllGraph = createXGMMLGraph(_this.Wuid, response);
            return _this._debugAllGraph;
        });
    };
    Workunit.prototype.debugBreakpointValid = function (path) {
        return this.debugGraph().then(function (graph) {
            return graph.breakpointLocations(path);
        });
    };
    Workunit.prototype.debugPrint = function (edgeID, startRow, numRows) {
        if (startRow === void 0) { startRow = 0; }
        if (numRows === void 0) { numRows = 10; }
        return this.debug("print", {
            edgeID: edgeID,
            startRow: startRow,
            numRows: numRows
        }).then(function (response) {
            return response.children.map(function (rowNode) {
                var retVal = {};
                rowNode.children.forEach(function (cellNode) {
                    retVal[cellNode.name] = cellNode.content;
                });
                return retVal;
            });
        });
    };
    return Workunit;
}(StateObject));

var version = "0.0.1";

// Promise polyfill  ---
//  XHR polyfill  ---
initD3Request(request);

exports.version = version;
exports.JSONPTransport = JSONPTransport;
exports.XHRGetTransport = XHRGetTransport;
exports.XHRPostTransport = XHRPostTransport;
exports.setTransportFactory = setTransportFactory;
exports.WsWorkunits = Service;
exports.WsTopology = Service$1;
exports.WsSMC = Service$2;
exports.WsDFU = Service$3;
exports.Workunit = Workunit;
exports.Result = Result;
exports.SourceFile = SourceFile;
exports.Resource = Resource;
exports.Timer = Timer;
exports.XGMMLGraph = XGMMLGraph;
exports.GraphItem = GraphItem;
exports.espTime2Seconds = espTime2Seconds;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=comms-browser.js.map
