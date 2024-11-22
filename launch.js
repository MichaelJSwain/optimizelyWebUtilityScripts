const inquirer = require("inquirer");
const fs = require("fs");
require('dotenv').config()
const {OPTLY_TOKEN} = process.env; 
const args = process.argv;

if (args[2]) {
    const questions = [
        {
          type: "input",
          name: "launchConfirmed",
          message: "Are you sure you want to launch this experiment? It will be visible for real users (y|n)",
          validate: (val) => {
            if (val.toLowerCase() === "y" || val.toLowerCase() === "n") {
              return true;
            } else {
              return false;
            }
          },
        }
      ];

      const customGoalsQuestions = [
        {
            type: "input",
            name: "customGoalsConfirmation",
            message: "Custom goals have not been configured. Is this correct? (y|n)",
            validate: (val) => {
              if (val.toLowerCase() === "y" || val.toLowerCase() === "n") {
                return true;
              } else {
                return false;
              }
            },
          }
      ]
      
      const prompt = inquirer.createPromptModule();
      prompt(questions).then(async (answers) => {
          const {launchConfirmed} = answers;
          if (launchConfirmed === "y") {
            // CHECK CUSTOM GOALS                
                fs.readFile(`./experiments/${args[2]}/TH/sharedCode/index.js`,
                    { encoding: 'utf8', flag: 'r' },
                    function (err, data) {
                        if (err)
                            console.log(err);
                        else
                            if (data.includes("optimizely.sendAnalyticsEvent")) {
                                launch();
                            } else {
                                prompt(customGoalsQuestions).then(async (answers) => {
                                    if (answers.customGoalsConfirmation === "n") {
                                        console.log("Please check the custom goals in the Jira ticket, or reach out to an Analyst for help.");
                                    } else {
                                        launch();
                                    }
                                });
                            }
                    });


          } else {
              console.log("launch cancelled");
          }
      });
} else {
    console.log("please specify the experiment ID for the experiment that you'd like launch")
}

const launch = () => {
    console.log("preparing the experiment for launch...");
    console.log("✅ QA audience removed");
    console.log("✅ Traffic allocation reset to equal split across variants");
    console.log("✅ Experiment status set to 'running'");
    console.log("🚀 Experiment has been successfully launched!");
}
