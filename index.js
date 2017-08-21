'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

var OPERATORS = [
// 'all',
'and', 'eq',
// 'exists',
'gt', 'gte', 'in', 'lt', 'lte',
// 'mod',
'ne', 'nin', 'nor', 'not', 'or', 'regex'];

function quoted(val) {
  return _.isString(val) ? '\'' + val + '\'' : val;
}

function buildQuery(query) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '$';

  var operation = _.mapValues(_.keyBy(OPERATORS), function (op) {
    return '' + prefix + op;
  });
  var isOp = function isOp(key) {
    return _.includes(_.values(operation), key);
  };
  var getOp = function getOp(key) {
    return isOp(key) ? key : null;
  };

  var sub = function sub(subQuery, op, field) {
    switch (op) {
      case operation.and:
        return '(' + _.reduce(subQuery, function (accum, cur) {
          return accum ? accum + ' AND (' + buildQuery(cur, prefix) + ')' : '(' + buildQuery(cur, prefix) + ')';
        }, '') + ')';

      case operation.or:
        return '(' + _.reduce(subQuery, function (accum, cur) {
          return accum ? accum + ' OR (' + buildQuery(cur, prefix) + ')' : '(' + buildQuery(cur, prefix) + ')';
        }, '') + ')';

      case operation.nor:
        return 'not (' + _.reduce(subQuery, function (accum, cur) {
          return accum ? accum + ' OR (' + buildQuery(cur, prefix) + ')' : '(' + buildQuery(cur, prefix) + ')';
        }, '') + ')';

      case operation.in:
        return _.reduce(subQuery, function (accum, val) {
          return accum ? accum + ' AND ' + field + ' = ' + quoted(val) : field + ' = ' + quoted(val);
        }, '');

      case operation.nin:
        return 'not (' + _.reduce(subQuery, function (accum, val) {
          return accum ? accum + ' AND ' + field + ' = ' + quoted(val) : field + ' = ' + quoted(val);
        }, '') + ')';

      case operation.eq:
        return field + ' = ' + quoted(subQuery);

      case operation.gt:
        return field + ' > ' + quoted(subQuery);

      case operation.gte:
        return field + ' >= ' + quoted(subQuery);

      case operation.lt:
        return field + ' < ' + quoted(subQuery);

      case operation.lte:
        return field + ' <= ' + quoted(subQuery);

      case operation.ne:
        return field + ' <> ' + quoted(subQuery);

      case operation.not:
        return 'not (' + buildQuery(subQuery, prefix) + ')';

      case operation.regex:
        return field + ' LIKE \'' + subQuery + '\'';

      default:
        return _.isObject(subQuery) ? _.reduce(subQuery, function (accum, v, k) {
          return accum ? accum + ' AND (' + sub(v, getOp(k), field) + ')' : '(' + sub(v, getOp(k), field) + ')';
        }, '') : field ? field + ' = ' + quoted(subQuery) : subQuery;
    }
  };

  return _.reduce(query, function (accum, subQuery, key) {
    var field = isOp(key) ? null : key;
    var op = isOp(key) ? key : null;
    return accum ? accum + ' AND ' + sub(subQuery, op, field) : sub(subQuery, op, field);
  }, '');
}

function docFilter(selection, query, prefix) {
  return selection.andWhereRaw(buildQuery(query, prefix));
}

module.exports = docFilter;
