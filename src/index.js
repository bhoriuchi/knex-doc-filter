import _ from 'lodash'

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

export default function docFilter (selection, query, prefix) {
  return selection.andWhereRaw(buildQuery(query, prefix))
}
