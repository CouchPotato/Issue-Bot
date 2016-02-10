var express = require('express'),
    compress = require('compression'),
    bodyParser = require('body-parser'),

	// HTTP server
	http = require('http'),

	xhub = require('express-x-hub'),

    redis = require('redis'),

	app = express(),
	server = http.createServer(app),

	GitHubApi = require("github"),
	EventEmitter = require('events').EventEmitter;

global.winston = require('winston');
global.config = config = require(__dirname + '/config');
global.pubsub = new EventEmitter();
global.github = new GitHubApi({
	// required
	version: '3.0.0',
	// optional
	timeout: 5000,
	headers: {
		"user-agent": 'CouchPotatoBot'
	}
});
github.authenticate({
	type: 'token',
	token: config.token
});

// Development only
if(app.get('env') != 'development') {
	winston.add(winston.transports.File, { filename: __dirname + '/logs/main.log'});
	winston.remove(winston.transports.Console);
}

// all environments
app.set('port', config.port || 1234);
app.use(compress());

// Add xhub check
if(config.secret){
	app.use(xhub({ algorithm: 'sha1', secret: config.secret }));

	// Check if xhub is set
	app.use(function(req, res, next){
		if(req.isXHub && req.isXHubValid()){
			next();
			return;
		}
		res.status(401).send('Your shoe\'s untied');
	});
}

app.use(bodyParser.urlencoded({'extended': true}))
app.use(bodyParser.json({'limit': '50mb'}));

app.post('/', function(req, res, next){

	var hook = req.get('X-Github-Event'),
		events_name = hook + '_' + req.body.action;

	winston.info('Triggering event: ' + events_name);
	pubsub.emit(events_name, req.body);

	res.status(202).send('Thanks!');
});

app.get('/', function(req, res, next){
	res.status(401).send('Your shoe\'s untied');
});

// Start server
httpServer = server.listen(app.get('port'), function() {
	winston.info('Express server listening on port ' + app.get('port'));
});

// Load helpers
require('./helpers/checklist')({
	'issue_opened': require(__dirname + '/configs/issue'),
	'pull_request_opened': require(__dirname + '/configs/pullrequest')
});
