var _ = require('lodash'),
	Q = require('q');

var poppins, pr_checklist;

module.exports = function initPlugin(pop){
	poppins = pop;

	pr_checklist = poppins.plugins.pr_checklist = _.defaults(poppins.plugins.pr_checklist || {}, {

		before: 'Thanks for the pull request! Before a real human comes by, please make sure your report has all the below criteria checked',
		after: 'Please make sure you also read [contribution guide](https://github.com/RuudBurger/CouchPotatoServer/blob/develop/contributing.md#pull-requests) and followed all the steps.' +
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
					return data.pull_request.head.ref == 'develop';
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

	});

	poppins.on('pullRequestOpened', respondeToPullRequest);

	respondeToPullRequest(getTestData());
};


function respondeToPullRequest(data){
	var number = data.pull_request.number;

	return responseBody(data).
		then(function (body) {
			console.log(body);
			return;
			return poppins.createComment(number, body);
		});
}

function responseBody(data){
	return checklist(data).then(function (list) {
		return list ? Q.all([pr_checklist.before, list, pr_checklist.after]) : null
	}).
		then(function (paragraphs) {
			return paragraphs.join('\n\n');
		});
}

var EMPTY = '- [ ] ',
	NON_EMPTY = '- [x] ';

function checklist (data) {
	return Q.all(pr_checklist.checks.map(function (check) {
		return Q(check.condition(data)).then(function (condition) {
			if(condition !== undefined)
				return (!condition ? EMPTY : NON_EMPTY) + check.message;
		});
	})).
		then(function (lines) {
			return lines.filter(removeEmpty).join('\n');
		});
}

function removeEmpty(x) {
	return x;
}

function getTestData(){
	return {
		"action": "opened",
		"number": 6,
		"pull_request": {
			"number": 6,
			"title": "Update README.md",
			"body": "",
			"head": {
				"ref": "develop"
			},
			"commits": 10,
			"additions": 2,
			"deletions": 0,
			"changed_files": 1
		},
		"repository": {
			"default_branch": "master"
		},
		"sender": {
			"login": "CouchPotatoBot",
		}
	}

}
