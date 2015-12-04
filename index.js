var https = require('https'),
    cors_proxy = require('cors-anywhere');


// Heroku defines the environment variable PORT, and requires the binding address to be 0.0.0.0
var host = process.env.PORT ? '0.0.0.0' : '127.0.0.1',
    port = process.env.PORT || 8080,
    proxyUrl = process.env.PROXY_URL || 'http://example.com:80',
    insecureSsl = process.env.INSECURE_SSL === 'true' || false,
    originBlacklist = process.env.ORIGIN_BLACKLIST || '',
    originWhitelist = process.env.ORIGIN_WHITELIST || '',
    requireHeader = process.env.REQUIRE_HEADERS || 'origin,x-requested-with',
    removeHeaders = process.env.REMOVE_HEADERS || 'cookie,cookie2';


// Parse options
var corsProxyOptions = {
  originBlacklist: originBlacklist.split(',').map((x) => x.trim()).filter(Boolean),
  originWhitelist: originWhitelist.split(',').map((x) => x.trim()).filter(Boolean),
  requireHeader: requireHeader.split(',').map((x) => x.trim()).filter(Boolean),
  removeHeaders: removeHeaders.split(',').map((x) => x.trim()).filter(Boolean),
  httpProxyOptions: {}
};

// Configure insecure SSL
if (insecureSsl && proxyUrl.startsWith('https')) {
  corsProxyOptions.httpProxyOptions.secure = false;
  corsProxyOptions.httpProxyOptions.agent = new https.Agent({
    ciphers: 'ALL',   // http://www.openssl.org/docs/manmaster/apps/ciphers.html#CIPHER_LIST_FORMAT
    rejectUnauthorized: false
  });
}

// Strip Heroku-specific headers
corsProxyOptions.removeHeaders.push('x-heroku-queue-wait-time',
                                    'x-heroku-queue-depth',
                                    'x-heroku-dynos-in-use',
                                    'x-request-start');


// Configure cors proxy
var server = cors_proxy.createServer(corsProxyOptions);

// Wrap requests to only proxy specific domain
var corsProxyRequestHandler = server._events.request;
server._events.request = function wrappedRequestHandler(req, res) {
  req.url = '/' + proxyUrl + req.url;
  corsProxyRequestHandler(req, res);
};

// Start server
server.listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
