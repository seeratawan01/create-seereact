import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const handlebars = require('handlebars')
import Listr from 'listr';
import { projectInstall } from 'pkg-install';


const access = promisify(fs.access);

const CURR_DIR = process.cwd();

function copyTemplateFiles(options) {
    try {
        fs.mkdirSync(`${CURR_DIR}/${options.projectName.toLowerCase()}`);
        return createDirectoryContents(options.templateDirectory, options.projectName.toLowerCase());
    } catch (err) {
        console.log(err)
        console.error('%s already exist', options.projectName.toLowerCase());
        process.exit(1);
    }

}

// list of file/folder that should not be copied
const SKIP_FILES = ['node_modules'];
function createDirectoryContents(templatePath, projectName) {

    const filesToCreate = fs.readdirSync(templatePath);
    filesToCreate.forEach(file => {
        const origFilePath = path.join(templatePath, file);
        // get stats about the current file
        const stats = fs.statSync(origFilePath);
        if (SKIP_FILES.indexOf(file) > -1)
            return;
        if (stats.isFile()) {

            let myfile = fs.readFileSync(origFilePath, 'utf8');
            const writePath = path.join(CURR_DIR, projectName, file);

            if (file === "favicon.ico" || file === "logo.png") {
                fs.writeFileSync(writePath, myfile, 'utf8');
            } else {
                const template = handlebars.compile(myfile)
                const contents = template({
                    projectName: projectName
                })
                fs.writeFileSync(writePath, contents, 'utf8');
            }

        }
        else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(CURR_DIR, projectName, file));
            // recursive call
            createDirectoryContents(path.join(templatePath, file), path.join(projectName, file));
        }
    });
}

export async function createProject(options) {

    const currentFileUrl = import.meta.url;

    // Windows Hack
    const templateDir = path.resolve(
        new URL(currentFileUrl).pathname.substring(new URL(currentFileUrl).pathname.indexOf('/') + 1),
        '../../templates/default'
    );

    options.templateDirectory = templateDir;

    options = {
        ...options,
        targetDirectory: `${CURR_DIR}/${options.projectName.toLowerCase()}`,
    };

    console.log(options.targetDirectory)

    try {
        await access(templateDir, fs.constants.R_OK);

    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    // console.log('Copy project files');
    // await copyTemplateFiles(options);


    const tasks = new Listr([
        {
            title: 'Copying Boilerplate files',
            task: () => copyTemplateFiles(options),
        },
        {
            title: 'Install dependencies',
            task: () =>
                projectInstall({
                    cwd: options.targetDirectory,
                })
        },
    ]);

    await tasks.run();

    console.log('%s Project ready', chalk.green.bold('DONE'));
    return true;
}

