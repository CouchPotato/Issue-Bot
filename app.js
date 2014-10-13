var Poppins = require('mary-poppins').Poppins;

var poppins = new Poppins({
	target: {
		user: 'CouchPotatoBot',
		repo: 'ResponderTest'
	},

	login: {
		username: '',
		password: 'x-oauth-basic'
	},

	// port for poppins to listen on and URL for Github to ping
	hook: {
		url: 'http://xx:1234',
		port: 1234
	}
});

poppins.couldYouPlease('poppins-pr-checklist');

// pr checklist
poppins.plugins.prChecklist.greeting = 'Hello';
poppins.plugins.prChecklist.checks = [
	{
		message: 'Foo',
		condition: function (data) {
			console.log(data);
			return false;
		}
	}
];
poppins.plugins.prChecklist.closing = 'Farewell';

poppins.start();
