console.log("new exp script");
const inquirer = require("inquirer");
const fs = require("fs");

const questions = [
  {
    type: "input",
    name: "brand",
    message: "Which brand(s) does this experiment target? (TH / CK / DB)",
    validate: (val) => {
      if (val !== "TH" && val !== "CK" && val !== "DB") {
        return "The experiment should target TH / CK / DB";
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
    name: "locales",
    message:
      "Please enter the locales targeted by this experiment (UK|NL|DE|FR|IT|ES|PL etc.):",
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
    name: "numVariants",
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
  let { brand, expID, expName, locales, numVariants } = answers;

  if (!fs.existsSync(`./experiments/${expID}`)) {
        // Do something
        console.log("scaffolding experiment...");


    if (brand.toLowerCase() === "th") {
        brand = [
        {
            name: "TH",
            projectID: 14193350179,
        },
        ];
    } else if (brand.toLowerCase() === "ck") {
        brand = [
        {
            name: "CK",
            projectID: 14193350179,
        },
        ];
    } else {
        brand = [
        {
            name: "TH",
            projectID: 14193350179,
        },
        {
            name: "CK",
            projectID: 14193350179,
        },
        ];
    }
    createExperimentScaffolding(brand, expID, expName, locales, numVariants);
    console.log("experiment scaffolded!");
    } else {
        console.log(`The directory with experiment ID '${expID}' already exists. Would you like to create an iteration experiment?`);
    }
});

// scaffold experiment in IDE
const createExperimentScaffolding = (
  brand,
  expID,
  expName,
  locales,
  numVariants
) => {
  numVariants = parseInt(numVariants);

  brand.forEach((b) => {
    // create brand dir
    fs.mkdirSync(`./experiments/${expID}/${b.name}`, {
      recursive: true,
    });

    fs.mkdirSync(`./experiments/${expID}/${b.name}/variations`, {
      recursive: true,
    });

    for (let i = 0; i < numVariants; i++) {
      // create variant dir
      fs.mkdirSync(
        `./experiments/${expID}/${b.name}/variations/variation${i}`,
        {
          recursive: true,
        }
      );

      // create variant files inside variant dir
      fs.writeFile(
        `./experiments/${expID}/${b.name}/variations/variation${i}/index.js`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );
      fs.writeFile(
        `./experiments/${expID}/${b.name}/variations/variation${i}/index.css`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );

      // create shared folder and files
      fs.mkdirSync(`./experiments/${expID}/${b.name}/sharedCode`, {
        recursive: true,
      });
      fs.writeFile(
        `./experiments/${expID}/${b.name}/sharedCode/shared.js`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );
      fs.writeFile(
        `./experiments/${expID}/${b.name}/sharedCode/shared.css`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );

      // create targeting folder and files
      fs.mkdirSync(`./experiments/${expID}/${b.name}/targeting`, {
        recursive: true,
      });
      fs.writeFile(
        `./experiments/${expID}/${b.name}/targeting/callback.js`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );
      fs.writeFile(
        `./experiments/${expID}/${b.name}/targeting/audiences.json`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );
      fs.writeFile(
        `./experiments/${expID}/${b.name}/targeting/urls.js`,
        "",
        (err, res) => {
          if (err) console.log(err);
        }
      );

      //   create config files
      const config = createConfigFile(
        expID,
        expName,
        numVariants,
        b.name,
        b.projectID
      );
      fs.writeFile(
        `./experiments/${expID}/${b.name}/config.json`,
        config,
        (err, res) => {
          if (err) console.log(err);
        }
      );
    }
  });
};

const createConfigFile = (expID, expName, numVariants, brand, projectID) => {
  const variants = Array.from(Array(numVariants).keys()).map((el, index) => {
    return `
        {
            "name": "variant${index}",
            "js": "/${expID}/${brand}/variations/variation${index}/index.js",
            "css": "/${expID}/${brand}/variations/variation${index}/index.css"
        }
    `;
  });

  const config = `{
    "state": "qa",
    "id": "${expID}",
    "name": "${expName}",
    "brand": "${brand}",
    "variants": [${variants}],
    "activation": "callback.js",
    "projectID": ${projectID},
    "OptimizelyPageID": "",
    "OptimizelyExperimentID": ""
  }`;
  return config;
};
