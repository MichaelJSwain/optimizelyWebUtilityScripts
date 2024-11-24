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

const getCustomCode = async (id, brand, variants, activation) => {
const variantsArr = [];
// get variant code
    for (const variant of variants) {
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
    }

// get activation code
    const activationCallback = await fsp.readFile(
        `./experiments/${id}/${brand}/targeting/${activation}`,
        "binary"
    );

    const result = {
        variants: variantsArr,
        activation: activationCallback
    }
    return result;
};

const createOptimizelyPage = async (expName, projectID, activation) => {
    if (expName && projectID) {
        const body = {
        archived: false,
        category: "other",
        activation_code: `${activation}`,
        edit_url: "https://uk.tommy.com/women",
        name: `${expName}`,
        project_id: projectID,
        activation_type: "callback",
        };
        
        const optimizelyPage = await postToOptimizely(
        body,
        "https://api.optimizely.com/v2/pages"
        );
        return optimizelyPage.id
    }
};

const createVariantActions = (pageID, variants) => {
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
    return variantsArray;
}

  const createOptimizelyExperiment = async (
    expName,
    pageID,
    projectID,
    variants
  ) => {
    const variantsArray = createVariantActions(pageID, variants);

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
      project_id: projectID,
      traffic_allocation: 10000,
      variations: variantsArray,
    };

    const optimizelyExp = await postToOptimizely(
      body,
      "https://api.optimizely.com/v2/experiments"
    );
    return optimizelyExp.id;
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

  const updateConfigFile = (expID, brand, configFile, pageID, experimentID) => {
            configFile.OptimizelyPageID = pageID;
            configFile.OptimizelyExperimentID = experimentID;
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
                    }
                }
            );
  }

  const cowe = async () => {
    if (userInput) {
        const {expID, brand} = userInput;
        const configFile = await getConfigFile(expID, brand);
        const {name, variants, activation, projectID, OptimizelyPageID, OptimizelyExperimentID} = configFile;

        if (!OptimizelyExperimentID) {
          const expName = `${expID} - ${name}`;
          const customCode = await getCustomCode(expID, brand, variants, activation);
          
          if (!OptimizelyPageID) {
              const pageID = await createOptimizelyPage(expName, projectID, customCode.activation);
              const experimentID = await createOptimizelyExperiment(
              expName,
              pageID,
              projectID,
              customCode.variants
              );
              updateConfigFile(expID, brand, configFile, pageID, experimentID)

          } else {
              console.log("A pre-existing ID for an Optimizely page was found in the config file");
          }
        } else {
          console.log("A pre-existing ID for an Optimizely experiment was found in the config file");
        }
    } else {
      console.log("please specify the ID and brand for the Optimizely experiment you'd like to create e.g. CX100 TH")
    }
    };
    cowe();