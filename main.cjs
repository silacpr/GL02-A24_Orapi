const { program } = require("@caporal/core");

program
  .version("v0.0")

  // SPEC_1 + SPEC_4
  .command(
    "generate",
    "Generate a GIFT file from a list of questions IDs. All provided questions must already be in the database.\n",
  )
  .action(({ logger }) => {
    logger.info("TODO: Generate a GIFT file from a list of questions");
  })

  // SPEC_2 + SPEC_3
  .command(
    "find",
    "Find a question from the database. Either the id for the question OR a text query must be provided.\n",
  )
  .argument("[id]", "The ID associated with the question")
  .argument("[query]", "A query string to search for in the question database")
  .action(({ logger }) => {
    logger.info(
      "TODO: Find a question from the database. Either the id for the question OR a text query must be specified.",
    );
  })

  // SPEC_5
  .command(
    "profile",
    "View the profile for a GIFT exam that's in the database.\n",
  )
  .argument("<id>", "The ID associated with the exam")
  .action(({ logger }) => {
    logger.info(
      "TODO: View the profile for a GIFT exam that's in the database.",
    );
  })

  // SPEC_6
  .command(
    "visualize",
    "Generate a graph of the different question types in the database.\n",
  )
  .action(({ logger }) => {
    logger.info(
      "TODO: Generate a graph of the different question types in the database.",
    );
  })

  // SPEC_7
  .command(
    "compare",
    "Compare an exam profile to find how many questions types are found both in the exam and in the question database.\n",
  )
  .argument(
    "<id>",
    "The ID associated with the exam that going to be compared to the question database",
  )
  .action(({ logger }) => {
    logger.info(
      "TODO: Compare an exam profile to find how many questions types are found both in the exam and in the question database.",
    );
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
