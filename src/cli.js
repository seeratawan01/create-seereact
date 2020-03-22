#!/usr/bin/env node

import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {

        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        projectName: args._[0],

    };
}

async function promptForMissingOptions(options) {


    const questions = [];

    if (!options.projectName) {
        questions.push({
            type: 'string',
            name: 'projectName',
            message: 'Please Enter Project Name: ',
            default: "MyReactApp",
            validate: function (input) {
                if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
                else return 'Project name may only include letters, numbers, underscores and hashes.';
            }

        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        projectName: options.projectName || answers.projectName,
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    // console.log(options)
    await createProject(options);
}