////////////////////////////////////////////////////////////////////////////////
/// @brief tests for query language, functions
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2010-2012 triagens GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2012, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

var internal = require("internal");
var jsunity = require("jsunity");

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function ahuacatlFunctionsTestSuite () {
  var errors = internal.errors;

////////////////////////////////////////////////////////////////////////////////
/// @brief execute a given query
////////////////////////////////////////////////////////////////////////////////

  function executeQuery (query) {
    var cursor = AHUACATL_RUN(query, undefined);
    if (cursor instanceof ArangoError) {
      print(query, cursor.errorMessage);
    }
    assertFalse(cursor instanceof ArangoError);
    return cursor;
  }

////////////////////////////////////////////////////////////////////////////////
/// @brief execute a given query and return the results as an array
////////////////////////////////////////////////////////////////////////////////

  function getQueryResults (query, isFlat) {
    var result = executeQuery(query).getRows();
    var results = [ ];

    for (var i in result) {
      if (!result.hasOwnProperty(i)) {
        continue;
      }

      var row = result[i];
      if (isFlat) {
        results.push(row);
      } 
      else {
        var keys = [ ];
        for (var k in row) {
          if (row.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
       
        keys.sort();
        var resultRow = { };
        for (var k in keys) {
          if (keys.hasOwnProperty(k)) {
            resultRow[keys[k]] = row[keys[k]];
          }
        }
        results.push(resultRow);
      }
    }

    return results;
  }

////////////////////////////////////////////////////////////////////////////////
/// @brief return the error code from a result
////////////////////////////////////////////////////////////////////////////////

  function getErrorCode (result) {
    return result.errorNum;
  }


  return {

////////////////////////////////////////////////////////////////////////////////
/// @brief set up
////////////////////////////////////////////////////////////////////////////////

    setUp : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief tear down
////////////////////////////////////////////////////////////////////////////////

    tearDown : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test length function
////////////////////////////////////////////////////////////////////////////////

    testLength1 : function () {
      var expected = [ 0, 0, 0 ];
      var actual = getQueryResults("FOR year IN [ 2010, 2011, 2012 ] LET quarters = ((FOR q IN [ ] return q)) return LENGTH(quarters)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test length function
////////////////////////////////////////////////////////////////////////////////

    testLength2 : function () {
      var expected = [ 4, 4, 4 ];
      var actual = getQueryResults("FOR year IN [ 2010, 2011, 2012 ] LET quarters = ((FOR q IN [ 1, 2, 3, 4 ] return q)) return LENGTH(quarters)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test length function
////////////////////////////////////////////////////////////////////////////////

    testLengthInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH(4)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LENGTH({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concat function
////////////////////////////////////////////////////////////////////////////////
    
    testConcat1 : function () {
      var expected = [ "theQuickBrownFoxJumps" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CONCAT('the', 'Quick', '', null, 'Brown', null, 'Fox', 'Jumps')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concat function
////////////////////////////////////////////////////////////////////////////////
    
    testConcat2 : function () {
      var expected = [ "theQuickBrownアボカドJumps名称について" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CONCAT('the', 'Quick', '', null, 'Brown', null, 'アボカド', 'Jumps', '名称について')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concat function
////////////////////////////////////////////////////////////////////////////////

    testConcatInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(\"yes\", true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(\"yes\", 4)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(\"yes\", [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(\"yes\", { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(true, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT(4, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT([ ], \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCAT({ }, \"yes\")")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concatseparator function
////////////////////////////////////////////////////////////////////////////////
    
    testConcatSeparator1 : function () {
      var expected = [ "the,Quick,Brown,Fox,Jumps" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CONCATSEPARATOR(',', 'the', 'Quick', null, 'Brown', null, 'Fox', 'Jumps')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concatseparator function
////////////////////////////////////////////////////////////////////////////////
    
    testConcatSeparator2 : function () {
      var expected = [ "the*/*/Quick*/*/Brown*/*/*/*/Fox*/*/Jumps" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CONCATSEPARATOR('*/*/', 'the', 'Quick', null, 'Brown', '', 'Fox', 'Jumps')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test concatseparator function
////////////////////////////////////////////////////////////////////////////////

    testConcatSeparatorInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(null, \"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(true, \"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(4, \"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR([ ], \"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR({ }, \"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", true, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", 4, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", [ ], \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", { }, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", \"yes\", true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", \"yes\", 4)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", \"yes\", [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CONCATSEPARATOR(\"yes\", \"yes\", { })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test charlength function
////////////////////////////////////////////////////////////////////////////////
    
    testCharLength1 : function () {
      var expected = [ 13 ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CHARLENGTH('the quick fox')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test charlength function
////////////////////////////////////////////////////////////////////////////////
    
    testCharLength2 : function () {
      var expected = [ 7 ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CHARLENGTH('äöüÄÖÜß')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test charlength function
////////////////////////////////////////////////////////////////////////////////
    
    testCharLength3 : function () {
      var expected = [ 10 ];
      var actual = getQueryResults("FOR r IN [ 1 ] return CHARLENGTH('アボカド名称について')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test charlength function
////////////////////////////////////////////////////////////////////////////////

    testCharLengthInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH(\"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH(3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CHARLENGTH({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test lower function
////////////////////////////////////////////////////////////////////////////////
    
    testLower1 : function () {
      var expected = [ "the quick brown fox jumped" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return LOWER('THE quick Brown foX JuMpED')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test lower function
////////////////////////////////////////////////////////////////////////////////
    
    testLower2 : function () {
      var expected = [ "äöüäöüß アボカド名称について" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return LOWER('äöüÄÖÜß アボカド名称について')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test lower function
////////////////////////////////////////////////////////////////////////////////
    
    testLower3 : function () {
      var expected = [ "0123456789<>|,;.:-_#'+*@!\"$&/(){[]}?\\" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return LOWER('0123456789<>|,;.:-_#\\'+*@!\\\"$&/(){[]}?\\\\')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test lower function
////////////////////////////////////////////////////////////////////////////////

    testLowerInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER(\"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER(3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN LOWER({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test upper function
////////////////////////////////////////////////////////////////////////////////
    
    testUpper1 : function () {
      var expected = [ "THE QUICK BROWN FOX JUMPED" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return UPPER('THE quick Brown foX JuMpED')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test upper function
////////////////////////////////////////////////////////////////////////////////
    
    testUpper2 : function () {
      var expected = [ "ÄÖÜÄÖÜSS アボカド名称について" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return UPPER('äöüÄÖÜß アボカド名称について')", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test upper function
////////////////////////////////////////////////////////////////////////////////

    testUpperInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER(\"yes\", \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER(3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UPPER({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test substring function
////////////////////////////////////////////////////////////////////////////////
    
    testSubstring1 : function () {
      var expected = [ "the" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return SUBSTRING('the quick brown fox', 0, 3)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test substring function
////////////////////////////////////////////////////////////////////////////////
    
    testSubstring2 : function () {
      var expected = [ "quick" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return SUBSTRING('the quick brown fox', 4, 5)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test substring function
////////////////////////////////////////////////////////////////////////////////
    
    testSubstring3 : function () {
      var expected = [ "fox" ];
      var actual = getQueryResults("FOR r IN [ 1 ] return SUBSTRING('the quick brown fox', -3)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test substring function
////////////////////////////////////////////////////////////////////////////////

    testSubstringInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", 0, 2, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(null, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(true, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(3, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING([ ], 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING({ }, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", null, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", true, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", \"yes\", 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", [ ], 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", { }, 0)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", \"yes\", null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", \"yes\", true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", \"yes\", [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN SUBSTRING(\"yes\", \"yes\", { })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test floor function
////////////////////////////////////////////////////////////////////////////////
    
    testFloor : function () {
      var expected = [ -100, -3, -3, -3, -2, -2, -2, -2, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 99 ];
      var actual = getQueryResults("FOR r IN [ -99.999, -3, -2.1, -2.01, -2, -1.99, -1.1, -1.01, -1, -0.9, -0.6, -0.5, -0.4, -0.1, -0.01, 0, 0.01, 0.1, 0.4, 0.5, 0.6, 0.9, 1, 1.01, 1.1, 1.99, 2, 2.01, 2.1, 3, 99.999 ] return FLOOR(r)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test floor function
////////////////////////////////////////////////////////////////////////////////

    testFloorInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR(1, 2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN FLOOR({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ceil function
////////////////////////////////////////////////////////////////////////////////
    
    testCeil : function () {
      var expected = [ -99, -3, -2, -2, -2, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 100 ];
      var actual = getQueryResults("FOR r IN [ -99.999, -3, -2.1, -2.01, -2, -1.99, -1.1, -1.01, -1, -0.9, -0.6, -0.5, -0.4, -0.1, -0.01, 0, 0.01, 0.1, 0.4, 0.5, 0.6, 0.9, 1, 1.01, 1.1, 1.99, 2, 2.01, 2.1, 3, 99.999 ] return CEIL(r)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test ceil function
////////////////////////////////////////////////////////////////////////////////

    testCeilInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL(1,2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN CEIL({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test abs function
////////////////////////////////////////////////////////////////////////////////
    
    testAbs : function () {
      var expected = [ 99.999, 3, 2.1, 2.01, 2, 1.99, 1.1, 1.01, 1, 0.9, 0.6, 0.5, 0.4, 0.1, 0.01, 0, 0.01, 0.1, 0.4, 0.5, 0.6, 0.9, 1, 1.01, 1.1, 1.99, 2, 2.01, 2.1, 3, 99.999 ];
      var actual = getQueryResults("FOR r IN [ -99.999, -3, -2.1, -2.01, -2, -1.99, -1.1, -1.01, -1, -0.9, -0.6, -0.5, -0.4, -0.1, -0.01, 0, 0.01, 0.1, 0.4, 0.5, 0.6, 0.9, 1, 1.01, 1.1, 1.99, 2, 2.01, 2.1, 3, 99.999 ] return ABS(r)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test abs function
////////////////////////////////////////////////////////////////////////////////

    testAbsInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS(1,2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ABS({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test round function
////////////////////////////////////////////////////////////////////////////////
    
    testRound : function () {
      var expected = [ -100, -3, -2, -2, -2, -2, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 100 ];
      var actual = getQueryResults("FOR r IN [ -99.999, -3, -2.1, -2.01, -2, -1.99, -1.1, -1.01, -1, -0.9, -0.6, -0.5, -0.4, -0.1, -0.01, 0, 0.01, 0.1, 0.4, 0.5, 0.6, 0.9, 1, 1.01, 1.1, 1.99, 2, 2.01, 2.1, 3, 99.999 ] return ROUND(r)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test round function
////////////////////////////////////////////////////////////////////////////////

    testRoundInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND(1,2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND(true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN ROUND({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test rand function
////////////////////////////////////////////////////////////////////////////////
    
    testRand : function () {
      var actual = getQueryResults("FOR r IN [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] return RAND()", true);
      for (var i in actual) {
        if (!actual.hasOwnProperty(i)) {
          continue;
        }
        var value = actual[i];
        assertTrue(value >= 0.0 && value < 1.0);
      }
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test rand function
////////////////////////////////////////////////////////////////////////////////

    testRandInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN RAND(1)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN RAND(2)")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test merge function
////////////////////////////////////////////////////////////////////////////////
    
    testMerge1 : function () {
      var expected = [ { "quarter" : 1, "year" : 2010 }, { "quarter" : 2, "year" : 2010 }, { "quarter" : 3, "year" : 2010 }, { "quarter" : 4, "year" : 2010 }, { "quarter" : 1, "year" : 2011 }, { "quarter" : 2, "year" : 2011 }, { "quarter" : 3, "year" : 2011 }, { "quarter" : 4, "year" : 2011 }, { "quarter" : 1, "year" : 2012 }, { "quarter" : 2, "year" : 2012 }, { "quarter" : 3, "year" : 2012 }, { "quarter" : 4, "year" : 2012 } ]; 
      var actual = getQueryResults("FOR year IN [ 2010, 2011, 2012 ] FOR quarter IN [ 1, 2, 3, 4 ] return MERGE({ \"year\" : year }, { \"quarter\" : quarter })", false);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test merge function
////////////////////////////////////////////////////////////////////////////////
    
    testMerge2 : function () {
      var expected = [ { "age" : 15, "isAbove18" : false, "name" : "John" }, { "age" : 19, "isAbove18" : true, "name" : "Corey" } ];
      var actual = getQueryResults("FOR u IN [ { \"name\" : \"John\", \"age\" : 15 }, { \"name\" : \"Corey\", \"age\" : 19 } ] return MERGE(u, { \"isAbove18\" : u.age >= 18 })", false);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test merge function
////////////////////////////////////////////////////////////////////////////////
    
    testMerge3 : function () {
      var expected = [ { "age" : 15, "id" : 9, "name" : "John" }, { "age" : 19, "id" : 9, "name" : "Corey" } ];
      var actual = getQueryResults("FOR u IN [ { \"id\" : 100, \"name\" : \"John\", \"age\" : 15 }, { \"id\" : 101, \"name\" : \"Corey\", \"age\" : 19 } ] return MERGE(u, { \"id\" : 9 })", false);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test merge function
////////////////////////////////////////////////////////////////////////////////
    
    testMerge4 : function () {
      var expected = [ { "age" : 15, "id" : 33, "name" : "foo" }, { "age" : 19, "id" : 33, "name" : "foo" } ];
      var actual = getQueryResults("FOR u IN [ { \"id\" : 100, \"name\" : \"John\", \"age\" : 15 }, { \"id\" : 101, \"name\" : \"Corey\", \"age\" : 19 } ] return MERGE(u, { \"id\" : 9 }, { \"name\" : \"foo\", \"id\" : 33 })", false);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test merge function
////////////////////////////////////////////////////////////////////////////////

    testMergeInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, 3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE(null, { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE(true, { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE(3, { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE(\"yes\", { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE([ ], { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, { }, null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, { }, true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, { }, 3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, { }, \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MERGE({ }, { }, [ ])")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test union function
////////////////////////////////////////////////////////////////////////////////
    
    testUnion1 : function () {
      var expected = [ [ 1, 2, 3, 1, 2, 3 ], [ 1, 2, 3, 1, 2, 3 ] ];
      var actual = getQueryResults("FOR u IN [ 1, 2 ] return UNION([ 1, 2, 3 ], [ 1, 2, 3 ])", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test union function
////////////////////////////////////////////////////////////////////////////////
    
    testUnion2 : function () {
      var expected = [ [ 1, 2, 3, 3, 2, 1 ], [ 1, 2, 3, 3, 2, 1 ] ];
      var actual = getQueryResults("FOR u IN [ 1, 2 ] return UNION([ 1, 2, 3 ], [ 3, 2, 1 ])", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test union function
////////////////////////////////////////////////////////////////////////////////
    
    testUnion3 : function () {
      var expected = [ "Fred", "John", "John", "Amy" ];
      var actual = getQueryResults("FOR u IN UNION([ \"Fred\", \"John\" ], [ \"John\", \"Amy\"]) return u", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test union function
////////////////////////////////////////////////////////////////////////////////

    testUnionInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], 3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], [ ], null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], [ ], true)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], [ ], 3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], [ ], \"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION([ ], [ ], { })")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION(null, [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION(true, [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION(3, [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION(\"yes\", [ ])")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN UNION({ }, [ ])")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////
    
    testMin1 : function () {
      var expected = [ null, null ]; 
      var actual = getQueryResults("FOR u IN [ [ ], [ null, null ] ] return MIN(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////
    
    testMin2 : function () {
      var expected = [ 1, 1, 1, 1, 1, 1 ];
      var actual = getQueryResults("FOR u IN [ [ 1, 2, 3 ], [ 3, 2, 1 ], [ 1, 3, 2 ], [ 2, 3, 1 ], [ 2, 1, 3 ], [ 3, 1, 2 ] ] return MIN(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////
    
    testMin3 : function () {
      var expected = [ 2, false, false, false, false, true, -1, '', 1 ];
      var actual = getQueryResults("FOR u IN [ [ 3, 2, '1' ], [ [ ], null, true, false, 1, '0' ], [ '0', 1, false, true, null, [ ] ], [ false, true ], [ 0, false ], [ true, 0 ], [ '0', -1 ], [ '', '-1' ], [ [ ], 1 ] ] return MIN(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////

    testMinInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN([ ], 2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN(false)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN(3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MIN({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test max function
////////////////////////////////////////////////////////////////////////////////
    
    testMax1 : function () {
      var expected = [ null, null ]; 
      var actual = getQueryResults("FOR u IN [ [ ], [ null, null ] ] return MAX(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test max function
////////////////////////////////////////////////////////////////////////////////
    
    testMax2 : function () {
      var expected = [ 3, 3, 3, 3, 3, 3 ];
      var actual = getQueryResults("FOR u IN [ [ 1, 2, 3 ], [ 3, 2, 1 ], [ 1, 3, 2 ], [ 2, 3, 1 ], [ 2, 1, 3 ], [ 3, 1, 2 ] ] return MAX(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////
    
    testMax3 : function () {
      var expected = [ '1', [ ], [ ], true, 0, 0, '0', '-1', [ ] ];
      var actual = getQueryResults("FOR u IN [ [ 3, 2, '1' ], [ [ ], null, true, false, 1, '0' ], [ '0', 1, false, true, null, [ ] ], [ false, true ], [ 0, false ], [ true, 0 ], [ '0', -1 ], [ '', '-1' ], [ [ ], 1 ] ] return MAX(u)", true);
      assertEqual(expected, actual);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test min function
////////////////////////////////////////////////////////////////////////////////

    testMaxInvalid : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_NUMBER_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX([ ], 2)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX(null)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX(false)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX(3)")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX(\"yes\")")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH.code, getErrorCode(AHUACATL_RUN("RETURN MAX({ })")));
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test non-existing functions
////////////////////////////////////////////////////////////////////////////////

    testNonExisting : function () {
      assertEqual(errors.ERROR_QUERY_FUNCTION_NAME_UNKNOWN.code, getErrorCode(AHUACATL_RUN("RETURN FOO()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_NAME_UNKNOWN.code, getErrorCode(AHUACATL_RUN("RETURN BAR()")));
      assertEqual(errors.ERROR_QUERY_FUNCTION_NAME_UNKNOWN.code, getErrorCode(AHUACATL_RUN("RETURN PENG(true)")));
    }

  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief executes the test suite
////////////////////////////////////////////////////////////////////////////////

jsunity.run(ahuacatlFunctionsTestSuite);

return jsunity.done();

// Local Variables:
// mode: outline-minor
// outline-regexp: "^\\(/// @brief\\|/// @addtogroup\\|// --SECTION--\\|/// @page\\|/// @}\\)"
// End:
