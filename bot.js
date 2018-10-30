var twit = require('twit');
var config = require('./config.js');
request = require('request').defaults({encoding: null});
var url = "http://api.wolframalpha.com/v1/simple?appid=GP4L2V-8GVPAQV2R5&i=What+airplanes+are+flying+overhead%3F";
var fs = require('fs');

var Twitter = new twit(config);
var b64image;
var lockedUsers = [];
var statusIDs = []

class User {
    constructor(userName, datetime) {
        this.name = userName;
        this.date = datetime;
    }
}

var retweet = function() {
    var params = {
        q: '#tellmeplease, #TellMePlease',
        result_type: 'recent',
        lang: 'en'
    }
    Twitter.get('search/tweets', params, function(err, data) {
        if (!err) {
            console.log(data.statuses);
            var retweetId = data.statuses[0].id_str;
    
            Twitter.post('statuses/retweet/:id', {
                id:retweetId
            }, function(err, response) {
                if (response) {
                    console.log('Retweeted!');
                }
                if (err) {
                    console.log('RETWEETING ERROR');
                }
            });
        }
        else {
            console.log('SEARCHING ERROR - RETWEET');
        }
    });
}
var replyURL = "www.google.com";
var replyTweet = function() {
    var params = {
        q: "#TellMePlease",
        result_type: "recent",
        lang: "en"
    }
    Twitter.get('search/tweets', params, function(err, data) {
        if(!err) {
            for (i = 0; i < lockedUsers.length; i++) {
                if (Math.abs(new Date() - lockedUsers[i].date > 30000)) {
                    lockedUsers.splice(i);
                }
            }
            
            var replyId = data.statuses[0].id_str;
            var name = data.statuses[0].user.screen_name;
            var status = data.statuses[0].text;
            var newUser = new User(name, new Date());
            var currentUser;
            status = status.replace("#TellMePlease", "");
            status = status.replace("#TellMePlease", "");
            status = status.replace("@_TellMePlease_", "");
            status = status.trim();
            statusCopy = status.split(" ");
            statusCopy = statusCopy.join("+");
            var url = "http://api.wolframalpha.com/v1/simple?appid=GP4L2V-8GVPAQV2R5&i=" + statusCopy + "%3F";
            var userTF = true;
            
            for (i = 0; i < lockedUsers.length; i++) {
                if (lockedUsers[i] == newUser){
                    userTF = false;
                    currentUser = lockedUser[i];
                    break;
                }
                else {
                    lockedUsers.push(newUser);
                    currentUser = newUser;
                    break;
                }
            }
            if (userTF == false) {
                url = "None";
            }
            console.log(url);

            request.get(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    data = new Buffer(body).toString('base64');

                    b64image = data;

                    fs.writeFileSync("./statusIDs.txt", "" + statusIDs, 'utf8');
                    //if (name != "WolframAnswers" && statusTF) {
                        Twitter.post('media/upload', {media_data: b64image}, function(err, data, response) {
                            statusTF = true;
                            if (!err) {
                                var mediaIdStr = data.media_id_string;
                                var altText = "Wolfram Alpha Answer";
                                var meta_params = {media_id: mediaIdStr, alt_text: {text: altText}};
                    
                                Twitter.post('media/metadata/create', meta_params, function (err, data, response) {
                                    statusTF = true;
                                            
                                    for (i = 0; i < statusIDs.length; i++) {
                                        if (replyId == statusIDs[i]) {
                                            statusTF = false;
                                        }
                                    }
                                    if (statusTF) {
                                        statusIDs.push(replyId);
                                    }
                                    console.log(statusTF);
                                    if (!err) {

                                    }
                                    if (!err && name != "WolframAnswers" && statusTF) {
                                        Twitter.post('statuses/update', {in_reply_to_status_id: replyId, status: "\"" + status + "\"" + ' @' + name, media_ids: [mediaIdStr]}, {
                                            id:replyId
                                        }, function(err, response) {

                                        });
                                    }
                                    else {
                                        console.log("META DATA ERROR");
                                    }
                                });
                            }
                            else{
                                console.log("MEDIA UPLOAD ERROR");
                                console.log(err);
                            }

                        });
                    //}
                }
                else if (url == "None") {
                    Twitter.post('statuses/update', {in_reply_to_status_id: replyId, status: "\"" + status + "\":" + " You are "+ ' @' + name}, {
                        id:replyId
                    }, function(err, response) {
                        if (response) {
                            console.log('Replied!');
                        }
                        if (err) {
                            console.log('REPLYING ERROR');
                        }
                    });
                }
                else {
                    Twitter.post('statuses/update', {in_reply_to_status_id: replyId, status: "\"" + status + "\":" + " Wolfram Answers was not able to find an answer to your question"+ ' @' + name}, {
                        id:replyId
                    }, function(err, response) {
                        if (response) {
                            console.log('Replied!');
                        }
                        if (err) {
                            console.log('REPLYING ERROR');
                        }
                    });
                }
            });
        }
        else {
            console.log('SEARCHING ERROR - REPLY');
			console.log(err);
        }
    });
}

function myLoop() {
    setTimeout(function () {
        replyTweet();
        //console.log("Worked");
        myLoop();
    }, 1000);
}
//replyTweet();
myLoop();