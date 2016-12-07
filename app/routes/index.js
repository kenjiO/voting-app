'use strict';

var path = process.cwd();
var Poll = require('../models/Poll.js');

module.exports = function (app, passport) {

	function requireLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}
	
	function getLoggedInUser (req) {
		if (req.isAuthenticated()) {
			return req.user.github.username;
		} else {
			return undefined;
		}
	}
	
	app.route('/')
		.get(function (req, res, next) {
			Poll.find({}, 'name', function(err, polls) {
				if (err) {
					next(err);
					return;
				}
				res.render('index', {'user': getLoggedInUser(req), 'polls': polls});
			});
		});
		
	app.route('/newpoll')
		.get(requireLoggedIn, function(req, res, next) {
			res.render('newpoll', {'user': getLoggedInUser(req)});
		})
		.post(requireLoggedIn, function(req, res, next) {
			var name = req.body.name.trim();
			if (!req.body.answers)
				return res.end("No response options specified");
			if (name === "")
				return res.end("Name must not be blank");

			var answers = req.body.answers.split(',')
				.map(function(item){return item.trim()})
				.filter(function(item) {return item !== "";});
			if (answers.length < 2)
				return res.end("You must specify at least 2 response options");
				
			var results = Array.apply(null, new Array(answers.length)).map(Number.prototype.valueOf,0);
			Poll.create({'owner': getLoggedInUser(req), 'name': name, 'choices': answers, 'results': results}, function(err, poll) {
				if (err) {
					if (err.code === 11000)
						return res.end("That name exists already");
					else
						return next(err);
				}
				res.redirect('/mypolls');
			});
		});

	app.route('/mypolls')
		.get(requireLoggedIn, function (req, res, next) {
			Poll.find({'owner': getLoggedInUser(req)}, 'name', function(err, polls) {
				if (err) return next(err);
				res.render('mypolls', {'polls': polls, 'user': getLoggedInUser(req)});
			});
		})
	;
		
	app.route('/poll/:name')
		.get(function(req, res, next) {
			var pollname = req.params.name.trim();
			if (pollname === "") res.end("pollname is blank");

			Poll.findOne({'name': pollname}, 'name choices results', function(err, poll) {
				if (err) return next(err);
				if (!poll) return res.end("Poll " + pollname + " does not exist");
				var tweet = 'https://twitter.com/intent/tweet?text=' + 
					encodeURIComponent('Check out this poll at ' + 
						process.env.APP_URL + 
						"poll/" + 
						encodeURIComponent(pollname));
				res.render('poll', {'poll': poll, 'user': getLoggedInUser(req), 'twitterLink': tweet, 
				                    'labels': JSON.stringify(poll.choices),
				                    'results': JSON.stringify(poll.results)});
			}); // Poll.findOne()
		}) //get()
	;
	
	app.route('/poll/:name/:answer')
		.get(function(req, res, next) {
			var pollname = req.params.name.trim();
			var answer = req.params.answer;
			if (pollname === "") {
				res.end("pollname is blank");
				return;
			}
			Poll.findOne({'name': pollname}, 'name choices results', function(err, poll) {
				if (err) {
					next(err);
					return;
				}
				if (!poll) {
					res.end("Poll " + pollname + " does not exist");
					return;
				}
				
				var index = poll.choices.indexOf(answer);
				if (index < 0) return res.end("invalid answer");
				
				poll.results[index] = poll.results[index] + 1;
				
				Poll.findOneAndUpdate({'name': pollname}, poll, function(err, poll){
    				if (err) return next(err);
    				res.redirect("/poll/" + encodeURIComponent(poll.name));
				});
			}); //findOne()
		}) //get()			
	;	
	
	app.route('/edit/:name')
		.get(requireLoggedIn, function(req, res, next) {
			var pollname = req.params.name.trim();
			if (pollname === "") {
				res.end("pollname is blank");
				return;
			}
			Poll.findOne({'name': pollname}, 'owner name choices results', function(err, poll) {
				if (err) return next(err);
				if (!poll) return res.end("Poll " + pollname + " does not exist");
				if (poll.owner !== getLoggedInUser(req))
					return res.end("You don't own that poll and can only edit polls you own");
				res.render('editpoll', {'poll': poll, 'user': getLoggedInUser(req)});
			}); // Poll.findOne()
		}) //get()
		.post(requireLoggedIn, function(req, res, next) {
			var username = getLoggedInUser(req);
			var pollname = req.params.name;
			if (!req.body.answers)
				return res.end("No response options specified");
			var answers = req.body.answers.split(',')
				.map(function(item){return item.trim()})
				.filter(function(item) {return item !== "";});
			if (answers.length < 2) {
				res.end("You must specify at least 2 response options");
				return;
			}
			//create array of 0s with same length as answers
			var results = Array.apply(null, new Array(answers.length)).map(Number.prototype.valueOf,0);
			
			Poll.findOneAndUpdate({'name': pollname, 'owner': username}, {'choices': answers, 'results': results}, function(err, poll){
    				if (err) return next(err);
    				res.redirect("/poll/" + encodeURIComponent(poll.name));
			});
			
		}) //post()
	;
	
	app.route('/delete/:name')
		.post(requireLoggedIn, function(req, res, next) {
			Poll.remove({'name': req.params.name, 'owner': getLoggedInUser(req)}, function(err, poll) {
				if (err) return next(err);
				res.redirect('/mypolls');
			});
		})
	;
		
	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});

	app.route('/profile')
		.get(function (req, res) {
			if (req.isAuthenticated()) {
			 res.sendFile(path + '/public/profile.html');
			} else {
				res.redirect('/login');
			}
		});


	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));
};
