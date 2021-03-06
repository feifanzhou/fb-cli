#!/usr/bin/env node

'use strict';
// Just some global vars
var fb,
    inquirer = require('inquirer'),
    Promise = require('es6-promise').Promise,
    open = require('open'),
    printer = require('./printer'),
    keypress = require('keypress');

var lastitem = null;
var text = false;
var allowedActions = [];

///////////////////////////////// User Actions /////////////////////////////////

/**
 * Binds character input. Called whenever a key is pressed.
 */
var manage_keys = function (ch, key) {
  // Were inputting text, so don't do anything else.
  if (text) return;

  // Next news feed item.
  if (key && key.name == 'space') { action_next(); return; }

  // Quit.
  if (key && key.ctrl && key.name == 'c') { action_close(); return; }

  // Like.
  if (key && lastitem && key.name == 'l') { action_like(); return; }

  // Comment.
  if (key && lastitem && key.name == 'c' && allowedActions.indexOf('c') != -1) { mode_comment(); return; }
  
  // Open in the browser
  if (key && lastitem && key.name == 'o' && allowedActions.indexOf('o') != -1) { open(lastitem.link); return; }

  // Post.
  if (key && key.name == 'p') { mode_post(); return; }

  // Help.
  if (key && key.name == 'h') { printer.shelp(); return; }

  // Command mode.
  if (key && key.name == 'escape') { mode_command(); return; }
};

var manage_commands = function (cmd) {
  
  if (cmd === 'top')      { action_top();     return; }
  if (cmd === 'help')     { printer.chelp();  return; }
  if (cmd === 'post')     { mode_post();      return; }
  if (cmd === 'like')     { mode_post();      return; }
  if (cmd === 'comment')  { mode_comment();   return; }
  if (cmd === 'quit')     { action_close();   return; }
  if (cmd === 'next')     { action_next();    return; }

  console.log('No command `' + cmd + '`.');
};

/////////////////////////////////// Actions. ///////////////////////////////////

/**
 * Go back to the top of the newsfeed.
 */
var action_top = function () {
  // Empty news cache
  fb.cache.news = [];
  fb.cache.news_next = null;
  printer.clear();

  // Print next news item
  fb.nextNews()
    .then(function(news) {
      printer.print_newsfeed_item(news);
      allowedActions = news.allowedActions;
    })
    .catch(console.error);
};

/**
 * Likes the last displayed post.
 * @return {[type]} [description]
 */
var action_like = function () {
  fb.like(lastitem.id, function() {
    console.log('Liked!');
  });
};

/**
 * Output nyan cat and exit :)
 */
var action_close = function () {
  printer.horizontalRule();
  printer.nyan();
  process.stdin.pause();
};

/**
 * Displays next newsfeed item.
 * @return {[type]} [description]
 */
var action_next = function () {
  fb.nextNews()
    // Save for user interaction
    .then(function (news) {
      lastitem = news;
      allowedActions = lastitem.allowedActions;
      return lastitem;
    })
    // Print
    .then(printer.print_newsfeed_item)
    .catch(console.error);
};

//////////////////////////////////// Modes. ////////////////////////////////////


/**
 * Asks user for comment, and posts it.
 * @return {[type]} [description]
 */
var mode_comment = function () {
  textmode(true);

  var askComment = [{
    type: 'input',
    name: 'comment',
    message: 'What do you want to say?'
  }];
  inquirer.prompt(askComment, function(answer) {
    if (answer.comment !== '') {
      fb.comment(lastitem.id, answer.comment, function() {
        console.log('Posted comment!');
      });
    }
    textmode(false);
  });
};


/**
 * Asks user for status update, and posts it.
 * @return {[type]} [description]
 */
var mode_post = function () {
  textmode(true);

  var question = [{
    type : 'input',
    name : 'post',
    message : 'What\'s on your mind?'
  }];

  inquirer.prompt(question, function(answers) {
    fb.post(answers.post, function() {
      console.log('Posted: ', answers.post);
    });
    textmode(false);
  });
};

/**
 * Asks user for commands, and executes them.
 * @return {[type]} [description]
 */
var mode_command = function () {
  textmode(true);

  var q = [{ name: 'cmd', message: ':' }];
  inquirer.prompt(q, function(a) {
    manage_commands(a.cmd);
    textmode(false);
  });
};


/**
 * Enables textmode, so we can input strings of characters.
 * @param  [bool] tm - Enter (1) or exit (0) textmode
 */
var textmode = function (tm) {
  if (tm) {
    process.stdin.setRawMode(false);
    text = true;
  } else {
    process.stdin.setRawMode(true);
    text = false;
    process.stdin.resume();
  }
};

////////////////////////////// Commandline tools. //////////////////////////////

var program = require('commander');
var falafel = require('./package.json')
program
  .version(falafel.version)
  .option('-p, --post <status>', 'Post a status update')

  // Append some extra stuff to help.
  .on('--help', function(){
    console.log('Calling with no arguments starts interactive newsfeed.\n');
  })

  .parse(process.argv);


///////////////////////////////////// Init /////////////////////////////////////

var YoFace = require('./yoface');
var loginstuff = require('./login');

/**
 * Inits the whole system
 */
function initInteractive(FB) {
  printer.clear();
  printer.print_falafel();

  fb = new YoFace(FB);

  printer.newsfeed_title();

  // Log first newsfeed thingy
  fb.nextNews()
      // Save for user interaction
      .then(function (news) {
        lastitem = news;
        return lastitem;
      })
      // Print
      .then(function(news) {
        printer.print_newsfeed_item(news);
        allowedActions = news.allowedActions;
      })
      .catch(console.error);
  
  // Start catching keypresses
  keypress(process.stdin);
  process.stdin.on('keypress', manage_keys);
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

/////////////////////////////////// Startup. ///////////////////////////////////

// Post straight up.
if (program.post) {
  loginstuff
    .login()
    .then(function (FB) {
      fb = new YoFace(FB);
      fb.post(program.post, function () {
          console.log('Posted.');
        });
    });
}

/**
 * Checks if the user has to login first, then inits.
 * Or as Kevin says:
 *   Start this madness. This blasphemy. SPARTA! GKLADSJFLSKJFL
 * @return {Awesomeness} 2 and a half pounds of it...or at least a promise ;)
 */
else {
  loginstuff
    .login()
    .then(initInteractive)
    .catch(console.trace);
}

