const inquirer = require("inquirer");
const fs = require("fs");
require('dotenv').config()
const {OPTLY_TOKEN} = process.env; 

const questions = [
  {
    type: "input",
    name: "brand",
    message: "Which brand(s) does this experiment target? (TH / CK / Both)",
    validate: (val) => {
      if (val !== "TH" && val !== "CK" && val !== "Both") {
        return "The experiment should target TH / CK / Both";
      } else {
        return true;
      }
    },
  },
  {
    type: "input",
    name: "expID",
    message: "Experiment ID:",
    validate: (val) => {
      if (val.indexOf("CX") < 0) {
        return "The experiment ID must conform to the convention CX<number> e.g. CX999";
      } else {
        return true;
      }
    },
  },
  {
    type: "input",
    name: "expName",
    message: "Experiment Name:",
    validate: (val) => {
      if (val.length < 1) {
        return "Please enter an experiment name";
      } else {
        return true;
      }
    },
  },
  {
    type: "input",
    name: "URLs",
    message: "Please enter the URLs targeted by this experiment:",
    validate: (val) => {
      if (val.length < 1) {
        return "Please enter a URL";
      } else {
        return true;
      }
    },
  },
  {
    type: "input",
    name: "conditionalCallback",
    message:
      "Conditional activation? Please add the callback code here, if relevant: (Optional)",
  },
  {
    type: "input",
    name: "variants",
    message: "Number of variants (including control):",
    validate: (val) => {
      if (parseInt(val) < 2) {
        return "There needs to be at least 2 variants";
      } else {
        return true;
      }
    },
  },
];

const prompt = inquirer.createPromptModule();
prompt(questions).then(async (answers) => {
  const { brand, expID, expName, variants, conditionalCallback, URLs } =
    answers;
    console.log("variantss = ", variants);

//   const config = `const config = {
//     audience_conditions: '[   "and",   {     "audience_id": 25974863091   } ]',
//     metrics: [
//       {
//         aggregator: "sum",
//         winning_direction: "increasing",
//         field: "revenue",
//         scope: "visitor",
//       },
//     ],
//     schedule: { time_zone: "UTC" },
//     type: "a/b",
//     url_targeting: {
//       edit_url: "https://www.optimizely.com",
//       activation_code: "function callbackFn(activate, options) { activate(); }",
//       activation_type: "callback",
//       conditions:
//         '["and", {"type": "url", "match_type": "substring", "value": "optimize"}]',
//     },
//     description: "testing programmatic test creation 2",
//     name: "QA programmatic exp",
//     project_id: 26081140005,
//     traffic_allocation: 10000,
//     variations: [
//       {
//         description: "control",
//         name: "Control",
//         status: "active",
//         weight: 5000,
//       },
//       {
//         description: "variation 1",
//         name: "Variation #1",
//         status: "active",
//         weight: 5000,
//       },
//     ],
//   }`;


  const projectID = brand === "TH" ? 14193350179 : 14193350179;

//   const result = await createOptimizelyPage(
//     conditionalCallback,
//     URLs,
//     `${expID} - ${expName}`,
//     projectID
//   );
//   if (result && result.id) {
//     createOptimizelyExperiment(result.name, result.id);
//   } else {
//     console.log("error creating page, please try again");
//   }


//   const baseFolderName = `./experiments/${expID}`;


  let pageID = await createOptimizelyPage(conditionalCallback, URLs, `${expID} - ${expName}`, projectID);
  if (pageID && pageID.id) {
    let experimentID =  await createOptimizelyExperiment(`${expID} - ${expName}`, pageID.id, variants);
    
    createBrandFolder(
        brand,
        projectID,
        expID,
        pageID.id,
        experimentID.id,
        variants,
        conditionalCallback,
        URLs
    );
  }
  
  

//   for (let i = 0; i < variants; i++) {
//     const folderName = `${baseFolderName}/variants/variant${i}`;

//     try {
//       if (!fs.existsSync(folderName)) {
//         fs.mkdirSync(folderName, { recursive: true });
//         createFile(`${folderName}/index.js`, ``);
//         createFile(`${folderName}/index.css`, ``);
//         // createFile(`${baseFolderName}/index.css`, ``);
//         createFile(
//           `${baseFolderName}/activation.js`,
//           `function callback() {console.log("callback")}`
//         );
//         createFile(`${baseFolderName}/config.js`, config);
//         fs.mkdirSync(`${baseFolderName}/shared`, { recursive: true });
//         createFile(`${baseFolderName}/shared/index.js`, ``);
//         createFile(`${baseFolderName}/shared/index.css`, ``);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   }
});

