const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const { buildSchema } = require('graphql')

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
    type Query {
        hello: String
    }
`)

// The root provides a resolver function for each API endpoint
const root = {
    hello: () => 'Hello Koa GraphQL!',
}

const app = new Koa()
app.use(mount('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
})))

app.listen(5000)
console.log('Running a GraphQL API server at http://localhost:5000/graphql')
