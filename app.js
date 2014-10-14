var Poppins = require('mary-poppins').Poppins,
	xhub = require('express-x-hub'),
	config = require('./config');

var poppins = new Poppins(config.init);

// Load helpers
require('./helpers/checklist_issue')(poppins);
require('./helpers/checklist_pullrequest')(poppins);

// Force add secret check
if(config.init.hook.secret)
	poppins.server.stack.splice(2, 0, {
		'route': '',
		'handle': xhub({ algorithm: 'sha1', secret: config.init.hook.secret })
	});

poppins.start();
