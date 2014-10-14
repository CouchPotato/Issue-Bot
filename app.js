var Poppins = require('mary-poppins').Poppins,
	config = require('./config');

var poppins = new Poppins(config.init);

// Load helpers
require('./helpers/checklist_issue')(poppins);
require('./helpers/checklist_pullrequest')(poppins);


poppins.start();
