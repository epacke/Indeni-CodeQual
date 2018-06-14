'use strict';

// This function gets the different sections from the script
// A section could be meta, comments, awk, json, xml.
// This function needs some coding love.
var getScriptSections = function(content){
    var section = {};

    // The section variable contains the content of the different sections
    // and some meta data about them.

    // Example:
    // section.meta = {}
    // section.meta.content = <Content of the script META section>
    // section.meta.apply = <List of the type of checks you want to apply to this section>

    //Note: The apply section is later matched to the function property "applyToSections" above.

    // This is for parsing that is applied to the whole script
    section.script = {};
    section.script.content = content;
    section.script.apply = ["script"];

    // Parse for the META section
    var regexResult = /#! META\n([.\S\s]+?)#!/g.exec(content);

    // Verify that we got the match we're looking for
    if(regexResult != null && regexResult.length === 2){
        section.meta = {};
        section.meta.content = regexResult[1];
        section.meta.apply = ["yaml", "meta"];
    }

    regexResult = /#! COMMENTS\n([.\S\s]+?)#!/g.exec(content);

    if(regexResult != null && regexResult.length === 2){
        section.comments = {};
        section.comments.content = regexResult[1];
        section.comments.apply = ["yaml", "comments"];
    }

    regexResult = /#! PARSER::AWK.*\n([.\S\s]+?)$/g.exec(content);

    if(regexResult != null && regexResult.length === 2){
        section.awk = {};
        section.awk.content = regexResult[1];
        section.awk.apply = ["awk"]
    }

    regexResult = /#! PARSER::JSON.*\n([.\S\s]+?)$/g.exec(content);

    if(regexResult != null && regexResult.length === 2){
        section.json = {};
        section.json.content = regexResult[1];
        section.json.apply = ["json", "yaml"]
    }

    regexResult = /#! PARSER::XML.*\n([.\S\s]+?)$/g.exec(content);

    if(regexResult != null && regexResult.length === 2){
        section.xml = {};
        section.xml.content = regexResult[1];
        section.xml.apply = ["xml", "yaml"]
    }

    return section;
};

// These lines are to support the unit test framework. That framework uses node.js, which uses "requires" to import
// code. Since we're not using node for the actual web code, we need to protect this use of "exports", otherwise
// we'll get an error on page load. Take a look at the test cases in /test to see how we use this.
if (typeof(exports) !== 'undefined' && exports !== null)
{
    exports.getScriptSections = getScriptSections;
}