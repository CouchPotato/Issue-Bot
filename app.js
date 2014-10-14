var Poppins = require('mary-poppins').Poppins,
	xhub = require('express-x-hub'),
	config = require('./config');

var poppins = new Poppins(config.init);

// Load helpers
require('./helpers/checklist')(poppins, {
	'issueOpened': require('./configs/issue'),
	'pullRequestOpened': require('./configs/pullrequest')
});

// Force add secret check
if(config.init.hook.secret){

	// Add xhub check
	poppins.server.stack.splice(2, 0, {
		'route': '',
		'handle': xhub({ algorithm: 'sha1', secret: config.init.hook.secret })
	});

	// Check if xhub is set
	poppins.server.stack.splice(3, 0, {
		'route': '',
		'handle': function(req, res, next){
			if(req.isXHub && req.isXHubValid()){
				next();
				return;
			}
			res.send(401);
		}
	});
}

poppins.start();
