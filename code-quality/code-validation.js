'use strict';

// Adding functions:
// Each function must have the following properties.
// 1. testName: Shown in the test results.
// 2. reason: Shown in the popup.
// 3. severity: Which color the test result should have (recommendation = blue, warning = orange, error = red)
// 4. applyToSections: Which sections the function should apply to.
// 5. mark = A function which takes section content as parameter and returns modified matched content.

// Note:
// When adding functions, remember to add space before and after the "=", or the tests might trigger when using the "show all button"

// This list contains valid name prefixes for scripts
var indeniScriptNamePrefixes = ["chkp", "f5", "panos", "nexus", "radware", "junos", "ios", "fortios", "cpembedded", "bluecoat", "linux", "unix"];

var codeValidationFunctions = {
    "validScriptNamePrefix": new function(){

        // Prefixes is important not only to distinguish which type of device the script is executed on
        // but also to avoid script name collisions. 
        // This is just a recommendation.
        // Example of an offending line: 
        //name: sausage-metric

        this.testName = "Valid script name prefix";
        this.reason = "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.";
        this.severity = "error";
        this.applyToSections = ["meta"];

        this.mark = function(content){

            var scriptNameRow = content.match(/^name:.*$/m);

            if(scriptNameRow.length === 1){

                var scriptName = scriptNameRow[0].split(" ")[1];
                var prefix = scriptName.replace(/-.+$/, "");

                if(indeniScriptNamePrefixes.indexOf(prefix) === -1){
                    var re = new RegExp(scriptName);
                    content = content.replace(re, getSpan(this.severity, this.reason, "$&"));
                }
            }

            return content;
        }
    },
    "genericSpaceBeforeAndAfter": new function(){

        // Space before and after curly brackets and parenthesis makes the code less compact and more readable
        // This is just a recommendation.
        // Example of an offending line: 
        //#if(something == "1"){
        ///A regexp/ {

        this.testName = "Space <3";
        this.reason = "Space in certain places makes the code look nicer.";
        this.severity = "recommendation";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/if\(|\){|}else|else{/g, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "spaceBeforeExample": new function() {

        // Space before examples maybe looks nice, but it's far from exact
        // Example of an offending line: 
        //# my_example
        ///A regexp/ {

        this.testName = "Space before example";
        this.reason = "Space before examples maybe looks nice, but it's far from exact, unless the input file actually has one. Consider removing this space unless yours does.";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/(\# .+)(\n\/.+\/\s*{\n)/g, getSpan(this.severity, this.reason, "$1") + "$2");
        }
    },
    "variableNamingConventions": new function (){

        // Variables should use snake case (snake_case)
        // Example of an offending line: 
        //myVariable = 1
        //my-variable = 1

        this.testName = "Variable naming";
        this.reason = "Most people use snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/([a-z][A-Z][a-z]{0,}\s*=\s*|\-[a-zA-Z]+\s*=\s*)/gm, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "emptyBEGINSection": new function (){
        // Empty BEGIN sections serves no purpose and should be disposed of.
        // Example of an offending line: 
        //END {
        //    
        //}

        this.testName = "Empty BEGIN";
        this.reason = "Empty BEGIN sections serves no purpose and should be disposed of.";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/BEGIN {\s*}/g, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "emptyENDSection": new function (){

        // Empty END sections serves no purpose and should be disposed of.
        // Example of an offending line: 
        //END {
        //    
        //}

        this.testName = "Empty END";
        this.reason = "Empty END sections serves no purpose and should be disposed of.";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/END {\s*}/g, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "writeDebugExists": new function(){

        // writeDebug is great for troubleshooting, but code with that command should never reach customers.
        // Example of an offending line: 
        //writeDebug("this is a debug")

        this.testName = "writeDebug()";
        this.reason = "writeDebug() (or debug()) are great for troubleshooting, but code with that function should never reach customers.";
        this.severity = "error";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/writeDebug\(.+\)|debug\(.+\)/gm, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "ifContainsSingleEqualSign": new function (){

        // Single equal sign in an if is always true and the cause of bugs
        // Example of an offending line: 
        //if (variable = 1) { 

        this.testName = "If statement with single equal sign";
        this.reason = "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.";
        this.severity = "error";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/if\s*?\([^=]+[^=!]={1}[^=].+\)/gm, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "columnVariableManipulation": new function (){

        // Changing column values is potentially the cause of bugs and should be avoided
        // Example of an offending line:
        // variable = test   

        this.testName = "Column variable manipulation";
        this.reason = "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.<br>It is highly recommended to instead save the column value to a variable and change that.";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/g{0,1}sub.+?(\$[0-9])+/gm, getSpan(this.severity, this.reason, "$&"));
        }
    },
    "trailingWhiteSpace": new function() {

        //Trailing white space serves no purpose
        // Example of an offending line:
        // variable = test   

        this.testName = "Trailing White-Space";
        this.reason = "Trailing white space serves no purpose and should be removed.";
        this.severity = "error";
        this.applyToSections = ["awk", "yaml"];

        this.mark = function(content){
            return content.replace(/[ \t]+$/gm, getSpan(this.severity, this.reason, "$&"))
        }

    },
    "leadingTab": new function () {

        // Tabs should not be used for indentation
        // Example of an offending line:
        //  variable = test

        this.testName = "Leading tabs";
        this.reason = "Tabs should not be used for indentation, please configure your editor to use space for indentation.";
        this.severity = "error";
        this.applyToSections = ["awk", "yaml"];

        this.mark = function(content){
            return content.replace(/^[\t]+/gm, getSpan(this.severity, this.reason, "$&"))
        }

    },
    "comparisonOperatorNoSpace": new function () {

        // A comparison operator should almost always be followed by a space (unless it is a regexp)
        // Example of an offending line:
        // variable=test

        this.testName = "Equals sign without space";
        this.reason = "The equals sign and other comparison operators should be followed by space to make the code more readable.<br>Exceptions to this are regexp and bash scripts.";
        this.severity = "error";
        this.applyToSections = ["awk"];
        this.pattern = /([^ =!<>~\n]{1}([=!<>~]{1,2})[^ \n]{1})|(([^ =!<>~\n]{1})([=!<>~]{1,2}))|(([=!<>~]{1,2})[^ =!<>~\n]{1})/gm;
        this.mark = function(content){
            return content.replace(this.pattern, getSpan(this.severity, this.reason, "$&"));
        }

    },
    "commaWithoutSpace": new function () {

        // A comma should always be followed by a space (unless it is a regexp)
        // Example of an offending line:
        // writeDoubleMetric("debug-status",debugtags,"gauge",3600,state)

        this.testName = "Comma without space";
        this.reason = "Commas signs should be followed by space to make the code more readable.<br>Exceptions to this are regexp and bash scripts.";
        this.severity = "error";
        this.applyToSections = ["awk"];
        this.pattern = /(,)[^ \/]/gm;

        this.mark = function(content){
            return content.replace(this.pattern, getSpan(this.severity, this.reason, "$&"))
        }

    },
    "tildeWithoutSpace": new function () {

        // A "~" should always be followed by a space (unless it is a regexp)
        // Example of an offending line:
        // writeDoubleMetric("debug-status",debugtags,"gauge",3600,state)

        this.testName = "Tilde without space";
        this.reason = "Tilde signs should be followed by space to make the code more readable.<br>Exceptions to this are regexp.";
        this.severity = "error";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/([^ \n]{1}(~)[^ \n]{1})|(([^ \n]{1})(~))|((~)[^ \n]{1})/, getSpan(this.severity, this.reason, "$&"));
        }

    },
    "tildeWithoutRegexpNotation": new function (){

        // Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).
        // Example of an offending line:
        // writeDoubleMetric("debug-status",debugtags,"gauge",3600,state)

        this.testName = "Tilde without regexp notation";
        this.reason = "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).";
        this.severity = "warning";
        this.applyToSections = ["awk"];

        this.mark = function(content){
            return content.replace(/(~\s)(\")/gm, "$1" + getSpan(this.severity, this.reason, "$2"));
        }

    },
    "invalidYAMLHeadingSpace": new function () {

        // This controls if your YAML script has invalid indentation
        // Since indentation is 4 spaces having a number not divideable 
        // by 4 would cause an error
        //
        // Example of an offending line:
        //       skip-documentation: true

        this.testName = "Invalid YAML white-space";
        this.reason = "Since indentation in YAML is 4 spaces having a number not divisible by 4 would cause an error in most cases.";
        this.severity = "error";
        this.applyToSections = ["yaml"];

        this.mark = function(content){

            var results = [];

            content.split("\n").map(function(line){
                if (line.search(/\S/) % 4) {
                    line = line.replace(/^([ ]+)([^ ])/, getSpan(this.severity, this.reason, "$1") + "$2")
                }
                results.push(line);
            }, this);

            return results.join("\n");
        }
    },
    "lowerCaseDescription": new function  () {

        // Simply for good manners
        // Example of an offending line:
        // description: grab some data from the device

        this.testName = "Description begins in lower case";
        this.reason = "In the english language, it's good practice to begin sentences with upper case.";
        this.severity = "error";
        this.applyToSections = ["meta"];

        this.mark = function(content){
            return content.replace(/^(description:\s+)([a-z]+)/gm, "$1" + getSpan(this.severity, this.reason, "$2"));
        }

    },
    "monitoringIntervalAbove60": new function () {

        // We have had a bug in the platform with scripts running with intervals of more than 60 minutes
        //
        // Example of an offending line:
        // monitoring_interval: 61 minutes

        this.testName = "Monitoring interval over 60";
        this.reason = "Due to a platform bug we don't support intervals over 1 hour.";
        this.severity = "error";
        this.applyToSections = ["meta"];

        this.mark = function(content){

            return content.replace(/([6-9][1-9][0-9]*? (minute)[s]{0,1})|([2-9][0-9]*? hour[s]{0,1})/gm, getSpan(this.severity, this.reason, "$&"))
        }
    },
    "verifyAwkDocumentation": new function() {

        // This function is a bit special as it it does not only parse and mark, it also compares data from different sections
        // If you're looking for examples, this is not it

        this.testName = "Undocumented/Unused metrics";
        this.reason = "The documentation section should have one entry per metric used in the script, and the script should use all documented metrics.";
        this.severity = "error";
        this.applyToSections = ["script"];

        this.mark = function(content, getSections){

            var documentedMetrics = getDocumentedMetrics(content, getSections);
            var matches = content.match(/write(Double|Complex)[^\(]+\(\"[^\"]+|im\.name\":\s*_constant:\s\"[^\"]+/gm) || [];
            var usedMetrics = [];

            // Check if there are any metrics being used that has not been documented
            matches.map(function(m){

                var metric = m.replace(/.+\(\"|im\.name\":\s*_constant:\s\"/, "");
                usedMetrics.push(metric);

                if(documentedMetrics.indexOf(metric) === -1){
                    content = content.replace(metric, getSpan(this.severity, "This metric has not been documented in the COMMENTS section.", "$&"));
                }

            }, this);

            // Check if there's any metrics that has been documented, but not used
            documentedMetrics.map(function(m){
                if(usedMetrics.indexOf(m) === -1){
                    content = content.replace(m, getSpan(this.severity, "This metric is documented but not used in the script. Please consider removing it.", "$&"));
                }
            }, this);

            return content;
        }
    },
    "onlyWriteMetricOnce": new function() {

        // Metrics should only be written once according to:
        // https://indeni.atlassian.net/wiki/spaces/IKP/pages/81794466/Code+Review+Pull+Requests

        this.testName = "Metric written more than once";
        this.reason = "Each metric should only be written in one place. If the metric has been written more than once this test fails.";
        this.severity = "recommendation";
        this.applyToSections = ["awk"];

        this.mark = function(content){

            var matches = content.match(/write(Double|Complex)[^\(]+\(\"[^\"]+|im\.name\":\s*_constant:\s\"[^\"]+/gm) || [];
            var usedMetrics = [];

            // Check if there are any metrics being used that has not been documented
            matches.map(function(m){

                var metric = m.replace(/.+\(\"|im\.name\":\s*_constant:\s\"/, "");

                if(usedMetrics.indexOf(metric) !== -1){

                    //This metric has already been written. Mark it.
                    var re = new RegExp(metric, "g");
                    content = content.replace(re, getSpan(this.severity, this.reason, "$&"));

                }

                usedMetrics.push(metric);

            }, this);

            return content;
        }
    },
    "resourceDataCheck": new function(){

        // includes_resource_data means that the script is always executed by indeni, even during high CPU usage
        // but also to avoid script name collisions. 
        // This is just a recommendation.
        // Example of an offending line: 
        //name: sausage-metric

        this.testName = "Resource data validation";
        this.reason = "includes_resource_data means that the script is always executed by indeni, even during high CPU usage. It has to be included for scripts using the cpu-usage and/or memory-usage metrics.<br><br>\
                       If this check fails it means that you have specified includes_resource_data, but not used the metrics, or that you have used cpu-usage and/or memory-usage without including includes_resource_data in the meta section.";
        this.severity = "error";
        this.applyToSections = ["script"];

        this.mark = function(content, getSections){

            var sections = getSections(content);

            if (sections.hasOwnProperty("meta")){

                // Check if the script meta section has resource data
                var hasIncludesResourceData = sections["meta"].content.match(/^includes_resource_data:\s*true$/m) !== null;
                var parserData = sections["json"] || sections["awk"] || sections["xml"];

                if (parserData !== undefined){

                    //var parserContent = parserData.content;

                    var matches = content.match(/write(Double|Complex)[^\(]+\(\"[^\"]+|im\.name\":\s*_constant:\s\"[^\"]+/gm) || [];
                    var usedMetrics = [];

                    // Check if there are any metrics being used that has not been documented
                    matches.map(function(m){

                        var metric = m.replace(/.+\(\"|im\.name\":\s*_constant:\s\"/, "");

                        if ((metric === "cpu-usage" || metric === "memory-usage") && !hasIncludesResourceData){
                            content = content.replace(/cpu\-usage|memory\-usage/g, getSpan(this.severity, "This tag would normally require include_resource_data in the meta section.", "$&"))
                        }

                        usedMetrics.push(metric);

                    }, this);

                }

                // If include resource data  has been used but no resource data metric has been defined
                if (hasIncludesResourceData && usedMetrics.indexOf("cpu-usage") === -1 && usedMetrics.indexOf("memory-usage") === -1) {
                    content = content.replace(/^includes_resource_data:.+$/m, getSpan(this.severity, "Resource data has been used but no metrics that require it seem to exist.", "$&"));
                }

            }

            return content
        }
    }
};

function getDocumentedMetrics(content, getSections){

    var scriptSections = getSections(content);
    var documentedMetrics = [];

    if (scriptSections.hasOwnProperty("comments")) {

        var documentationSection = scriptSections.comments.content;

        documentationSection.match(/^[a-zA-Z0-9\-]+/gm).map(function(m){
            documentedMetrics.push(m);
        })

    }

    return documentedMetrics;
}


// Returns a span element with the severity, reason and content that was specified in the parameters
function getSpan(severity, reason, content){
    return "<span class = \"" + severity + "\" title = \"" + reason + "\">" + content + "</span>"
}

// These lines are to support the unit test framework. That framework uses node.js, which uses "requires" to import
// code. Since we're not using node for the actual web code, we need to protect this use of "exports", otherwise
// we'll get an error on page load. Take a look at the test cases in /test to see how we use this.
if (typeof(exports) !== 'undefined' && exports !== null)
{
    exports.validationFuncs = codeValidationFunctions;
}
