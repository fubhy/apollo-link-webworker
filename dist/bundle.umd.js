(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('graphql'), require('apollo-link'), require('subscriptions-transport-ws'), require('promise-worker'), require('iterall')) :
	typeof define === 'function' && define.amd ? define(['exports', 'graphql', 'apollo-link', 'subscriptions-transport-ws', 'promise-worker', 'iterall'], factory) :
	(factory((global.webWorkerLink = {}),global.graphql,global.apolloLink,global.subscriptionsTransportWs,global.PromiseWorker,global.iterall));
}(this, (function (exports,graphql,apolloLink,subscriptionsTransportWs,PromiseWorker,iterall) { 'use strict';

PromiseWorker = PromiseWorker && PromiseWorker.hasOwnProperty('default') ? PromiseWorker['default'] : PromiseWorker;

var GQL_START = 'start';
var GQL_STOP = 'stop';
var GQL_DATA = 'data';
var GQL_ERROR = 'error';
var GQL_COMPLETE = 'complete';

var MessageTypes = Object.freeze({
	GQL_START: GQL_START,
	GQL_STOP: GQL_STOP,
	GQL_DATA: GQL_DATA,
	GQL_ERROR: GQL_ERROR,
	GQL_COMPLETE: GQL_COMPLETE
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var PromiseWorkerLink = function (_ApolloLink) {
  inherits(PromiseWorkerLink, _ApolloLink);

  function PromiseWorkerLink(_ref) {
    var worker = _ref.worker;
    classCallCheck(this, PromiseWorkerLink);

    var _this = possibleConstructorReturn(this, (PromiseWorkerLink.__proto__ || Object.getPrototypeOf(PromiseWorkerLink)).call(this));

    _this.promiseWorker = null;

    _this.promiseWorker = new PromiseWorker(worker);
    return _this;
  }

  createClass(PromiseWorkerLink, [{
    key: 'request',
    value: function request(operation) {
      var _this2 = this;

      return new apolloLink.Observable(function (observer) {
        _this2.promiseWorker.postMessage(operation).then(function (data) {
          observer.next(data);
          observer.complete();
        }).catch(observer.error.bind(observer));
      });
    }
  }]);
  return PromiseWorkerLink;
}(apolloLink.ApolloLink);

var createWorkerInterface = function createWorkerInterface(_ref2) {
  var worker = _ref2.worker;

  var WorkerInterface = function () {
    function WorkerInterface(url, protocol) {
      classCallCheck(this, WorkerInterface);

      this.url = url;
      this.protocol = protocol;
      this.readyState = WorkerInterface.OPEN; // webworker is always opened
    }

    createClass(WorkerInterface, [{
      key: 'close',
      value: function close() {
        console.log('closing noop');
      }
    }, {
      key: 'send',
      value: function send(serializedMessage) {
        worker.postMessage(serializedMessage);
      }
    }, {
      key: 'onerror',
      set: function set$$1(fn) {
        worker.onerror = fn;
      }
    }, {
      key: 'onmessage',
      set: function set$$1(fn) {
        worker.onmessage = function (_ref3) {
          var data = _ref3.data;

          var d = JSON.parse(data);
          if (Object.keys(MessageTypes).map(function (k) {
            return MessageTypes[k];
          }).indexOf(d.type) !== -1) {
            fn({ data: data });
          }
        };
      }
    }]);
    return WorkerInterface;
  }();

  WorkerInterface.CLOSED = 'CLOSED';
  WorkerInterface.OPEN = 'OPEN';
  WorkerInterface.CONNECTING = 'CONNECTING';

  return WorkerInterface;
};

var SubscriptionWorkerLink = function (_ApolloLink2) {
  inherits(SubscriptionWorkerLink, _ApolloLink2);

  function SubscriptionWorkerLink(_ref4) {
    var worker = _ref4.worker;
    classCallCheck(this, SubscriptionWorkerLink);

    var _this3 = possibleConstructorReturn(this, (SubscriptionWorkerLink.__proto__ || Object.getPrototypeOf(SubscriptionWorkerLink)).call(this));

    _this3.worker = null;
    _this3.subscriptionClient = null;

    _this3.worker = worker;
    _this3.subscriptionClient = new subscriptionsTransportWs.SubscriptionClient(null, {}, createWorkerInterface({ worker: worker }));
    return _this3;
  }

  createClass(SubscriptionWorkerLink, [{
    key: 'request',
    value: function request(operation) {
      return this.subscriptionClient.request(operation);
    }
  }]);
  return SubscriptionWorkerLink;
}(apolloLink.ApolloLink);

var isASubscriptionOperation = function isASubscriptionOperation(document, operationName) {
  var operationAST = graphql.getOperationAST(document, operationName);

  return !!operationAST && operationAST.operation === 'subscription';
};

var createWebWorkerLink = function createWebWorkerLink(_ref5) {
  var worker = _ref5.worker;

  var subscriptionWorkerLink = new SubscriptionWorkerLink({ worker: worker });
  var promiseWorkerLink = new PromiseWorkerLink({ worker: worker });
  var link = apolloLink.ApolloLink.split(function (operation) {
    var document = graphql.parse(operation.query);
    return isASubscriptionOperation(document, operation.operationName);
  }, subscriptionWorkerLink, promiseWorkerLink);
  link.__subscriptionWorkerLink = subscriptionWorkerLink;
  link.__promiseWorkerLink = promiseWorkerLink;
  return link;
};

var _this = undefined;

var registerPromiseWorker = require('promise-worker/register');

var createEmptyIterable = function createEmptyIterable() {
  return defineProperty({
    next: function next() {
      return Promise.resolve({ value: undefined, done: true });
    },
    return: function _return() {
      return Promise.resolve({ value: undefined, done: true });
    },
    throw: function _throw(e) {
      return Promise.reject(e);
    }
  }, iterall.$$asyncIterator, function () {
    return _this;
  });
};

var createIterableFromPromise = function createIterableFromPromise(promise) {
  var isResolved = false;

  return promise.then(function (value) {
    if (iterall.isAsyncIterable(value)) {
      return value;
    }

    return defineProperty({
      next: function next() {
        if (!isResolved) {
          isResolved = true;
          return Promise.resolve({ value: value, done: false });
        }
        return Promise.resolve({ value: undefined, done: true });
      },
      return: function _return() {
        isResolved = true;
        return Promise.resolve({ value: undefined, done: true });
      },
      throw: function _throw(e) {
        isResolved = true;
        return Promise.reject(e);
      }
    }, iterall.$$asyncIterator, function () {
      return _this;
    });
  });
};

var createWorker = function createWorker(_ref3) {
  var schema = _ref3.schema,
      context = _ref3.context,
      _ref3$beforeRequest = _ref3.beforeRequest,
      beforeRequest = _ref3$beforeRequest === undefined ? function () {
    return Promise.resolve();
  } : _ref3$beforeRequest;
  return registerPromiseWorker(function (request) {
    if (request) {
      return beforeRequest(request).then(function () {
        return graphql.execute(schema, request.query, {}, Object.assign({}, request.context || {}, context), request.variables, request.operationName);
      });
    }
    return Promise.resolve();
  });
};

var _onMessage = void 0;

var getOnMessage = function getOnMessage(_ref4) {
  var schema = _ref4.schema,
      context = _ref4.context;

  if (_onMessage) return _onMessage;

  var sendMessage = function sendMessage(opId, type, payload) {
    var message = {
      type: type,
      id: opId,
      payload: payload
    };
    self.postMessage(JSON.stringify(message));
  };

  var sendError = function sendError(opId, errorPayload, overrideDefaultErrorType) {
    sendMessage(opId, GQL_ERROR, errorPayload);
  };

  var connectionContext = {
    isLegacy: false,
    operations: {}
  };

  var unsubscribe = function unsubscribe(opId) {
    if (connectionContext.operations && connectionContext.operations[opId]) {
      if (connectionContext.operations[opId].return) {
        connectionContext.operations[opId].return();
      }

      delete connectionContext.operations[opId];
    }
  };

  _onMessage = function _onMessage(workerMessage) {
    var message = JSON.parse(workerMessage.data);
    var opId = message.id;
    if (typeof opId !== 'undefined') {
      switch (message.type) {
        case GQL_STOP:
          unsubscribe(opId);
          break;

        case GQL_START:
          unsubscribe(opId);

          var baseParams = {
            query: message.payload.query,
            variables: message.payload.variables,
            operationName: message.payload.operationName,
            context: context,
            formatResponse: undefined,
            formatError: undefined,
            callback: undefined
          };
          var promisedParams = Promise.resolve(baseParams);

          // set an initial mock subscription to only registering opId
          connectionContext.operations[opId] = createEmptyIterable();

          promisedParams.then(function (params) {
            if ((typeof params === 'undefined' ? 'undefined' : _typeof(params)) !== 'object') {
              var error = 'Invalid params returned from onOperation! return values must be an object!';
              throw new Error(error);
            }
            var document = typeof baseParams.query !== 'string' ? baseParams.query : graphql.parse(baseParams.query);
            var executionIterable = void 0;
            var validationErrors = graphql.validate(schema, document, graphql.specifiedRules);
            if (validationErrors.length > 0) {
              executionIterable = Promise.resolve(createIterableFromPromise(Promise.resolve({ errors: validationErrors })));
            } else {
              var executor = graphql.subscribe;
              var promiseOrIterable = executor(schema, document, {}, params.context, params.variables, params.operationName);

              if (!iterall.isAsyncIterable(promiseOrIterable) && promiseOrIterable instanceof Promise) {
                executionIterable = promiseOrIterable;
              } else if (iterall.isAsyncIterable(promiseOrIterable)) {
                executionIterable = Promise.resolve(promiseOrIterable);
              } else {
                throw new Error('Invalid `execute` return type! Only Promise or AsyncIterable are valid values!');
              }
            }

            return executionIterable.then(function (ei) {
              return {
                executionIterable: iterall.isAsyncIterable(ei) ? ei : iterall.createAsyncIterator([ei]),
                params: params
              };
            });
          }).then(function (_ref5) {
            var executionIterable = _ref5.executionIterable,
                params = _ref5.params;

            iterall.forAwaitEach(iterall.createAsyncIterator(executionIterable), function (value) {
              var result = value;
              if (params.formatResponse) {
                try {
                  result = params.formatResponse(value, params);
                } catch (err) {
                  console.error('Error in formatError function:', err);
                }
              }
              sendMessage(opId, GQL_DATA, result);
            }).then(function () {
              sendMessage(opId, GQL_COMPLETE, null);
            }).catch(function (e) {
              var error = e;

              if (params.formatError) {
                try {
                  error = params.formatError(e, params);
                } catch (err) {
                  console.error('Error in formatError function: ', err);
                }
              }

              // plain Error object cannot be JSON stringified.
              if (Object.keys(e).length === 0) {
                error = { name: e.name, message: e.message };
              }

              sendError(opId, error);
            });

            return executionIterable;
          }).then(function (subscription) {
            connectionContext.operations[opId] = subscription;
          }).catch(function (e) {
            if (e.errors) {
              sendMessage(opId, GQL_DATA, { errors: e.errors });
            } else {
              sendError(opId, { message: e.message });
            }
            unsubscribe(opId);
            return;
          });
          break;

        default:
          sendError(opId, { message: 'Invalid message type!' });
      }
    }
  };

  return _onMessage;
};

var handleSubscriptions = function handleSubscriptions(_ref6) {
  var self = _ref6.self,
      message = _ref6.message,
      schema = _ref6.schema,
      context = _ref6.context;
  return getOnMessage({ schema: schema, context: context })(message);
};

exports.PromiseWorkerLink = PromiseWorkerLink;
exports.createWorkerInterface = createWorkerInterface;
exports.SubscriptionWorkerLink = SubscriptionWorkerLink;
exports.isASubscriptionOperation = isASubscriptionOperation;
exports.createWebWorkerLink = createWebWorkerLink;
exports.createWorker = createWorker;
exports.handleSubscriptions = handleSubscriptions;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bundle.umd.js.map
