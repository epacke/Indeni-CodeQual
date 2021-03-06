"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const child = require("child_process");
const process = require("process");
const fs = require("fs");
const CommandRunnerParseOnlyResult_1 = require("./results/CommandRunnerParseOnlyResult");
const CommandRunnerTestRunResult_1 = require("./results/CommandRunnerTestRunResult");
const CommandRunnerTestCreateResult_1 = require("./results/CommandRunnerTestCreateResult");
class CommandRunner {
    constructor() {
        this.errors = [];
        this.commandrunner_path = undefined;
        this.commandrunner_uri = undefined;
        this.commandrunner_user = undefined;
        this.commandrunner_password = undefined;
        this.commandrunner_path = vscode.workspace.getConfiguration().get('indeni.commandRunnerPath');
        this.commandrunner_user = vscode.workspace.getConfiguration().get('indeni.commandRunnerUser');
        this.commandrunner_password = vscode.workspace.getConfiguration().get('indeni.commandRunnerPassword');
        if (this.commandrunner_path !== undefined) {
            this.commandrunner_uri = vscode.Uri.file(this.commandrunner_path);
        }
    }
    verify_command_runner_path() {
        let result = false;
        if (this.commandrunner_path !== undefined) {
            if (fs.existsSync(this.commandrunner_path)) {
                result = true;
            }
        }
        if (!result) {
            vscode.window.showErrorMessage('Command runner path not specified. Please do so in application settings');
        }
        return result;
    }
    RunFullCommand(input_filename, ip_address, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        if (this.commandrunner_user === undefined) {
            this.commandrunner_user = '';
        }
        if (this.commandrunner_password === undefined) {
            this.commandrunner_password = '';
        }
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + ` full-command --ssh ${this.commandrunner_user},${this.commandrunner_password} --basic-authentication ${this.commandrunner_user},${this.commandrunner_password} ` + this.escape_filename(input_filename) + " " + ip_address;
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, ip_address, stdout));
        });
    }
    RunParseOnly(filename, input_filename, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        if (this.commandrunner_uri === undefined) {
            return;
        }
        child.exec(this.escape_filename(this.commandrunner_uri.fsPath) + " parse-only " + this.escape_filename(filename) + " -f " + this.escape_filename(input_filename), (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, filename, stdout));
        });
    }
    CreateTestCaseAsync(split_script) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!split_script.is_valid_script) {
                return Promise.reject('Invalid script');
            }
            if (this.commandrunner_uri === undefined) {
                return Promise.reject('Invalid command-runner path');
            }
            let case_name = undefined;
            yield vscode.window.showInputBox({ placeHolder: 'New test case name' }).then(value => {
                case_name = value;
            });
            if (case_name === undefined) {
                return Promise.reject('No test case name selected');
            }
            let test_case_map = {};
            const items = [];
            let test_cases = split_script.get_test_cases();
            if (test_cases !== undefined) {
                for (let t_case of test_cases) {
                    if (t_case.name !== undefined && t_case.input_data_path !== undefined) {
                        items.push({ label: t_case.name });
                        test_case_map[t_case.name] = t_case.input_data_path;
                    }
                }
                items.push({ label: 'Browse...' });
            }
            let input_filename = yield vscode.window.showQuickPick(items, { placeHolder: 'Select existing input file or browse for new' });
            if (input_filename === undefined) {
                return Promise.reject('No input file specified');
            }
            let input_data_path = undefined;
            if (input_filename.label !== 'Browse...') {
                input_data_path = test_case_map[input_filename.label];
            }
            else {
                let path = yield vscode.window.showOpenDialog({ canSelectFolders: false, canSelectMany: false, openLabel: 'Select input file...' });
                if (path !== undefined) {
                    {
                        if (path.length > 0) {
                            input_data_path = path[0].fsPath;
                        }
                    }
                }
            }
            if (input_data_path === undefined) {
                return Promise.reject('No input file speficied');
            }
            let script_filename = split_script.header_section !== undefined ? split_script.header_section.filename : '';
            let command = "test create " + this.escape_filename(script_filename) + " " + case_name + " " + this.escape_filename(input_data_path);
            let result = yield this.RunCommandRunner(command);
            return Promise.resolve(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(result));
        });
    }
    GetVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                this.RunCommandRunner('--version').then(value => {
                    //command-runner: a command line tool for executing collector commands, version: 6.0.62
                    let regex_match = /version:\s+(.+)/g;
                    let match = regex_match.exec(value);
                    if (match) {
                        vscode.window.showInformationMessage('Command-runner version: ' + match[1]);
                    }
                });
            });
        });
    }
    RunCommandRunner(command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.commandrunner_uri === undefined || !this.verify_command_runner_path()) {
                return Promise.reject('Invalid command-runner path');
            }
            command = this.escape_filename(this.commandrunner_uri.fsPath) + ' ' + command;
            return new Promise(resolve => {
                child.exec(command, (error, stdout, stderr) => {
                    resolve(stdout);
                });
            });
        });
    }
    CreateTestCase(script_filename, case_name, input_filename, callback) {
        if (!this.verify_command_runner_path || this.commandrunner_uri === undefined) {
            return new Promise(reject => new Error('No command runner path defined'));
        }
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + " test create " + this.escape_filename(script_filename) + " " + case_name + " " + this.escape_filename(input_filename);
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(stdout));
        });
    }
    RunTests(filename, selected_case, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + " test run " + this.escape_filename(filename);
        if (selected_case !== undefined) {
            command = this.escape_filename(this.commandrunner_uri.fsPath) + " test run " + this.escape_filename(filename) + " -c " + selected_case;
        }
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerTestRunResult_1.CommandRunnerTestRunResult(stdout));
        });
    }
    escape_filename(filename) {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
    }
}
exports.CommandRunner = CommandRunner;
//# sourceMappingURL=CommandRunner.js.map