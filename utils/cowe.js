const fs = require("fs");
const fsp = fs.promises;
const args = process.argv;
require("dotenv").config();
const { OPTLY_TOKEN } = process.env;

const userInput =
  args[2] &&
  args[2].toUpperCase().includes("CX") &&
  args[3] &&
  (args[3].toUpperCase() === "TH" || args[3].toUpperCase() === "CK")
    ? { expID: args[2], brand: args[3] }
    : false;

const getConfigFile = async (expID, brand) => {
  let configFile = await fsp.readFile(
    `./experiments/${expID}/${brand}/config.json`,
    "binary"
  );
  configFile = JSON.parse(configFile);
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
    // v.js = await fsp.readFile(
    // `./experiments${variant.js}`,
    // "binary"
    // );
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

  const result = {
    variants: variantsArr,
    activation: parsedCallback,
    sharedCode: {
      js: sharedJS,
      css: sharedCSS,
    },
  };
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
const createSharedCode = (sharedCode) => {
  const res = [];
  if (sharedCode.js) {
    res.push({ type: "custom_code", value: sharedCode.js, async: false });
  }
  if (sharedCode.css) {
    res.push({ type: "custom_css", value: sharedCode.css, async: false });
  }
  
  return res;
};

const createOptimizelyExperiment = async (
  expName,
  pageID,
  projectID,
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

  const optimizelyExp = await postToOptimizely(
    body,
    "https://api.optimizely.com/v2/experiments"
  );
  return optimizelyExp;
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

  try {
    const res = await fetch(endpoint, options);
    const resource = await res.json();
    return resource;
  } catch(error) {
    console.log("error in try catch ", error)
  }
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
        console.log("File written successfully\n");
        console.log("The written file has the following contents:");
      }
    }
  );
};

const cowe = async () => {
  if (userInput) {
    const { expID, brand } = userInput;
    const configFile = await getConfigFile(expID, brand);
    const {
      name,
      variants,
      activation,
      projectID,
      OptimizelyPageID,
      OptimizelyExperimentID,
    } = configFile;

    if (!OptimizelyExperimentID) {
      const expName = `${expID} - ${name}`;
      const customCode = await getCustomCode(
        expID,
        brand,
        variants,
        activation
      );
      const parsedSharedCode = createSharedCode(customCode.sharedCode);
      
      if (!OptimizelyPageID) {
        console.log(`Creating page for ${expID} in Optimizely...`);
        const page = await createOptimizelyPage(
          expName,
          projectID,
          customCode.activation
        );
        if (page.id) {
            updateConfigFile(expID, brand, configFile, 'OptimizelyPageID', page.id);
            console.log(`Page ${page.id} for ${expID} created in Optimizely.`);
            console.log(`Creating experiment for ${expID} in Optimizely...`);
            const experiment = await createOptimizelyExperiment(
              expName,
              page.id,
              projectID,
              customCode.variants,
              parsedSharedCode
            );
            if (experiment.id) {
              console.log(`Experiment ${experiment.id} for ${expID} created in Optimizely.`);
              updateConfigFile(expID, brand, configFile, 'OptimizelyExperimentID', experiment.id);
            } else {
              // handle error
              console.log(`error of type ${experiment.code}. The following issue occurred: ${experiment.message}`);
            }
        } else {
          // handle error
          console.log(`error of type ${page.code}. The following issue occurred: ${page.message}`);
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
  } else {
    console.log(
      "please specify the ID and brand for the Optimizely experiment you'd like to create e.g. CX100 TH"
    );
  }
};
cowe();
