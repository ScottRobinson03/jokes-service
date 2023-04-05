const app = require('./index');
const { sequelize, Joke } = require('./db');
const request = require('supertest');
const seed = require('./db/seedFn');
const seedData = require('./db/seedData');

describe('GET /jokes', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true }); // recreate db
        await seed();
    });

    it('should return a list of all jokes', async () => {
        const response = await request(app).get('/jokes');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(seedData.length);
        expect(response.body[0]).toEqual(expect.objectContaining(seedData[0]));
    });

    it('should return a list of jokes, filtered by tag', async () => {
        const response = await request(app).get('/jokes?tags=anatomy');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);
        expect(response.body[0]).toEqual(expect.objectContaining(seedData[3]));
    });

    it('should return a list of jokes, filtered by content', async () => {
        const response = await request(app).get('/jokes?content=flamingo');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toEqual(expect.objectContaining(seedData[2]));
    });
});

describe("POST /jokes", () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    const jokeTags = "animals";
    const jokeContent = "Why did the chicken cross the road? To get to the other side!";
    it("should return 400 Bad Request from invalid body", async () => {
        const response = await request(app).post("/jokes").send({ tags: jokeTags });
        expect(response.status).toBe(400);
        expect(response.text).toBe("Missing 'content' from body");

        const data = await Joke.findAll();
        expect(data).toHaveLength(0);
    });

    it("should create a joke from valid body", async () => {
        const response = await request(app).post("/jokes").send({
            tags: jokeTags,
            content: jokeContent,
        });
        expect(response.status).toBe(201);
        const data = await Joke.findAll();
        expect(data).toHaveLength(1);
        expect(data).toEqual([expect.objectContaining({ tags: "animals", joke: jokeContent })]);
    });
});

describe("PUT /jokes/:jokeId", () => {
    const oldJokeContent = "Why did the chicken cross the road? To get to the other side!";
    const oldJokeTags = "animals";
    beforeAll(async () => {
        await sequelize.sync({ force: true });
        await Joke.create({
            tags: oldJokeTags,
            joke: oldJokeContent,
        });
    });

    it("should return 400 Bad Request from invalid body", async () => {
        const response = await request(app).put("/jokes/1").send({ content: "New Joke Content" });
        expect(response.status).toBe(400);

        const data = await Joke.findAll();
        expect(data).toEqual([expect.objectContaining({ tags: "animals", joke: oldJokeContent })]);
    });

    it("should update joke from valid body if exists", async () => {
        const newJokeContent = "New Joke Content";
        const newJokeTags = "Misc.";
        const response = await request(app)
            .put("/jokes/1")
            .send({ tags: newJokeTags, content: newJokeContent });
        expect(response.status).toBe(200);

        const data = await Joke.findAll();
        expect(data).toHaveLength(1);
        expect(data).toEqual([
            expect.objectContaining({ tags: newJokeTags, joke: newJokeContent }),
        ]);
    });

    it("should create new joke from valid body if doesn't exist", async () => {
        const newJokeContent = "Why is 6 afraid of 7? Because 7 *ate* 9!";
        const newJokeTags = "numbers";
        const response = await request(app).put("/jokes/2").send({
            tags: newJokeTags,
            content: newJokeContent,
        });
        expect(response.status).toBe(201);

        const data = await Joke.findAll();
        expect(data).toHaveLength(2);
        expect(data[1]).toEqual(
            expect.objectContaining({ tags: newJokeTags, joke: newJokeContent })
        );
    });
});

describe("DELETE /jokes/:jokeId", () => {
    const jokeTags = "animals";
    const jokeContent = "Why did the chicken cross the road? To get to the other side!";
    beforeAll(async () => {
        await sequelize.sync({ force: true });
        await Joke.create({
            tags: jokeTags,
            joke: jokeContent,
        });
    });

    it("should return 404 when joke not found", async () => {
        const response = await request(app).delete("/jokes/2");
        expect(response.status).toBe(404);

        const data = await Joke.findAll();
        expect(data).toHaveLength(1);
        expect(data).toEqual([expect.objectContaining({ tags: jokeTags, joke: jokeContent })]);
    });

    it("should delete the joke when found", async () => {
        const response = await request(app).delete("/jokes/1");
        expect(response.status).toBe(204);

        const data = await Joke.findAll();
        expect(data).toHaveLength(0);
    });
});