# knex-doc-filter
MongoDB query documents in `knex.js`

---

Creates a `knex.js` filter using MongoDB [query document](https://docs.mongodb.com/v3.2/tutorial/query-documents/)

### Operators

`$and`, `$or`, `$nor`, `$eq`, `$ne`, `$regex`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$not`

### Example (ES6)

```js
import Knex from 'knex'
import docFilter from 'knex-doc-filter'

let knex = Knex({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'test'
  }
})
let selection = knex('animals')

let query = {
  $and: [
    { owner: { $eq: 'you' } },
    { name: 'Cat' }
  ]
}

docFilter(selection, query).then(console.log, console.error)
```

### API

##### docfilter (`selection`, `query`) => `KnexQueryBuilder`

* `selection` - query selection to build from
* `query` - document query (see [`mongo documentation`](https://docs.mongodb.com/v3.2/tutorial/query-documents/))

### Notes

* `$regex` - uses T-SQL `LIKE` (see [`LIKE documentation`](https://docs.microsoft.com/en-us/sql/t-sql/language-elements/like-transact-sql))