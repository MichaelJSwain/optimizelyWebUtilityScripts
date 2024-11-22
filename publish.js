const fs = require("fs");
require('dotenv').config()
const {OPTLY_TOKEN} = process.env;
const localeExpID = process.argv[2];
console.log("publishing...", localeExpID);

const publishPage = () => {
    if (localeExpID) {
        fs.readFile(`./experiments/${localeExpID}/TH/config.json`, "utf-8", (err, data) => {
            const {projectID, pageID, expID} = JSON.parse(data);
            fs.readFile(`./experiments/${localeExpID}/TH/targeting/conditionalActivation.js`, "utf-8", (err, data) => {
                if (err) throw err;
                console.log(data);
                const options = {
                    method: 'PATCH',
                    headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: OPTLY_TOKEN
                    },
                    body: JSON.stringify({activation_code: `${data}`, activation_type: 'callback'})
                };
                
                fetch(`https://api.optimizely.com/v2/pages/${pageID}`, options)
                    .then(res => res.json())
                    .then(res => console.log(res))
                    .catch(err => console.error(err));
            }); 
        });
    }
}
publishPage();

const publishExperiment = () => {
    
}

