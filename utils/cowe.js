const fs = require("fs");
const fsp = fs.promises;
const args = process.argv;
require("dotenv").config();
const { OPTLY_TOKEN } = process.env;

const getUserInput = () => {
  const userInput =
  args[2] &&
  args[2].toUpperCase().includes("CX") &&
  args[3] &&
  (args[3].toUpperCase() === "TH" || args[3].toUpperCase() === "CK")
    ? { expID: args[2], brand: args[3] }
    : false;
    return userInput;
}

const getConfigFile = async (expID, brand) => {
  console.log(`Getting config file for expID:${expID} brand:${brand}`)
  let configFile = await fsp.readFile(
    `./experiments/${expID}/${brand}/config.json`,
    "binary"
  )
  .then(res => {
    parsedConfig = JSON.parse(res);
    return parsedConfig;
  })
  .catch(e => {
    console.log(`Config file not found for expID:${expID} brand:${brand}. Please check that the expID and brand are valid.`);
    return false;
  });
  return configFile;
};

const validateCustomCode = (code) => {
  // remove escape characters to prevent request rejection
  // const parsedCode = code.replace(/\s+/g, '');
  return code;
};

const getCustomCode = async (id, brand, variants, activation) => {
  const variantsArr = [];
  // get variant code
  for (const variant of variants) {
    const v = { name: variant.name, js: "", css: "" };

    const js = await fsp.readFile(`./experiments${variant.js}`, "binary");
    const parsedJS = validateCustomCode(js);
    v.js = parsedJS;

    const css = await fsp.readFile(`./experiments${variant.css}`, "binary");
    const parsedCSS = validateCustomCode(css);
    v.css = parsedCSS;

    variantsArr.push(v);
  }

  // get activation code
  const activationCallback = await fsp.readFile(
    `./experiments/${id}/${brand}/targeting/${activation}`,
    "binary"
  );
  console.log("activation callback => ", activationCallback);
  const parsedCallback = validateCustomCode(activationCallback);

  // get shared code
  const sharedJS = await fsp.readFile(
    `./experiments/${id}/${brand}/sharedCode/shared.js`,
    "binary"
  );
  const sharedCSS = await fsp.readFile(
    `./experiments/${id}/${brand}/sharedCode/shared.css`,
    "binary"
  );
  const sharedCode = createSharedCode(sharedJS, sharedCSS);

  const result = {
    variants: variantsArr,
    activation: parsedCallback,
    sharedCode: sharedCode,
  };
  return result;
};


const getAudiences = async (path, brand) => {
  /* OPTLY AUDIENCE ID
    -TH
      - QA = 6161659085979648
      - Destop = 6533414275252224
      - Mobile = 4873116552265728
    -CK
      - QA = 5226595548397568
      - Destop = 5157423925690368
      - Mobile = 4991908099915776
  */
  const audiences = await fsp.readFile(path, "binary");
  if (audiences) {
    const audienceObj = JSON.parse(audiences);
    let optimizelyAudiences = [
      "and"
    ]
    if (audienceObj.qa) {
      optimizelyAudiences.push({
        "audience_id": brand.toUpperCase() === "TH" ? 6161659085979648 : 5226595548397568
      });
    }
    if (audienceObj.desktop) {
      optimizelyAudiences.push({
        "audience_id": brand.toUpperCase() === "TH" ? 6533414275252224 : 5157423925690368
      });
    }
    if (audienceObj.mobile) {
      optimizelyAudiences.push({
        "audience_id": brand.toUpperCase() === "TH" ? 4873116552265728 : 4991908099915776
      });
    }

    optimizelyAudiences = JSON.stringify(optimizelyAudiences);
    return optimizelyAudiences;
  }
};

const getCustomGoals = async (expID, brand) => {
  const customGoals = await fsp.readFile(`./experiments/${expID}/${brand}/customGoals.json`, "binary");
  const parsedCustomGoals = JSON.parse(customGoals);
  if (parsedCustomGoals && parsedCustomGoals.length) {
    const optimizelyMetrics = parsedCustomGoals.map(goal => {
      return {
        event_id: goal.id,
        aggregator: 'unique',
        scope: 'visitor',
        winning_direction: 'increasing'
      }
    });
    return optimizelyMetrics;
  } else {
    return []
  }
};

const createOptimizelyPage = async (expName, projectID, activation) => {
  console.log(`Creating Optimizely Page for ${expName}`)
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
    return optimizelyPage;
  }
};

