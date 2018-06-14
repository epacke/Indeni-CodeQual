'use strict';
var fs = require('fs');
var test = require('tape');
var mark = require('../code-quality/indeni-js-support.js');
var valid = require('../code-quality/code-validation.js');
var sections = require('../code-quality/common.js');

/********
 *  IMPORTANT: The .ind test input files for these tests must have *nix line endings (lf) to work properly with the tests.    
 ********/

function setup() {
    var functions = [];
    for(var f in valid.validationFuncs){
        functions.push(valid.validationFuncs[f])
    }
    return functions;
}

test('test a full script where everything is good', function (t) {
    fs.readFile('./resources/full-script-happy-path.ind', "utf8", function (err, data) {
        t.equals(mark.marker(setup(), data, sections.getScriptSections), data, "happy path");
        t.end();
    });
});

test('test a full script that has every error, warning, and suggestion', function (t) {
    fs.readFile('./resources/full-script-every-error-warning-suggestion.ind', "utf8", function (err1, inputScript) {
        fs.readFile('./resources/baselines/full-script-every-error-warning-suggestion_marked.ind', "utf8", function (err2, expectedScript) {
            /*
            TODO: NOTE: inputScript is only AWK -- no JSON/XML tests yet.
            
            This test tries to generate every possible error, warning, and suggestion, and validate that they all got
            generated. The "inputScript" is an .ind script with all of the problems. This test runs the validation
            functions against the script: each function runs against any section of the script that the function
            applies to.
            Every run of every function runs against a "clean version" of a given section; i.e., the test never runs
            a validation function, and then runs another function against the output of the first: doing this generates
            false positives.
            Each function run generates a marked-up output that gets appended to "modifiedContent". At the end of the test,
            the entire string is compared with the expected content, content which has been read in from a file.
             */
            
            // We need to take special care here to make sure all of the "controlling" iteration arrays are in order:
            // the entire test depends on everything always being in the same order (if we just iterate over the JS keys
            // without sorting, order is not guaranteed.
            const scriptSections = sections.getScriptSections(inputScript);
            const orderedSections = Object.keys(scriptSections).sort();
            const funcNames = Object.keys(valid.validationFuncs).sort();
            var modifiedContent = "";
            funcNames.map(function (funcName) { 
                const validator = valid.validationFuncs[funcName];
                validator.applyToSections.map(function (funcAppliesTo){
                    orderedSections.map(function (sectionType) {
                        if (scriptSections[sectionType].apply.indexOf(funcAppliesTo) !== -1){
                            var sectionContent = scriptSections[sectionType].content;
                            const updated = sectionContent.replace(sectionContent, validator.mark(sectionContent, sections.getScriptSections)) + "\n"; 
                            modifiedContent += funcName + ": " + sectionType + "\n" + updated + "\n\n";
                        }
                    });
                });
            });
            // Uncomment the lines below if you need to update the baseline of this test. The basic process should be:
            // Uncomment; run the test; diff the new baseline against the old one to make sure only the things you want
            // have changed; RE-COMMENT THE LINES BELOW!; re-run the test.
/*
            fs.writeFile('./resources/baselines/full-script-every-error-warning-suggestion_marked.ind', modifiedContent, "utf8", function (err) {
                if (err) throw err;
            });
*/
            t.equals(modifiedContent, expectedScript, "all errors");
            t.end();
        });
    });
});