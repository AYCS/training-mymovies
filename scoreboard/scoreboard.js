var app = require('express')();
var http = require('http').Server(app);
var hbs = require('hbs');
var serveStatic = require('serve-static');

var childProcess = require("child_process");
var utils = require("./lib/utils");
var fs = require("fs");

// Team object
var Team = function(name, ip)
{
    var that = {};
    that.name = name;
    that.ip = ip;
    that.homepageResult = 0;
    that.searchResult = 0;
    that.movieResult = 0;
    
    return that;
};

// Load the JSON file and add the teams to our array for processing
teams = Array();
var tmpteams = JSON.parse(fs.readFileSync("teams.json"));
for (var k in tmpteams) {
  teams.push(new Team(k, tmpteams[k]));
}

// Enter here
var init = function() {
    
    console.log("scoreboard.js: initialization starting");
    
    // Create the background process
    this._rchild = childProcess.fork("./lib/retrieve");
    
    // Listen for messages sent from background process
    this._rchild.on('message', function(data) {
        console.log("scoreboard.js: recv'd team " + data.name + " data from background process.");
        
        var teamNum = (parseInt(data.name) - 1);
        this.teams[teamNum].homepageResult = data.homepageResult;
        this.teams[teamNum].searchResult = data.searchResult;
        this.teams[teamNum].movieResult = data.movieResult;
        
    }.bind(this));
    
    // Send the teams array to the background process
    this._rchild.send(teams);
}()

// Our view engine should look for .html files
// inside the ./views directory
app.set('view engine', 'html');
app.set('views', './views')

// Tell express's engine to use Handlebar
// to render templates
app.engine('html', require('hbs').__express);

// This template helper calls utility function
hbs.registerHelper('prettyTime', function(t) {
	return utils.pretty_time(t);
});

// This template helper prints a nice progress bar
hbs.registerHelper('printBar', function(time, goal) {
	
	html = '<div class="progress">';
	
	max = 5000;
	
	if (time >= max) {
		pct = 100
		html += '<div class="progress-bar progress-bar-danger" role="progressbar" aria-valuenow="' + time + '" aria-valuemin="0" aria-valuemax="' + time + '" style="width: ' + pct + '%"><span class="sr-only">Nope</span></div></div>';
	}
	else if (time > goal) {
		pct = Math.round((time / max) * 100, 0);
		html += '<div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="' + time + '" aria-valuemin="0" aria-valuemax="' + goal + '" style="width: ' + pct + '%"><span class="sr-only">Nope</span></div></div>';
	} else {
		pct = Math.round((time / max) * 100, 0);
		html += '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + time + '" aria-valuemin="0" aria-valuemax="' + goal + '" style="width: ' + pct + '%"><span class="sr-only">Nope</span></div></div>';
	}
	
	return html;
});

// Just serve this static content (js, css)
app.use(serveStatic(__dirname + '/static'));

// There's only 1 route here
app.get('/', function (req, res) {
	
    var start = new Date();
    
	res.render('index', {
		theteams: teams,
		date: start
	});
    
})

// Start the server
app.listen(8080, function () {
	console.log("scoreboard.js: Running on :8080");
});
