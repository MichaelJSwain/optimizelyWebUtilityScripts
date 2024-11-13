const inquirer = require("inquirer");
const fs = require("fs");

const prompt = inquirer.createPromptModule();
prompt([
    {
        type: "input",
        name: "expID",
        message: "Experiment ID:"
    },
    {
        type: "input",
        name: "expName",
        message: "Experiment Name:"
    },
    {
        type: "input",
        name: "variants",
        message: "Number of variants (including control):"
    }
]).then((answers) => {
    const {expID, expName, variants} = answers;

    const baseFolderName = `./experiments/${expID}`;
    for (let i = 0; i < variants; i++) {
        const folderName = `${baseFolderName}/variant${i}`;

        try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, {recursive: true});
            createFile(`${folderName}/index.js`, ``);
            createFile(`${folderName}/index.css`, ``);
            createFile(`${baseFolderName}/activation.js`, `function callback() {console.log("callback")}`);
            createFile(`${baseFolderName}/config.js`, `                    {
                        state: 'QA',
                        id: ${expID},
                        name: ${expName}
                    }`);
            // fs.writeFile(`${folderName}/index.js`, `{"pro1": "value1"', "prop2": "value2"}`, (err,res) => {
            //     if(err) console.log(err);
            //     console.log(res);
            // });
            // fs.writeFile(`${folderName}/index.css`, ``, (err,res) => {
            //     if(err) console.log(err);
            //     console.log(res);
            // });
            // fs.writeFile(`${baseFolderName}/activation.js`, `function callback() {console.log("activation callback")}`, (err,res) => {
            //     if(err) console.log(err);
            //     console.log(res);
            // });
            // fs.writeFile(`${baseFolderName}/config.js`, `
                    // {
                    //     state: 'QA',
                    //     id: ${expID},
                    //     name: ${expName}
                    // }
            //     `, (err,res) => {
            //     if(err) console.log(err);
            //     console.log(res);
            // });
        }
        } catch (err) {
        console.error(err);
        }
    }
});

const createFile = (path, body) => {
    fs.writeFile(path, body, (err,res) => {
        if(err) console.log(err);
    });
}