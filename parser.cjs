const fs = require("fs");

class GiftParser {
  constructor(inputFiles) {
    this.inputFiles = inputFiles;
  }

  generateGift(questionIds) {
    let giftOutput = "";

    // Get each question using the find by id method. Pass in true as a second
    // parameter to get rawOutput instead of parsed (JSON object) output.
    questionIds.forEach((questionId) => {
      const rawQuestion = this.findQuestionById(questionId, true)[0];

      if (!rawQuestion) {
        throw questionId;
      }

      // Append the rawQuestion to the outputString, with 3 new line characters
      // to help readability. (any number of new lines can be between questions)
      giftOutput += rawQuestion.trim() + '\n\n\n';
    });

    return giftOutput;
  }

  findQuestionById(id, raw = false) {
    const outputQuestions = [];

    // Loop through all the filePaths that were given as input.
    this.inputFiles.forEach((filePath) => {
      // Read the contents of the file
      const file = fs.readFileSync(filePath, "utf-8");

      // Remove the comments. We don't tokenize because we can directly look for the
      // specific question id we want, and we need only 1 result because id's are
      // supposed to be unique.
      const withoutComments = this._removeComments(file);

      // Escape any potential special characters that could mess up the regex match.
      const escapedId = this._escapeSpecialRegexChars(id);
      const regex = new RegExp(`::${escapedId}::(.*?)(?=(?:::)|$)`, "s");

      const result = regex.exec(withoutComments);

      if (!result) return;

      outputQuestions.push(raw ? result[0] : this._parseQuestion(result[0]));
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
      // Escape any potential special characters that could mess up the regex match.
      const escapedQuery = this._escapeSpecialRegexChars(query);
      const regex = new RegExp(`.*\\b${escapedQuery}\\b.*`, "is");
      rawQuestions.forEach((rawQuestion) => {
        const result = regex.exec(rawQuestion);

        if (!result) return;

        outputQuestions.push(this._parseQuestion(rawQuestion));
      });
    });

    return outputQuestions;
  }

  findQuestionsTypes(giftFileContent) {
     // Tokenize the exam file into a list of GIFT questions
    const questions = this._tokenizeIntoQuestions(giftFileContent);

    // Regex patterns for each question type
    const patterns = {
      "True/False": /\{[TF]\}/,
      "Multiple Choice": /\{.*(~|=).*}/,
      "Matching": /\{.*->.*}/,
      "Numerical": /\{#.*\}/,
      "Short Answer": /\{.*(___||SA).*\}/,
      "Essay": /\{\}/,
    };

    // Initialyze count of every type of question
    const typesCount = {
      "Multiple Choice": 0,
      "True/False": 0,
      "Matching": 0,
      "Short Answer": 0,
      "Numerical": 0,
      "Essay": 0,
      "Unknown": 0,
    };
    
    // For each question, check its type using regex
    questions.forEach((question) => {
      let matched = false;
      for (const [type, regex] of Object.entries(patterns)) {
        if (regex.test(question)) {
          typesCount[type]++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        typesCount["Unknown"]++;
      }
    });
  
    return typesCount;
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

  _escapeSpecialRegexChars(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

module.exports = GiftParser;