const createFile = (path, body) => {
  fs.writeFile(path, body, (err, res) => {
    if (err) console.log(err);
  });
};

const createBrandFolder = (
    brand,
    projectID,
    expID,
    pageID,
    experimentID,
    variants,
    conditionalCallback,
    URLs
) => {
    const baseFolderName = `./experiments/${expID}`;

    const config = `{
        "projectID": ${projectID},
        "pageID": ${pageID},
        "expID": ${experimentID}
    }`;
    
  for (let i = 0; i < variants; i++) {
    
    const folderName = `${baseFolderName}/${brand}/variants/variant${i}`;

    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
        createFile(`${folderName}/index.js`, ``);
        createFile(`${folderName}/index.css`, ``);
        // createFile(`${baseFolderName}/index.css`, ``);
   
        createFile(`${baseFolderName}/${brand}/config.json`, config);
        fs.mkdirSync(`${baseFolderName}/${brand}/sharedCode`, { recursive: true });
        createFile(`${baseFolderName}/${brand}/sharedCode/index.js`, ``);
        createFile(`${baseFolderName}/${brand}/sharedCode/index.css`, ``);
        // createTargeting(baseFolderName, conditionalCallback, URLs);
        fs.mkdirSync(`${baseFolderName}/${brand}/targeting`, { recursive: true });
        createFile(`${baseFolderName}/${brand}/targeting/audiences.json`, `{"QA":true, "Mobile": false, "Desktop": false}`);
        createFile(`${baseFolderName}/${brand}/targeting/URL.js`, `const urls = ${URLs}`);
        createFile(
          `${baseFolderName}/${brand}/targeting/conditionalActivation.js`,
                    `/**
            * Sample Activation Function
            * For complete documentation, see https://docs.developers.optimizely.com/web/docs/dynamic-websites#section-callback
            * @param {Function} activate - Call this function when you want to activate the page.
            * @param {Object} options - An object containing Page information.
            */

            function callbackFn(activate, options) {
            /* add you conditional activation code here */
            }`
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  
};

const createOptimizelyPage = async (activationCallback, URLs, pageName, projectID) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: OPTLY_TOKEN,
    },
    body: JSON.stringify({
      archived: false,
      category: "other",
      activation_code: "function callbackFn(activate, options) { }",
      edit_url: "https://uk.tommy.com/women",
      name: `${pageName}`,
      project_id: projectID,
      activation_type: "callback",
    }),
  };

  const res = await fetch("https://api.optimizely.com/v2/pages", options);
  const pageID = await res.json();
  return pageID;
};

const createOptimizelyExperiment = async (expName, pageID, variants) => {
  console.log("creating experiment... ", variants);

  const variantsArray = [];

  for (let i = 0; i < variants; i++) {
    variantsArray.push(        {
        name: i === 0 ? "Control" : `Variation #${i}`,
        status: "active",
        weight: Math.round(10000 / variants),
        description: "variant description",
        archived: false,
        actions: [
          {
            changes: [
              {
                type: "custom_code",
                async: false,
                value: "console.log('variant JS')",
              },
            ],
            page_id: 4643894617440256,
          },
        ],
      });
  }


  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: OPTLY_TOKEN
    },
    body: JSON.stringify({
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
      variations: variantsArray
    }),
  };

  const response = await fetch("https://api.optimizely.com/v2/experiments", options)
  const experiment = await response.json();
  return experiment;
};


const createTargeting = (baseFolderName, conditionalCallback, URLs) => {
  fs.mkdirSync(`${baseFolderName}/targeting`, { recursive: true });
  createFile(`${baseFolderName}/targeting/URL.js`, `const urls = ${URLs}`);
  createFile(
    `${baseFolderName}/targeting/conditionalActivation.js`,
    `/**
  * Sample Activation Function
  * For complete documentation, see https://docs.developers.optimizely.com/web/docs/dynamic-websites#section-callback
  * @param {Function} activate - Call this function when you want to activate the page.
  * @param {Object} options - An object containing Page information.
  */
 
 function callbackFn(activate, options) {
    ${conditionalCallback}
 }`
  );
};