const createVariantActions = (pageID, variants) => {
  const variantsArray = [];

  variants.forEach((variant) => {
    const variantActions =
      variant.js || variant.css
        ? [
            {
              changes: [],
              page_id: pageID,
            },
          ]
        : [
            {
              page_id: pageID,
            },
          ];
    if (variant.js) {
      variantActions[0].changes.push({
        type: "custom_code",
        value: `${variant.js}`,
        async: false,
      });
    }
    if (variant.css) {
      variantActions[0].changes.push({
        type: "custom_css",
        value: `${variant.css}`,
      });
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
};
const createSharedCode = (sharedJS, sharedCSS) => {
  const res = [];
  if (sharedJS) {
    res.push({ type: "custom_code", value: sharedJS, async: false });
  }
  if (sharedCSS) {
    res.push({ type: "custom_css", value: sharedCSS, async: false });
  }
  
  return res;
};

const createOptimizelyExperiment = async (
  expName,
  pageID,
  projectID,
  audiences,
  goals,
  variants,
  sharedCode
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
    audience_conditions: audiences,
    schedule: { time_zone: "UTC" },
    type: "a/b",
    description: "description placeholder",
    name: expName,
    page_ids: [pageID],
    project_id: projectID,
    traffic_allocation: 10000,
    variations: variantsArray,
  };
  if (sharedCode.length) {
    body.changes = sharedCode;
  }
  if (goals.length) {
    body.metrics = goals;
  }

  const optimizelyExp = await postToOptimizely(
    body,
    "https://api.optimizely.com/v2/experiments"
  );
  return optimizelyExp;
};

const postToOptimizely = async (reqBody, endpoint) => {
  console.log("positing to optly...")
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: OPTLY_TOKEN,
    },
    body: JSON.stringify(reqBody),
  };

    const res = await fetch(endpoint, options)
    const resource = await res.json();
    return resource && resource.id ? resource : false;
};

const updateConfigFile = (expID, brand, configFile, key, resourceID) => {
  configFile[key] = resourceID;
  fs.writeFile(
    `./experiments/${expID}/${brand}/config.json`,
    JSON.stringify(configFile),
    {
      encoding: "utf8",
    },
    (err) => {
      if (err) console.log(err);
      else {
        console.log(`The ${key} in the config file for expID:${expID} brand:${brand} has been updated.`);
      }
    }
  );
};

const buildExp = async (configFile) => {
  console.log("Building experiment... ");
      const {
      name,
      id,
      brand,
      audiences,
      variants,
      activation,
      customGoals,
      projectID,
      OptimizelyPageID,
      OptimizelyExperimentID,
    } = configFile;
  const customCode = await getCustomCode(
    id,
    brand,
    variants,
    activation
  );
  
  
  const optlyAudiences = await getAudiences(audiences, brand);
  const optlyGoals = await getCustomGoals(id, brand);
  const builtExperiment = {
    id,
    name,
    projectID,
    variantCode: customCode.variants,
    sharedCode: customCode.sharedCode,
    callback: customCode.activation,
    optlyAudiences,
    optlyGoals
  }

  
  return builtExperiment;
}

const cowe = async () => {
  const userInput = getUserInput();
  if (userInput) {
    const { expID, brand } = userInput;
    const configFile = await getConfigFile(expID, brand);
    if (configFile) {
      const expBuild = await buildExp(configFile);

      if (!configFile.OptimizelyExperimentID) {
        if (!configFile.OptimizelyPageID) {
            const optlyPage = await createOptimizelyPage(`${expBuild.id} - ${expBuild.name}`,expBuild.projectID,expBuild.callback);
            if (optlyPage && optlyPage.id) {
              updateConfigFile(expID, brand, configFile, 'OptimizelyPageID', optlyPage.id);
              const optlyExperiment = await createOptimizelyExperiment(
                `${expBuild.id} - ${expBuild.name}`,
                optlyPage.id,
                expBuild.projectID,
                expBuild.optlyAudiences,
                expBuild.optlyGoals,
                expBuild.variantCode,
                expBuild.sharedCode
              );
              if (optlyExperiment.id) {
                updateConfigFile(expID, brand, configFile, 'OptimizelyExperimentID', optlyExperiment.id);
              } else {
                // handle error
                console.log(`error of type ${optlyExperiment.code}. The following issue occurred: ${optlyExperiment.message}`);
              }
          } else {
            // handle error
            console.log("error creating optly page");
            // console.log(`error of type ${optlyPage.code}. The following issue occurred: ${optlyPage.message}`);
          }
        } else {
          console.log(
            "A pre-existing ID for an Optimizely page was found in the config file"
          );
        }
      } else {
        console.log(
          "A pre-existing ID for an Optimizely experiment was found in the config file"
        );
      }
    }
  } else {
    console.log(
      "please specify the ID and brand for the Optimizely experiment you'd like to create e.g. CX100 TH"
    );
  }
};
cowe();
