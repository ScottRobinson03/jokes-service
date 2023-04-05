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

/*
BONUS TASK FOR EXTRA CREDIT:
POST /jokes: Adds a joke to the database. Should accept both columns in the req.body

PUT /jokes/:id: Edits a joke by ID.  Should accept both/either columns in the req.body

DELETE /jokes/:id: Removes a joke from the database, by ID.

*/

app.post("/jokes", async (req, resp) => {
    const { tags, content } = req.body;
    if (tags === undefined) {
        resp.status(400).send("Missing 'tags' from body");
        return;
    }
    if (content === undefined) {
        resp.status(400).send("Missing 'content' from body");
        return;
    }

    await Joke.create({tags, joke: content});
    resp.sendStatus(201);
});

app.put("/jokes/:id", async (req, resp) => {
    const { id } = req.params
    const {tags, content} = req.body

    if (tags === undefined) {
        resp.status(400).send("Missing the replacement tags of the task");
        return;
    }
    if (content === undefined) {
        resp.status(400).send("Missing the replacement content of the task");
        return;
    }
    const updated = await Joke.update({ tags, joke: content }, { where: { id } });
    if (updated[0] === 0) {
        // The joke doesn't exist, so create it instead
        await Joke.create({ tags, joke: content });
        resp.sendStatus(201);
        return;
    }
    resp.sendStatus(200);
});

app.delete("/jokes/:id", async (req, resp) => {
    const { id } = req.params;

    const deleted = await Joke.destroy({where: {id}});
    console.log(deleted);
    if (deleted === 0) {
        resp.status(404).send("Joke Not Found");
        return;
    }
    resp.sendStatus(204);
})

// we export the app, not listening in here, so that we can run tests
module.exports = app;
