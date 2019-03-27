"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const SplitScriptAwkSection_1 = require("../../sections/SplitScriptAwkSection");
class UndocumentedMetricsValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super("Metric used has not been documented", CodeValidation_1.FunctionSeverity.error);
        this.markers = [];
    }
    get_markers(script) {
        this.markers = [];
        if (!script) {
            return this.markers;
        }
        if (!script.current_section || !script.header_section) {
            return this.markers;
        }
        if (script.current_section.content_type !== "awk") {
            return this.markers;
        }
        if (script.current_section instanceof SplitScriptAwkSection_1.SplitScriptAwkSection) {
            let awk_section = script.current_section;
            let used_metrics = awk_section.get_metrics();
            let documented_metrics = script.header_section.get_documented_metrics();
            for (let used of used_metrics) {
                let found = false;
                for (let documented of documented_metrics) {
                    if (documented[1] === used[1]) {
                        found = true;
                    }
                }
                if (!found) {
                    this.markers.push(new MarkerResult_1.MarkerResult(used[0], used[0] + used[1].length, "This metric has not been documented in the comments section", this.severity, true, used[1]));
                }
            }
        }
        return this.markers;
    }
}
exports.UndocumentedMetricsValidation = UndocumentedMetricsValidation;
//# sourceMappingURL=UndocumentedMetricsValidation.js.map