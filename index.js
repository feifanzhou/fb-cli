'use strict';
var keypress = require('keypress'),
    inquirer = require('inquirer'),
    chalk = require('chalk'),
    spawn = require('child_process').spawn,
    Promise = require('es6-promise').Promise,
    open = require('open');

var fb;
// listen for the "keypress" event

var lastitem = null;
var text = false;
var httpRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;


/**
 * Gets the number of columns and rows in current terminal window
 */
function getTermSize(cb){
    var cols, lines;
    spawn('tput', ['cols']).stdout.on('data', function(data){
        cols = Number(data);
        if (cols && lines && cb)
            cb(cols, lines);
    });
    spawn('tput', ['lines']).stdout.on('data', function(data){
        lines = Number(data);
        if (cols && lines && cb)
            cb(cols, lines);
    });
}
var cols, lines;
getTermSize(function(c, l) {
  cols = c;
  lines = l;
});


/**
 * Binds character input. Called whenever a key is pressed.
 * @param  {[type]} ch  [description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
var manage_keys = function (ch, key) {
	// Were inputing text. Don't do anything else.
	if (text) return;

  
  if (key && key.name == 'space') {
	fb.nextNews()
		.then(print_newsfeed_item)
		.catch(console.error);
	return;
  }


  // Quit.
  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause();
    return;
  }

  // Help
  if (key && key.ctrl && key.name == 'h') {
    console.log('press \'esc\' for command mode');
    return;
  }

  // Command mode.
  if (key && key.ctrl && key.name == 'escape') {
    return;
  }

  // Comment.
  if (key && lastitem && key.name == 'c') {
    var askComment = [{
      type: 'input',
      name: 'comment',
      message: 'What do you want to comment?'
    }];
    var commentMessage;
    inquirer.prompt(askComment, function(answer) {
      commentMessage = answer.comment;
    });
    fb.comment(lastitem.id, commentMessage);
    return;
  }

  // Like.
  if (key && lastitem && key.name == 'l') {

    fb.like(lastitem.id);
    console.log('liked!');


    return;
  }

  // Open on the browser
  if (key && lastitem && key.name == 'o') {
    console.log('gotta open', lastitem.id ,'in browser');
    open(lastitem.link);
    return;
  }

  // Post
  if (key && key.name == 'p') {
  	process.stdin.setRawMode(false); text = true;

  	var question = {
  		type : 'input',
  		name : 'post',
  		message : 'Whats on your mind?'
  	};

  	inquirer.prompt([question], function( answers ) {
  		console.log('Posted', answers.post + '!');
      fb.post(answers.post);
  		
      text = false;
  		process.stdin.setRawMode(true);
  		process.stdin.resume();
  	});
    return;
  }

  console.log('got:keypress', key);
};

var inputMode = function (input) {
  if (input) {
    process.stdin.setRawMode(false); text = true;
  } else {
    process.stdin.setRawMode(true); text = false;
  }
}


/**
 * Prints a newsfeed item.
 * @param  {Newsfeeed item} news
 */
function print_newsfeed_item (news) {
  var separator = '';
  for (var i = 0; i < cols; i++) {
    separator += '-';
  }
	console.log(chalk.cyan(separator));
	//nice sugar
	

	//does this do anything???

	// if (news.type = 'link') {}
	// if (news.type = 'status') {}
	// if (news.type = 'photo') {}
	// if (news.type = 'video') {}

    // Save item in case user wants to interact with it.
	lastitem = news;


	console.log(chalk.bgCyan(chalk.black(news.from.name)) + ':\n');

	if (news.story) console.log(news.story + '\n');
	if (news.message){
		var msg = news.message;
		var matches = msg.match(httpRegex);
		if(matches){
			msg = msg.replace(matches[0],chalk.cyan(chalk.underline(matches[0])));
		}
		console.log(msg + '\n');
		
	} 
	// if (news.type === 'link') {
	// 	console.log(msg + '\n');
	// }


	// Build that likes message 
	var others_msg = '';
	if (news.likes) {
		others_msg = others_msg + news.likes.data.length + ' ';
		if (news.likes.paging.next) others_msg = others_msg + '+ ';
		others_msg = others_msg + 'likes.  ';
	}

	// Build that likes message 
	if (news.comments) {
		others_msg = others_msg + news.comments.data.length + ' ';
		if (news.comments.paging.next) others_msg = others_msg + '+ ';
		others_msg = others_msg + 'comments.';
	}

	// Post likes + comments.
	if (others_msg !== '') console.log(others_msg,'\n');


	// Build the action bar at the bottom.
	var action_bar = '';
	if (news.link)     action_bar = action_bar + '(o) open ' ;
  if (news.likes)    action_bar = action_bar + '(l) like ' ;
  if (news.comments) action_bar = action_bar + '(c) comment ';
                     action_bar = action_bar + '(p) post ';
	
  console.log(action_bar);
}



/**
 * Inits this madness.
 */
function init () {

    fb = require('./yoface.js');

    // Log first newsfeed thingy.
    fb.nextNews()
        .then(print_newsfeed_item)
        .catch(console.error);
    
    // Set up the key catching
    keypress(process.stdin);
    process.stdin.on('keypress', manage_keys);
    process.stdin.setRawMode(true);
    process.stdin.resume();


    // Yay!
    console.log('News Feed!');
    console.log('----------\n');
    console.log('loading...\n');

}



/**
 * Start this madness. This blasphemy. SPARTA! GKLADSJFLSKJFL
 * @return {Awesomeness} 2 pounds and a half of it.
 */
var dothismadness = function () {
  return new Promise(function (resolve, reject) {
    console.log('Falafel!');
    try {
      var authInfo = require('./authInfo');
      if (!authInfo.accessToken) {
        throw new Error();
      }
    } catch (e) {
      console.log('Looks like you have to login.');
      var hack = require('./server');
      return hack.showLogin().then(init).catch(reject);
    }

    resolve({});
  });
};

dothismadness()
    .then(init)
    .catch(console.trace);




