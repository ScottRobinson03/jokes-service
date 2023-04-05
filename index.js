const express = require('express');
const app = express();
const { Joke } = require('./db');
const { Op } = require('sequelize');

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/jokes', async (req, resp) => {
    /*
    2. A fully complete GET /jokes route should:

    Return a list of all jokes when no query string parameters are provided

    Return a list of jokes, filtered by tag for GET /jokes?tag=YOUR_QUERY_HERE

    Return a list of jokes, filtered by content GET /jokes?content=YOUR_QUERY_HERE
    */
    const { tags, content } = req.query;
    let jokes;

    let whereQuery = {}
    let tagsQuery;
    let contentQuery;
    if (tags) tagsQuery = {tags: {[Op.substring]: tags}};
    if (content) contentQuery = {joke: {[Op.substring]: content}};
    
    if (tagsQuery && contentQuery) whereQuery = {[Op.and]: {...tagsQuery, ...contentQuery}};
    else whereQuery = tagsQuery ?? contentQuery;

    jokes = await Joke.findAll({where: whereQuery});
    resp.json(jokes);
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
