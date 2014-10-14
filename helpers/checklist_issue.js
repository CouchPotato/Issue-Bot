var _ = require('lodash'),
	Q = require('q');

var poppins, issue_checklist;

module.exports = function initPlugin(pop){
	poppins = pop;

	issue_checklist = poppins.plugins.issue_checklist = _.defaults(poppins.plugins.issue_checklist || {}, {

		responseBody: responseBody,

		before: 'Thanks for the issue report! Before a real human comes by, please make sure your report has all the below criteria checked',
		after: 'Please make sure you also read [contribution guide](https://github.com/RuudBurger/CouchPotatoServer/blob/develop/contributing.md#issues) and followed all the steps. \n' +
			'Make the title describe your issue. Having "CP not working" or "I get this bug" for 100 issues, isn\'t really helpful. My master will close issues if there isn\'t enough information. On a good day he will tag the issue on close with the reason (like `can\'t reproduce`), but usually he won\'t, the lazy asshat.\n\n' +
			'Sometimes my master seems like a grumpy cat and responds with short answers. This isn\'t (always) because he hates you, but because he\'s on mobile or busy fixing bugs. If something isn\'t clear, please let him know. Maybe he can teach me his awesome ways.' +
			'\n\nThanks!',
		checks: [

			// Fill in the dots
			{
				message: 'Fill in all the dots. They\'re there for a reason',
				condition: function (data) {
					var body = data.issue.body.toLowerCase();

					var is_cp_log = 0;
					_.each(['information:', 'reproduce:', 'logs:'], function(check_for){
						is_cp_log += _.contains(body, check_for) ? 1 : 0;
					});

					var forgot_filled_in = _.contains(data.issue.body, ': ...');

					return is_cp_log && !forgot_filled_in;
				}
			},

			// Post logs
			{
				message: 'Post logs, either inline (for smaller logs) or using [Pastebin](http://pastebin.com/)',
				condition: function (data) {

					var inline_logs = isInlineLog(data.issue.body);

					var linked_logs = 0;
					_.each(['pastebin.com', 'gist.github.com'], function(check_for){
						linked_logs += _.contains(data.issue.body.toLowerCase(), check_for) ? 1 : 0;
					});

					return inline_logs || linked_logs;
				}
			},

			// Wrap inline logs inside ```
			{
				message: 'Please wrap inline logs inside ``` for readability',
				condition: function (data) {
					var inline_logs = isInlineLog(data.issue.body);

					if(inline_logs)
						return _.contains(data.issue.body, '```');
				}
			},

			// Enable debugging
			{
				message: 'Enabled debug logging in Settings > Advanced (restart CP, be sure to disable after the bug is fixed)',
				condition: function (data) {
					var inline_logs = isInlineLog(data.issue.body);
					if(inline_logs)
						return _.contains(data.issue.body, 'DEBUG [');
				}
			},

			// Version information missing
			{
				message: 'Post full version information',
				condition: function (data) {

					var has_version = _.contains(data.issue.body, 'Version of CouchPotato:'),
						is_desktop = false,
						correct_repo = false;

					// Make sure logs are from correct repo
					if(has_version){
						is_desktop = _.contains(data.issue.body, 'desktop:');
						correct_repo = _.contains(data.issue.body, 'RuudBurger:CouchPotatoServer');
					}

					return correct_repo || is_desktop;
				}
			}

		]

	});

	poppins.on('issueOpened', respondeToNewIssue);
};

function isInlineLog(data){
	var inline_logs = 0;
	_.each(['ERROR [', 'INFO [', 'DEBUG ['], function(check_for){
		inline_logs += _.contains(data, check_for) ? 1 : 0;
	});

	return inline_logs > 0;
}

function respondeToNewIssue(data){
	var number = data.issue.number;

	return issue_checklist.responseBody(data).
		then(function (body) {
			return poppins.createComment(number, body);
		});
}

function responseBody(data){
	return checklist(data).then(function (list) {
		return list ? Q.all([issue_checklist.before, list, issue_checklist.after]) : null
	}).
		then(function (paragraphs) {
			return paragraphs.join('\n\n');
		});
}

var EMPTY = '- [ ] ',
	NON_EMPTY = '- [x] ';

function checklist (data) {
	return Q.all(issue_checklist.checks.map(function (check) {
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
		"issue": {
			"number": 4,
			"body": "Since the update it hangs when I click home on 'Loading 'Snatched & Available'." +
				"Log file pasted below." +
				"### Steps to reproduce:" +
				"1. Restart Couchpotato" +
				"2. Go to home" +
				"" +
				"### Information:" +
				"Movie(s) I have this with: ..." +
				"Quality of the movie being searched: ..." +
				"Providers I use: ..." +
				"Version of CouchPotato: git:(RuudBurger:CouchPotatoServer master) b773f7b7 (2014-10-07 23:09:44)" +
				"Running on: ..." +
				"### Logs:" +
				"```" +
				"10-07 23:25:18 ERROR [          couchpotato.api] Log goes here```"
		},
		"sender": {
			"login": "CouchPotatoBot"
		}
	}

}
