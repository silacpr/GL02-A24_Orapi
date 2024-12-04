const fs = require("fs");

class GiftParser {
  constructor(inputFiles) {
    this.inputFiles = inputFiles;
  }

  findQuestionById(id) {
    const outputQuestions = [];

    // Loop through all the filePaths that were given as input.
    this.inputFiles.forEach((filePath) => {
      // Read the contents of the file
      const file = fs.readFileSync(filePath, "utf-8");

      // Remove the comments. We don't tokenize because we can directly look for the
      // specific question id we want, and we need only 1 result because id's are
      // supposed to be unique.
      const withoutComments = this._removeComments(file);

      const regex = new RegExp(`::${id}::(.*?)(?=(?:::)|$)`, "s");

      const result = regex.exec(withoutComments);

      if (!result) return;

      outputQuestions.push(this._parseQuestion(result[0]));
    });

    return outputQuestions;
  }

  findQuestionByQuery(query) {
    const outputQuestions = [];

    // Loop through all the filePaths that were given as input.
    this.inputFiles.forEach((filePath) => {
      // Read the contents of the file
      const file = fs.readFileSync(filePath, "utf-8");

      // Tokenize the file into a list of GIFT questions
      const rawQuestions = this._tokenizeIntoQuestions(file);

      // For each question, look for the query string. If it is found, parse and append
      // the question to the output.
      const regex = new RegExp(`.*\\b${query}\\b.*`, "is");
      rawQuestions.forEach((rawQuestion) => {
        const result = regex.exec(rawQuestion);

        if (!result) return;

        outputQuestions.push(this._parseQuestion(rawQuestion));
      });
    });

    return outputQuestions;
  }

  _tokenizeIntoQuestions(file) {
    // Transform the raw GIFT file into an array of GIFT questions.
    // Remove comments in the process.
    const withoutComments = this._removeComments(file);
    const questions = withoutComments
      .split(/(?=^::)/m)
      .map((question) => question.trim())
      .filter((q) => q.length > 0);

    return questions;
  }

  _removeComments(file) {
    // Remove all comments (lines starting with `//`)
    return file
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
  }

  // Separate the question title from the body and return the two as a JS object.
  _parseQuestion(rawQuestion) {
    const regex = new RegExp(`::(.*?)::(.*?)(?=(?:::)|$)`, "s");

    const result = regex.exec(rawQuestion);
    return { title: result[1].trim(), body: result[2].trim() };
  }
}

module.exports = GiftParser;
