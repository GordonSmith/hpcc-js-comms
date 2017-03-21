'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var xmldom = require('xmldom');
var nodeRequest = require('request');
var tslib_1 = require('tslib');

var root = new Function("try {return global;}catch(e){return window;}")();

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
        this._opts = tslib_1.__assign({}, this._opts, _);
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
function initNodeRequest(request) {
    _nodeRequest = request;
}
var _d3Request = null;

var XHRTransport = (function (_super) {
    tslib_1.__extends(XHRTransport, _super);
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
    tslib_1.__extends(XHRGetTransport, _super);
    function XHRGetTransport(baseUrl, userID, password, rejectUnauthorized) {
        if (userID === void 0) { userID = ""; }
        if (password === void 0) { password = ""; }
        if (rejectUnauthorized === void 0) { rejectUnauthorized = true; }
        return _super.call(this, baseUrl, "GET", userID, password, rejectUnauthorized) || this;
    }
    return XHRGetTransport;
}(XHRTransport));
var XHRPostTransport = (function (_super) {
    tslib_1.__extends(XHRPostTransport, _super);
    function XHRPostTransport(baseUrl, userID, password, rejectUnauthorized) {
        if (userID === void 0) { userID = ""; }
        if (password === void 0) { password = ""; }
        if (rejectUnauthorized === void 0) { rejectUnauthorized = true; }
        return _super.call(this, baseUrl, "POST", userID, password, rejectUnauthorized) || this;
    }
    return XHRPostTransport;
}(XHRTransport));

var JSONPTransport = (function (_super) {
    tslib_1.__extends(JSONPTransport, _super);
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
    tslib_1.__extends(XSDXMLNode, _super);
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
    tslib_1.__extends(XSDSimpleType, _super);
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
    tslib_1.__extends(XSDParser, _super);
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
    tslib_1.__extends(ESPExceptions, _super);
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
    tslib_1.__extends(ESPTransport, _super);
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
        var request = tslib_1.__assign({}, _request, { ver_: this._version });
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
        var request = tslib_1.__assign({ Wuid: "", TruncateEclTo64k: true, IncludeExceptions: false, IncludeGraphs: false, IncludeSourceFiles: false, IncludeResults: false, IncludeResultsViewNames: false, IncludeVariables: false, IncludeTimers: false, IncludeDebugValues: false, IncludeApplicationValues: false, IncludeWorkflows: false, IncludeXmlSchemas: false, IncludeResourceURLs: false, SuppressResultSchemas: true }, _request);
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
        return hashSum(tslib_1.__assign({}, args));
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
    tslib_1.__extends(Graph, _super);
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
        _this.set(tslib_1.__assign({ Wuid: wuid, Time: duration }, eclGraph));
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
    tslib_1.__extends(GraphCache, _super);
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
    tslib_1.__extends(Subgraph, _super);
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
    tslib_1.__extends(Vertex, _super);
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
    tslib_1.__extends(XGMMLGraph, _super);
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
    tslib_1.__extends(Edge, _super);
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
    tslib_1.__extends(Resource, _super);
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
    tslib_1.__extends(Result, _super);
    function Result(connection, wuid, eclResult, resultViews) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        _this.set(tslib_1.__assign({ Wuid: wuid, ResultViews: resultViews }, eclResult));
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
    tslib_1.__extends(ResultCache, _super);
    function ResultCache() {
        return _super.call(this, function (obj) {
            return Cache.hash([obj.Sequence, obj.Name, obj.FileName]);
        }) || this;
    }
    return ResultCache;
}(Cache));

var SourceFile = (function (_super) {
    tslib_1.__extends(SourceFile, _super);
    function SourceFile(connection, wuid, eclSourceFile) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        _this.set(tslib_1.__assign({ Wuid: wuid }, eclSourceFile));
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
    tslib_1.__extends(Timer, _super);
    function Timer(connection, wuid, eclTimer) {
        var _this = _super.call(this) || this;
        if (connection instanceof Service) {
            _this.connection = connection;
        }
        else {
            _this.connection = new Service(connection);
        }
        var secs = espTime2Seconds(eclTimer.Value);
        _this.set(tslib_1.__assign({ Wuid: wuid, Seconds: Math.round(secs * 1000) / 1000, HasSubGraphId: eclTimer.SubGraphId !== undefined, XXX: true }, eclTimer));
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
    tslib_1.__extends(WorkunitCache, _super);
    function WorkunitCache() {
        return _super.call(this, function (obj) {
            return obj.Wuid;
        }) || this;
    }
    return WorkunitCache;
}(Cache));
var _workunits = new WorkunitCache();
var Workunit = (function (_super) {
    tslib_1.__extends(Workunit, _super);
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
        return this.connection.WUUpdate(tslib_1.__assign({}, request, {
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
        return this.connection.WUQuery(tslib_1.__assign({}, _request, { Wuid: this.Wuid })).then(function (response) {
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
        return this.connection.WUInfo(tslib_1.__assign({}, _request, { Wuid: this.Wuid, IncludeResults: includeResults, IncludeResultsViewNames: includeResults, SuppressResultSchemas: false })).then(function (response) {
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
            var debugState = tslib_1.__assign({}, _this.DebugState, response.attributes);
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

var commsMsg = "Hello and Welcome no xmldom";

// DOM Parser polyfill  ---
root.DOMParser = xmldom.DOMParser;
//  XHR polyfill  ---
initNodeRequest(nodeRequest);

exports.commsMsg = commsMsg;
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
//# sourceMappingURL=comms.js.map
