const { program } = require("@caporal/core");
const fs = require("fs");
require("colors");
const vg = require("vega");
const vegalite = require("vega-lite");

const GiftParser = require("./parser.cjs");

const DATA_DIR_BASE_PATH = `${__dirname}/data`;
const MIN_EXAM_QUESTION_COUNT = 15;
const MAX_EXAM_QUESTION_COUNT = 20;

const readDataDir = (dataDirPath) => {
  if (!dataDirPath) dataDirPath = DATA_DIR_BASE_PATH;

  // Read into the data directory and get the list of filepaths to load into the
  // program. Prepend the dataDirPath to every file name so that we get a list of
  // full file paths instead of just file names.
  const files = fs.readdirSync(dataDirPath);
  files.forEach((fileName, index, fileNameArray) => {
    fileNameArray[index] = `${dataDirPath}/${fileName}`;
  });
  return files;
};

program
  .version("v0.0")
  .option(
    "--data-dir-path <data-dir-path>",
    "The path to the directory containing the data that the program will use. Defaults to ./data.",
    { default: DATA_DIR_BASE_PATH, global: true },
  )

  // SPEC_1 + SPEC_4
  .command(
    "generate",
    "Generate a GIFT file from a list of questions IDs. All provided questions must already be in the database.\n",
  )
  .option(
    "--question-ids <ids>",
    "The list of question Ids. A question ID corresponds to the full question title encloosed by '::' characters. The list has to be comma separated with no space between each entry.",
    { required: true },
  )
  .option(
    "--output-path <path>",
    "The path to write the output to. Defaults to ./output.gift if not specified.",
    { default: "output.gift" },
  )
  .action(({ options }) => {
    // Check that the user provided a list of questionIds.
    if (!options.questionIds) {
      console.log("Error: You must provide a list of question ids.");
      return;
    }

    // Split the option string to get an array of question ids.
    const questionIds = options.questionIds.split(",");

    // Check that the number of questions is within the bounds of what is allowed
    // in the specifications.
    if (
      questionIds.length < MIN_EXAM_QUESTION_COUNT ||
      questionIds.length > MAX_EXAM_QUESTION_COUNT
    ) {
      console.log(
        `Error: You must provide between ${MIN_EXAM_QUESTION_COUNT} and ${MAX_EXAM_QUESTION_COUNT} questions ids, but you provided ${questionIds.length.toString().bold.red}.`,
      );
    }

    // Instantiate a new parser.
    const files = readDataDir(options.dataDirPath);
    const parser = new GiftParser(files);

    // Attempt to generate the Gift file. the method might throw an exception
    // containing the question id if an id isn't found in the available data.
    try {
      const giftOutput = parser.generateGift(questionIds);

      // Unlikely: something unexpected happened and the output is an emtpy string.
      if (!giftOutput) {
        console.log("Error: failed to generate the GIFT output file.");
        return;
      }

      // Attempt to write the file to disk using the path provided in the option.
      // Defaults to ./output.gift
      fs.writeFile(options.outputPath, giftOutput, (err) => {
        if (err) {
          console.log(
            `Error: Failed to write the file ${options.outputPath} to disk. Details: ${err}`,
          );
          return;
        }

        console.log(
          `Successfully generated the GIFT file ${options.outputPath}.`,
        );
      });
    } catch (questionId) {
      console.log(
        `Error: the question id '${questionId}' has not been found in the database. Are you sure the question exists ?`,
      );
    }
  })

  // SPEC_2 + SPEC_3
  .command(
    "find",
    "Find a question from the database. Either the id for the question OR a text query must be provided.\n",
  )
  .option(
    "--id <id>",
    "The ID associated with the question. A question ID corresponds to the full question title enclosed by '::' characters.",
  )
  .option(
    "--query <query>",
    "A query string to search for in the question database",
  )
  .action(({ options }) => {
    // Check that the user provided a valid option
    if (!options.id && !options.query) {
      console.log("Error: You must provide either an id or a query.");
      return;
    }

    // Check that the user did not provide both the id and and a query.
    if (options.id && options.query) {
      console.log(
        "Error: You should provide either an id or a query but not both.",
      );
      return;
    }

    // Instantiate a parser and call the correct method depending on which option was passed in.
    const files = readDataDir(options.dataDirPath);
    const parser = new GiftParser(files);
    const foundQuestions = options.id
      ? parser.findQuestionById(options.id)
      : parser.findQuestionByQuery(options.query);

    // Show each question that was found by displaying the total match count and
    // the title and body for each question.
    const foundCount = foundQuestions.length.toString().bold;
    console.log(
      `Found ${foundQuestions.length === 0 ? foundCount.red : foundCount.green} ${foundQuestions.length !== 1 ? "questions" : "question"} matching your query.\n`,
    );
    foundQuestions.forEach((question) => {
      console.log("-----");
      console.log(`${"TITLE".green}: ${question.title}`);
      console.log(`${"BODY".green}: ${question.body}`);
      console.log("-----");

      console.log("");
    });
  })

  // SPEC_5
  .command(
    "profile",
    "View the profile for a GIFT exam that's in the database.\n",
  )
  .argument("<id>", "The ID associated with the exam")
  .action(({ args, options }) => {
    const examId = args.id;

    // Path to the exam file provided
    const examFilePath = `${options.dataDirPath ?? DATA_DIR_BASE_PATH}/${examId}`;

    // Error handling for non-existant file
    if (!fs.existsSync(examFilePath)) {
      console.log(`Error: The exam file '${examId}' does not exist.`);
      return;
    }

    // Read the content of the exam file
    const examContent = fs.readFileSync(examFilePath, "utf-8");

    // Instantiate a parser and call the correct method
    const parser = new GiftParser([]);
    const typesProfile = parser.findQuestionsTypes(examContent);

    // Display the results
    console.log(`${"Profile for Exam ID".green}: ${examId}\n`);
    Object.entries(typesProfile).forEach(([type, count]) => {
      const formattedCount = count.toString().bold;
      console.log(
        `${type}: ${count === 0 ? formattedCount.red : formattedCount.green} ${count === 1 ? "question" : "questions"}`,
      );
    });
    console.log();
  })

  // SPEC_6
  .command(
    "visualize",
    "Generate a graph of the different question types in the database or for a specific exam.\n"
  )
  .option(
    "--all",
    "Generate the graph for all exams in the database."
  )
  .option(
    "--id <id>",  
    "Generate the gragh for a specific exam given its ID."
  )
  .option(
    "--output <output>", 
    "Path to save the SVG file.", 
    { default: "./output_graph.svg", }
  )
  .action(async ({ options }) => {
    const { id, all, output } = options;

    // Check that the user provided a valid option
    if (!id && !all) {
      console.log("Error: Provide an exam ID or use the --all option.");
      return;
    }

    // Read the data from a all exams or a specific one
    let examContent = "";
    if (all) {
      const files = readDataDir(options.dataDirPath);
      examContent = files.map((file) => fs.readFileSync(file, "utf-8")).join("\n");
    } else {
      const examPath = `${options.dataDirPath ?? DATA_DIR_BASE_PATH}/${id}`;
      if (!fs.existsSync(examPath)) {
        console.log(`Error: The exam file '${id}' does not exist.`);
        return;
      }
      examContent = fs.readFileSync(examPath, "utf-8");
    }

    // Instantiate a parser and call the correct method
    const parser = new GiftParser([]);
    const typesProfile = parser.findQuestionsTypes(examContent);

    // Create the VegaLite specification
    const vegaLiteSpec = {
      data: {
        values: Object.entries(typesProfile).map(([type, count]) => ({
          type,
          count,
        })),
      },
      mark: "bar",
      encoding: {
        x: { field: "type", type: "ordinal", title: "Question Types" },
        y: { field: "count", type: "quantitative", title: "Count" },
        color: { field: "type", type: "nominal", legend: null },
      },
      width: 600,
      height: 400,
    };

    // Compile the VegaLite spec into a Vega spec
    const vegaSpec = vegalite.compile(vegaLiteSpec).spec;

    // SVG render
    const view = new vg.View(vg.parse(vegaSpec)).renderer('svg').run();
    const mySvg = view.toSVG();
    mySvg.then(function(res){
      fs.writeFileSync(output, res)
      view.finalize();
      console.log("%s", JSON.stringify(vegaSpec, null, 2));
      console.log(`Chart output : ${output}`);
    });
  })

  // SPEC_7
  .command(
    "compare",
    "Compare an exam profile to find how many questions types are found both in the exam and in the question database.\n",
  )
  .argument(
    "<id>",
    "The ID associated with the exam that is going to be compared to the question database",
  )
  .option(
    "--all",
    "Compare the specified file to the entire database.",
  )
  .option(
    "--reference-id <reference-id>",
    "Compare the specified file to another specific file with its associated ID",
  )
  .action(({ args, options }) => {
    const examId = args.id;

    // Path to the exam file provided
    const mainFilePath = `${options.dataDirPath ?? DATA_DIR_BASE_PATH}/${examId}`;

    // Error handling for non-existant file
    if (!fs.existsSync(mainFilePath)) {
      console.log(`Error: The exam file '${examId}' does not exist.`);
      return;
    }
    
    // Read the content of the exam file
    const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

    // Determine reference files to compare against : all fiiles for optiion all and one specified file for option referenceId
    let referenceFiles = [];
    if (options.all) {
      referenceFiles = readDataDir(options.dataDirPath);
    } else if (options.referenceId) {
      const referenceFilePath = `${options.dataDirPath ?? DATA_DIR_BASE_PATH}/${options.referenceId}`;

      // Error handling for non-existant file
      if (!fs.existsSync(referenceFilePath)) {
        console.log(
          `Error: The reference file '${options.referenceId}' does not exist.`,
        );
        return;
      }

      referenceFiles = [referenceFilePath];
    } else {
      // Check that the user provided a valid option
      console.log(
        "Error: You must specify either --all or --reference-id as a reference.",
      );
      return;
    }

    // Instantiate a parser and call the correct method
    const parser = new GiftParser(referenceFiles);
    const mainFileTypes = parser.findQuestionsTypes(mainFileContent);

    const referenceTypes = referenceFiles.reduce((acc, filePath) => {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const types = parser.findQuestionsTypes(fileContent);

      // Merge counts of types from all reference files
      for (const [type, count] of Object.entries(types)) {
        acc[type] = (acc[type] || 0) + count;
      }
      return acc;
    }, {});
    
    // Calculate average amount of each type for better comparison
    const fileCount = referenceFiles.length;
    const averageReferenceTypes = Object.entries(referenceTypes).reduce(
      (acc, [type, total]) => {
        acc[type] = total / fileCount;
        return acc;
      }, {});

    // Find common types
    const commonTypes = Object.keys(mainFileTypes).filter(
      (type) => mainFileTypes[type] > 0 && averageReferenceTypes[type] > 0,
    );

    // Display results
    console.log("\n-----");
    console.log(`Comparison of '${examId}' with reference:`);
    console.log("Common question types:");
    commonTypes.forEach((type) => {
      console.log(
        `- ${type}: ${mainFileTypes[type]} (main) vs ${averageReferenceTypes[type]} (reference)`,
      );
    });

    if (commonTypes.length === 0) {
      console.log("No common question types found.");
    }

    console.log("-----\n");
  })

  // SPEC_8
  .command(
    "evaluate",
    "Evaluate the validity of the answers for a given test. A valid ID as well as the corresponding list of answers must be provided.\n",
  )
  .argument(
    "<id>",
    "The ID associated with the test answers that need to be validated.",
  )
  .argument(
    "<answers>",
    "Comma separated list of test answers to validate. The list's length MUST be equal to the questions length.",
  )
  .action(({ logger }) => {
    logger.info(
      "TODO: Evaluate the validity of the answers for a given test. A valid ID as well as the corresponding list of answers must be provided.",
    );
  })

  // SPEC_9
  .command(
    "contact",
    "Generate a contact and identification file for a given teacher using the VCard format.\n",
  )
  .argument(
    "<id>",
    "The ID associated with the teacher for which we want to generate the identification card.",
  )
  .action(({ logger }) => {
    logger.info(
      "TODO: Generate a contact and identification file for a given teacher using the VCard format.",
    );
  });

program.run();
