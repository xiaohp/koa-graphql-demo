const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const { buildSchema } = require('graphql')
const crypto = require('crypto')
const path = require('path')
const staticServe = require('koa-static')

// 使用 GraphQL schema language 构建一个 schema
const schema = buildSchema(`
    input MessageInput {
        content: String
        author: String
    }

    type Message {
        id: ID!
        content: String
        author: String
    }

    type Mutation {
        createMessage(input: MessageInput): Message
        updateMessage(id: ID!, input: MessageInput): Message
        deleteMessage(id: ID!): Message
    }

    type Query {
        hello: String
        random: Float!
        getMessage(id: ID!): Message
    }
`)

// Message 拥有复杂字段，把它放在这个对象里面
class Message {
    constructor(id, { content, author }) {
        this.id = id
        this.content = content
        this.author = author
    }
}

// 保存数据
const fakeDatabase = {}

// root 将会提供每个 API 入口端点的解析函数
const root = {
    hello: () => 'Hello Koa GraphQL!',
    random: () => Math.random(),
    getMessage: ({ id }) => {
        if (!fakeDatabase[id]) {
            throw new Error('no message exists with id ' + id)
        }
        return new Message(id, fakeDatabase[id])
    },
    createMessage: ({ input }) => {
        // 生成随机 id
        const id = crypto.randomBytes(10).toString('hex')

        fakeDatabase[id] = input
        return new Message(id, input)
    },
    updateMessage: ({ id, input }) => {
        if (!fakeDatabase[id]) {
            throw new Error('no message exists with id ' + id)
        }
        // 更新数据
        fakeDatabase[id] = input
        return new Message(id, input)
    },
    deleteMessage: ({ id }) => {
        if (!fakeDatabase[id]) {
            throw new Error('no message exists with id ' + id)
        }
        const input = fakeDatabase[id]
        const message = new Message(id, input)
        // 删除数据
        delete fakeDatabase[id]
        return message
    },
}

const app = new Koa()

const staticFile = staticServe(path.join(__dirname, './static'))

const main = mount('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}))

const port = 5000

app.use(staticFile)
app.use(main)
app.listen(port)
console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`)

// 使用
// mutation {
//   createMessage(input: {
//     author: "my name",
//     content: "hello koa graphql"
//   }) {
//     id
//   }
// }
//
// query {
//   getMessage(id: "379c65fefa39ae53a7ee") {
//     author
//     content
//   }
//   random
//   hello
// }
//
// mutation {
//   updateMessage(id: "379c65fefa39ae53a7ee", input: {
//     content: "new content",
//     author: "new author"
//   }) {
//     id
//     author,
//     content
//   }
// }

// mutation {
//   deleteMessage(id: "4f008b9894d9f5f97834") {
//     id
//     author
//     content
//   }
// }
