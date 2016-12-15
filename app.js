var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cors = require('cors');


app.use(cors());


var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database: 'map',
  dateStrings: true
});

connection.connect();

app.get('/organizations', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    var query = 'select * from organizations';
    if (req.query.geography) {
        query = 'select distinct a.id,a.name,a.website,a.overview,a.poc_name,a.poc_email,a.type,a.logo_file from organizations as a join programs on website=organizations_website where geography = "' + req.query.geography + '"';
    }
    if (req.query.website) {
        query += ' where website="' + req.query.website + '"';
    }
	
	query += ' ORDER BY name ASC;';
	
    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;    
        }
        res.send(JSON.stringify(rows));
    });
});

app.get('/programs', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    var query = 'select * from programs';
    if (req.query.website) {
        query += ' where organizations_website="'+ req.query.website +'"';
    }
    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        res.send(JSON.stringify(rows));
    });
});

/*
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

app.get('/getStatesForFilter/:filter', function (req, res)
{
    res.setHeader('Content-Type', 'application/json');
	
	if(req.params.filter === "All")
	{
		connection.query('SELECT DISTINCT geography FROM programs ORDER BY geography ASC;', function(err, rows, fields)
		{
			if (err)
			{
				throw err;    
			}
			res.send(JSON.stringify(rows));
		});
	}
	else
	{
		connection.query('SELECT DISTINCT programs.geography FROM programs INNER JOIN organizations ON programs.organizations_website=organizations.website WHERE organizations.type=\'' + req.params.filter + '\' ORDER BY programs.geography ASC;', function(err, rows, fields)
		{
			if (err)
			{
				throw err;    
			}
			res.send(JSON.stringify(rows));
		});
	}
});


app.get('/addMailToQueue', function (req, res)
{
    res.setHeader('Content-Type', 'application/json');
	
	if (req.query.to && req.query.message)
	{
		connection.query('INSERT INTO mail (date_time, to_email, message, sent) VALUES (NOW(), "' + req.query.to + '", "' + req.query.message + '", FALSE);', function(err, rows, fields)
		{
			if (err)
			{
				throw err;    
			}
			res.send(JSON.stringify(rows));
		});
	}
});

app.get('/getPendingMails', function (req, res)
{
    res.setHeader('Content-Type', 'application/json');
	
	connection.query('SELECT DISTINCT * FROM mail WHERE sent = FALSE ORDER BY date_time ASC;', function(err, rows, fields)
	{
		if (err)
		{
			throw err;    
		}
		res.send(JSON.stringify(rows));
	});
});

app.get('/removeMailFromQueue', function (req, res)
{
    res.setHeader('Content-Type', 'application/json');
	
	if (req.query.dateTime)
	{
		connection.query('UPDATE mail SET sent = TRUE WHERE date_time = "' + req.query.dateTime + '";', function(err, rows, fields)
		{
			if (err)
			{
				throw err;    
			}
			res.send(JSON.stringify(rows));
		});
	}
});


var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('map app listening at http://%s:%s \n', host, port);
});