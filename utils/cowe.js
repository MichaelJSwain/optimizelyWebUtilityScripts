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

if (userInput) {
    console.log("valid user input");
  const getConfigFile = async () => {
    let configFile = await fsp.readFile(
      `./experiments/${userInput.expID}/${userInput.brand}/config.json`,
      "binary"
    );
    configFile = JSON.parse(configFile);
    return configFile;
  };

  const getVariantCode = async (path) => {
    let code = await fsp.readFile(`./experiments${path}`, "binary");
  };

  const getConfigValues = async (configFile) => {

    const data = {
      id: configFile.id,
      name: configFile.name,
      brand: configFile.brand,
      projectID: configFile.projectID,
      activation: configFile.activation,
      variants: configFile.variants,
      optimizelyPageID: configFile.OptimizelyPageID,
      optimizelyExperimentID: configFile.OptimizelyExperimentID,
    };

    // get variant code
    for (const variant of data.variants) {
      const variantJS = await fsp.readFile(
        `./experiments${variant.js}`,
        "binary"
      );
      const variantCSS = await fsp.readFile(
        `./experiments${variant.css}`,
        "binary"
      );
      variant.js = variantJS;
      variant.css = variantCSS;
    }

    // get activation code
    const activationCode = await fsp.readFile(
      `./experiments/${data.id}/${data.brand}/targeting/${data.activation}`,
      "binary"
    );
    data.activation = activationCode;
    return data;
  };

  const cowe = async () => {
    const configFile = await getConfigFile();
    const data = await getConfigValues(configFile);
    if (!data.optimizelyPageID) {
      // create new optimizely page
    //   const pageID = await createOptimizelyPage(data);
        const pageID = false;
    if (pageID) {
        const optimizelyExperiment = await createOptimizelyExperiment(
          `${data.id} - ${data.name}`,
          pageID,
          data.projectID,
          data.variants
        );
      }
    } else {
    }
  };

  if (args[2] && args[3]) {
    const expID = args[2];
    const brand = args[3];
    cowe();
  } else {
    console.log("please specify the exp ID and brand");
  }

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

      console.log("returned optly page = ", optimizelyPage);
      return optimizelyPage.id ? optimizelyPage.id : false;
    }
  };

  const createOptimizelyExperiment = async (
    expName,
    pageID,
    projectID,
    variants
  ) => {
    console.log(
      "creating optimizely experiment... ",
      expName,
      pageID,
      projectID,
      variants
    );

    const variantsArray = [];

    variants.forEach((variant) => {
      const variantData = {
        name: variant.name,
        status: "active",
        weight: Math.round(10000 / variants.length),
        description: "variant description",
        archived: false,
        actions: [
          {
            changes: [
              {
                type: "custom_code",
                value: "console.log('test')",
                async: false,
              },
              { type: "custom_css", value: ".selector {background: 'red'}" },
            ],
            page_id: pageID,
          },
        ],
      };
      variantsArray.push(variantData);
    });

    console.log(variantsArray);

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

    console.log("exp req body = ", body);
    const result = await postToOptimizely(
      body,
      "https://api.optimizely.com/v2/experiments"
    );
    console.log("exp result =", result);
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
}
