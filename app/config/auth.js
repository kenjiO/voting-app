'use strict';

module.exports = {
	'githubAuth': {
		'clientID': process.env.GITHUB_KEY,
		'clientSecret': process.env.GITHUB_SECRET,
		//'callbackURL': process.env.APP_URL + 'auth/github/callback'
		'callbackURL': 'https://voting-app-4267542.herokuapp.com/' + 'auth/github/callback'
	}
};
