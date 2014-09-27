// Thanks to Cezary Wojtkowski
// http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
var fs = require('fs'),
    request = require('request');

module.exports.download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    if (err) console.trace(err);
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

module.exports.delete = function (path, callback) {
  fs.unlink(path, function (err) {
    callback(err);
  });
}