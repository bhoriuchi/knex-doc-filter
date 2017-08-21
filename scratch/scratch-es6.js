import Knex from 'knex'
import _ from 'lodash'
import docFilter from '../src'

const OPERATORS = [
  // 'all',
  'and',
  'eq',
  // 'exists',
  'gt',
  'gte',
  'in',
  'lt',
  'lte',
  // 'mod',
  'ne',
  'nin',
  'nor',
  'not',
  'or',
  'regex',
  // 'size',
]

function prettyPrint (o) {
  return console.log(JSON.stringify(o, null, '  '))
}

let knex = Knex({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'test'
  }
})


const q1 = {
  name: 'John',
  email: 'john@amil.com'
}


// select * from user where name = 'John' and email = 'john@qmail.com'
const q2 = {
  $not: {
    $and: [
      { name: 'John' },
      { email: 'john@amil.com' }
    ]
  }
}

// select * from user where name = 'John' and id < 10
const q3 = {
  $and: [
    { name: { $eq: 'John' } },
    { id: { $lt: 10 } }
  ],
  $or: [
    { name: 'hi', id: { $eq: 1 } },
    { name: 'lo' }
  ]
}

const q4 = {
  $not: {
    name: { $eq: 'hi' }
  },
  status: 1
}

const q5 = {
  name: {
    $in: ['a', 'b', 'c'],
    $eq: 'hi',
    $regex: '%hi%'
  }
}

function quoted (val) {
  return _.isString(val)
    ? `'${val}'`
    : val
}

function buildQuery (query, prefix = '$') {
  const operation = _.mapValues(_.keyBy(OPERATORS), op => `${prefix}${op}`)
  const isOp = key => _.includes(_.values(operation), key)
  const getOp = key => isOp(key) ? key : null

  let sub = (subQuery, op, field) => {
    switch (op) {
      case operation.and:
        return '(' + _.reduce(subQuery, (accum, cur) => {
          return accum
            ? `${accum} AND (${buildQuery(cur, prefix)})`
            : `(${buildQuery(cur, prefix)})`
        }, '') + ')'

      case operation.or:
        return '(' + _.reduce(subQuery, (accum, cur) => {
          return accum
            ? `${accum} OR (${buildQuery(cur, prefix)})`
            : `(${buildQuery(cur, prefix)})`
        }, '') + ')'

      case operation.nor:
        return 'not (' + _.reduce(subQuery, (accum, cur) => {
          return accum
            ? `${accum} OR (${buildQuery(cur, prefix)})`
            : `(${buildQuery(cur, prefix)})`
        }, '') + ')'

      case operation.in:
        return _.reduce(subQuery, (accum, val) => {
          return accum
            ? `${accum} AND ${field} = ${quoted(val)}`
            : `${field} = ${quoted(val)}`
        }, '')

      case operation.nin:
        return 'not (' + _.reduce(subQuery, (accum, val) => {
          return accum
            ? `${accum} AND ${field} = ${quoted(val)}`
            : `${field} = ${quoted(val)}`
        }, '') + ')'

      case operation.eq:
        return `${field} = ${quoted(subQuery)}`

      case operation.gt:
        return `${field} > ${quoted(subQuery)}`

      case operation.gte:
        return `${field} >= ${quoted(subQuery)}`

      case operation.lt:
        return `${field} < ${quoted(subQuery)}`

      case operation.lte:
        return `${field} <= ${quoted(subQuery)}`

      case operation.ne:
        return `${field} <> ${quoted(subQuery)}`

      case operation.not:
        return `not (${buildQuery(subQuery, prefix)})`

      case operation.regex:
        return `${field} LIKE '${subQuery}'`

      default:
        return _.isObject(subQuery)
          ? _.reduce(subQuery, (accum, v, k) => {
            return accum
              ? `${accum} AND (${sub(v, getOp(k), field)})`
              : `(${sub(v, getOp(k), field)})`
          }, '')
          : field ? `${field} = ${quoted(subQuery)}` : subQuery
    }
  }

  return _.reduce(query, (accum, subQuery, key) => {
    let field = isOp(key) ? null : key
    let op = isOp(key) ? key : null
    return accum
      ? `${accum} AND ${sub(subQuery, op, field)}`
      : sub(subQuery, op, field)
  }, '')
}

// console.log(buildQuery(q5))

let filter = docFilter(knex('user'), q2)
console.log(filter.toSQL())
filter.then(prettyPrint, console.error)
.finally(process.exit)
