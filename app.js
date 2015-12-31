var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require('pg-promise')({});
var db = pgp("postgres://postgres@localhost/emberblog");

var apiRoot = "http://localhost:3000";

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(function(req, res, next) {
	console.log(req.originalUrl);
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})

app.get('/', function(req, res) {
	res.send('Welcome to EmberBlog');
});

app.get('/posts', function(req, res) {
	db.query("SELECT * from posts")
	.then(function(results) {
		var data = results.map(function(result) {
			return {
				type: 'posts',
				id: result.id,
				attributes: result,
				relationships: {
					comments: {
						links: {
							related: apiRoot + "/posts/" + result.id + "/comments"
						}
					}
				}
			};
		});

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.post('/posts', function(req, res) {
	console.log(req.body);
	var data;

	if(req.body.data) {
		data = req.body.data.attributes;
	} else {
		data = req.body;
	}

	db.one('INSERT into posts(title, author, date, content) values($1, $2, $3, $4) returning id, title, author, date, content',
	[data.title, data.author, data.date, data.content])
	.then(function(result) {
		console.log(result);
		var data = {
			type: 'posts',
			id: result.id,
			attributes: result
		};

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.get('/posts/:id', function(req, res) {
	db.one('SELECT * FROM posts WHERE id=$1', req.params.id)
	.then(function(result) {
		var data = {
			type: 'posts',
			id: result.id,
			attributes: result,
			relationships: {
				comments: {
					links: {
						related: apiRoot + "/posts/" + result.id + "/comments"
					}
				}
			}
		};

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.get('/posts/:id/comments', function(req, res) {
	db.query('SELECT * from comments where post_id=$1', req.params.id)
	.then(function(results) {
		var data = results.map(function(result) {
			return {
				type: 'comments',
				id: result.id,
				attributes: result,
				relationships: {
					posts: {
						links: {
							related: apiRoot + "/posts/" + result.post_id
						}
					}
				}
			};
		});

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.get('/comments', function(req, res) {
	db.query("SELECT * from comments")
	.then(function(results) {
		var data = results.map(function(result) {
			return {
				type: 'comments',
				id: result.id,
				attributes: result,
				relationships: {
					posts: {
						links: {
							related: apiRoot + "/posts/" + result.post_id
						}
					}
				}
			};
		});

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.post('/comments', function(req, res) {
	console.log(req.body);
	var data;
	if (req.body.data) {
		data = req.body.data.attributes;
		data.post_id = req.body.data.relationships.post.data.id;
	} else {
		data = req.body;
	}

	db.one('INSERT into comments(post_id, name, content) values($1, $2, $3) returning id, post_id, name, content',
	[data.post_id, data.name, data.content])
	.then(function(result) {
		var data = {
			type: 'comments',
			id: result.id,
			attributes: result
		}

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

app.get('/comments/:id', function(req, res) {
	db.one('SELECT * from comments where id=$1', req.params.id)
	.then(function(result) {
		var data = {
			type: 'comments',
			id: result.id,
			attributes: result,
			relationships: {
				posts: {
					links: {
						related: apiRoot + "/posts/" + result.post_id
					}
				}
			}
		}

		res.send({ data });
	})
	.catch(function(err) {
		console.log(err);
	});
});

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('EmberBlog app listening at http://%s:%s', host, port);
});
