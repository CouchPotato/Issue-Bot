module.exports = {

	getNumber: function(data){
		return data.pull_request.number;
	},
	before: 'Thanks for the pull request! Before a real human comes by, please make sure your report has all the below criteria checked',
	after: 'Please make sure you also read [contribution guide](https://github.com/CouchPotato/CouchPotatoServer/blob/develop/contributing.md#pull-requests) and followed all the steps.' +
		'\n\nThanks!',
	checks: [

		// Fill in the dots
		{
			message: 'Give a description on what the PR is for.',
			condition: function (data) {
				return data.pull_request.body.length > 20;
			}
		},

		// Send a PR to the develop branch
		{
			message: 'Make sure you send a PR against the DEVELOP branch',
			condition: function (data) {
				return data.pull_request.base.ref == 'develop';
			}
		},

		// Split up big commits
		{
			message: 'Don\'t send big changes in one go. Split up big PRs into multiple smaller (easier manageble) PRs',
			condition: function (data) {
				if(data.pull_request.commits > 10)
					return data.pull_request.commits < 20;
			}
		}


	]

}