var Knex = require('../knex');
var Q = require('q');

var assert = require('assert');
var equal = assert.equal;
var deepEqual = assert.deepEqual;

describe('Knex.Builder', function() {
    
  describe('Selects', function() {
  
    describe('basic', function() {
      it('runs with no conditions', function(ok) {
        Knex('tableName').select().spread(function(sql, bindings, connection) {
          equal(sql, 'select * from `tableName`');
          deepEqual(bindings, []);
          ok();
        }).done();
      });
    });

    describe('where', function() {
      it('handles simple "where"', function(ok) {
        Knex('table').where('id', 1).select('column1', 'column2').spread(function(sql, bindings) {
          equal(sql, 'select `column1`, `column2` from `table` where `id` = ?');
          deepEqual(bindings, [1]);
          return Knex('table').where('id', '=', 'someValue').select(['column1', 'column2']);
        }).spread(function(sql, bindings) {
          equal(sql, 'select `column1`, `column2` from `table` where `id` = ?');
          deepEqual(bindings, ['someValue']);
          return Knex('table').where({
            id: 1,
            otherItem: 2
          }).andWhere('title', 'test').select();
        }).spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` = ? and `otherItem` = ? and `title` = ?');
          deepEqual(bindings, [1, 2, 'test']);
          ok();
        }).done();
      });

      it('handles "or where"', function(ok) {
        Knex('table').where('id', 1).orWhere({id: 2}).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` = ? or `id` = ?');
          deepEqual(bindings, [1, 2]);
          return Knex('table').where('id', '=', 'someValue').orWhere('otherId', '>', 10).select();
        }).spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` = ? or `otherId` > ?');
          deepEqual(bindings, ['someValue', 10]);
          ok();
        }).done();
      });

      it('handles "where exists"', function(ok) {
        Knex('table').whereExists(function(qb) {
          deepEqual(qb, this);
          return qb.select('column1').from('table2').where({
            id: 1,
            otherItem: 2
          });
        }).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where exists (select `column1` from `table2` where `id` = ? and `otherItem` = ?)');
          deepEqual(bindings, [1, 2]);
          ok();
        }).done();
      });

      it('handles "where in"', function(ok) {
        Knex('table').whereIn('id', [1, 2, 3]).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` in (?, ?, ?)');
          deepEqual(bindings, [1, 2, 3]);
          ok();
        }).done();
      });

      it('handles "or where in"', function(ok) {
        Knex('table').where('id', 1).orWhereIn('name', ['Tim', 'Joe', 'Bill']).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` = ? or `name` in (?, ?, ?)');
          deepEqual(bindings, [1, 'Tim', 'Joe', 'Bill']);
          ok();
        }).done();
      });

      it('handles "where between"', function(ok) {
        Knex('table').whereBetween('id', [1, 100]).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` between ? and ?');
          deepEqual(bindings, [1, 100]);
          ok();
        }).done();
      });

      it('handles "or where between"', function(ok) {
        Knex('table').whereBetween('id', [1, 100]).orWhereBetween('id', [200, 300]).select().spread(function(sql, bindings) {
          equal(sql, 'select * from `table` where `id` between ? and ? or `id` between ? and ?');
          deepEqual(bindings, [1, 100, 200, 300]);
          ok();
        }).done();
      });
    });
    
    describe('joins', function() {
      it('uses inner join by default', function(ok) {
        Knex('tableName').join('otherTable', 'tableName.id', '=', 'otherTable.otherId').select('tableName.*', 'otherTable.name').spread(function(sql, bindings) {
          equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` inner join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`');
          ok();
        }).done();
      });
    
      it('takes a fifth parameter to specify the join type', function(ok) {
        Knex('tableName').join('otherTable', 'tableName.id', '=', 'otherTable.otherId', 'left').select('tableName.*', 'otherTable.name').spread(function(sql, bindings) {
          equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` left join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`');
          ok();
        }).done();
      });

      it('accepts a callback as the second argument for advanced joins', function(ok) {
        Knex('tableName').join('table2', function(join) {
          join.on('tableName.one_id', '=', 'table2.tableName_id');
          join.orOn('tableName.other_id', '=', 'table2.tableName_id2');
        }, 'left').select().spread(function(sql, bindings) {
          equal(sql, 'select * from `tableName` left join `table2` on `tableName`.`one_id` = `table2`.`tableName_id` or `tableName`.`other_id` = `table2`.`tableName_id2`');
          ok();
        }).done();
      });
    });
  });

  describe('Inserts', function() {

    it('Should take hashes passed into insert and keep them in the correct order', function(ok) {

      Knex('tableName').insert([{
        firstName: 'Test',
        lastName: 'User',
        item: 0
      },{
        item: 1,
        lastName: 'Item',
        firstName: 'Person'
      }]).spread(function(sql, bindings) {
        equal(sql, 'insert into `tableName` (`firstName`, `item`, `lastName`) values (?, ?, ?), (?, ?, ?)');
        deepEqual(bindings, ['Test', 0, 'User', 'Person', 1, 'Item']);
        ok();
      });

    });

  });

});