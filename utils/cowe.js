const fs = require("fs");
const fsp = fs.promises;
const args = process.argv;
require('dotenv').config()
const { OPTLY_TOKEN } = process.env;

const userInput = (args[2] && 
    args[2].toUpperCase().includes("CX") &&
    args[3] &&
    (args[3].toUpperCase() === "TH" ||
    args[3].toUpperCase() === "CK" )) ? {expID: args[2], brand: args[3]} : false;


const getConfigFile = async (expID, brand) => {
    let configFile = await fsp.readFile(
      `./experiments/${expID}/${brand}/config.json`,
      "binary"
    );
    configFile = JSON.parse(configFile);
    return configFile;
};

// const getVariantCode = async (path) => {
// let code = await fsp.readFile(`./experiments${path}`, "binary");
// };

const getConfigValues = async (configFilecopy) => {

const data = {
    id: configFilecopy.id,
    name: configFilecopy.name,
    brand: configFilecopy.brand,
    projectID: configFilecopy.projectID,
    activation: configFilecopy.activation,
    variants: [...configFilecopy.variants],
    optimizelyPageID: configFilecopy.OptimizelyPageID,
    optimizelyExperimentID: configFilecopy.OptimizelyExperimentID,
};

console.log("data obj = ", data);
const variantsArr = [];
// get variant code
for (const variant of data.variants) {
    const v = {name: variant.name, js: "", css: ""};
    v.js = await fsp.readFile(
    `./experiments${variant.js}`,
    "binary"
    );
    
    v.css = await fsp.readFile(
    `./experiments${variant.css}`,
    "binary"
    );
    variantsArr.push(v)
    // variant.js = variantJS;
    // variant.css = variantCSS;
}

data.variants = variantsArr;

// get activation code
const activationCode = await fsp.readFile(
    `./experiments/${data.id}/${data.brand}/targeting/${data.activation}`,
    "binary"
);
data.activation = activationCode;
return data;
};



  const createOptimizelyPage = async ({ id, name, projectID, activation }) => {
    if (id && name && projectID) {
      const pageName = `${id} - ${name}`;
      const body = {
        archived: false,
        category: "other",
        activation_code: `function callback() {}`,
        edit_url: "https://uk.tommy.com/women",
        name: `${pageName}`,
        project_id: projectID,
        activation_type: "callback",
      };

      const optimizelyPage = await postToOptimizely(
        body,
        "https://api.optimizely.com/v2/pages"
      );
      return optimizelyPage.id ? optimizelyPage.id : false;
    }
  };

  const createOptimizelyExperiment = async (
    expName,
    pageID,
    projectID,
    variants
  ) => {
    const variantsArray = [];
 

    variants.forEach((variant) => {
        const variantActions = variant.js || variant.css ? [{
            changes: [],
            page_id: pageID
        }] : [{
            page_id: pageID
        }]
        if (variant.js) {
            variantActions[0].changes.push({
                type: "custom_code",
                value: `${variant.js}`,
                async: false,
              });
        }
        if (variant.css) {
            variantActions[0].changes.push({ type: "custom_css", value: `${variant.css}` });
        }
        
      const variantData = {
        name: variant.name,
        status: "active",
        weight: Math.round(10000 / variants.length),
        description: "variant description",
        archived: false,
        actions: variantActions,
      };
      variantsArray.push(variantData);
    });

    const body = {
      audience_conditions: "everyone",
      metrics: [
        {
          aggregator: "sum",
          field: "revenue",
          scope: "visitor",
          winning_direction: "increasing",
        },
      ],
      schedule: { time_zone: "UTC" },
      type: "a/b",
      changes: [
        { type: "custom_code", value: "console.log('test')", async: false },
        { type: "custom_css", value: ".selector {background: 'red'}" },
      ],
      description: "description placeholder",
      name: expName,
      page_ids: [pageID],
      project_id: 14193350179,
      traffic_allocation: 10000,
      variations: variantsArray,
    };

    

    const result = await postToOptimizely(
      body,
      "https://api.optimizely.com/v2/experiments"
    );
    return result;
  };

  const postToOptimizely = async (reqBody, endpoint) => {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: OPTLY_TOKEN,
      },
      body: JSON.stringify(reqBody),
    };

    const res = await fetch(endpoint, options);
    const pageID = await res.json();
    return pageID;
  };

  const cowe = async () => {
    if (userInput) {
        const {expID, brand} = userInput;
        const configFile = await getConfigFile(expID, brand);
        const data = await getConfigValues(configFile);
        if (!data.optimizelyPageID) {
            const pageID = await createOptimizelyPage(data);
            console.log("pageID = ", pageID);
            const optimizelyExperiment = await createOptimizelyExperiment(
            `${data.id} - ${data.name}`,
            pageID,
            data.projectID,
            data.variants
            );
            console.log("returned optly exp = ", optimizelyExperiment);

            configFile.OptimizelyPageID = pageID;
            configFile.OptimizelyExperimentID = optimizelyExperiment.id;
            fs.writeFile(
                `./experiments/${expID}/${brand}/config.json`,
                JSON.stringify(configFile),
                {
                    encoding: "utf8",
                },
                (err) => {
                    if (err) console.log(err);
                    else {
                        console.log("File written successfully\n");
                        console.log("The written file has the following contents:");
                        // console.log(fs.readFileSync("movies.txt", "utf8"));
                    }
                }
            );
        } else {
            console.log("existing page id");
        }

        
            // console.log("updating optimizely page")
            // const updatedConfig = configFile.variants[0];
            // console.log(configFile)
            // configFile.OptimizelyPageID = 82349042390890238490;
            // console.log('config after changes',  JSON.stringify(configFile));
          
            // fs.writeFile(
            //     `./experiments/${expID}/${brand}/config.json`,
            //     JSON.stringify(configFile),
            //     {
            //         encoding: "utf8",
            //     },
            //     (err) => {
            //         if (err) console.log(err);
            //         else {
            //             console.log("File written successfully\n");
            //             console.log("The written file has the following contents:");
            //             // console.log(fs.readFileSync("movies.txt", "utf8"));
            //         }
            //     }
            // );
//               OptimizelyPageID: '',
//   OptimizelyExperimentID: ''
            // create new optimizely page
            // const pageID = await createOptimizelyPage(data);
            // if (pageID) {
            //     const optimizelyExperiment = await createOptimizelyExperiment(
            //     `${data.id} - ${data.name}`,
            //     pageID,
            //     data.projectID,
            //     data.variants
            //     );
            //     console.log("returned optly exp = ", optimizelyExperiment);
            // }
        // } else {
        // }
    }
    };
    cowe();