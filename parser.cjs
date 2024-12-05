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
      giftOutput += rawQuestion.trim() + "\n\n\n";
    });

    return giftOutput;
  }

  computeQuestionTypeAverages() {
    let examCount = 0;
    const typesAverage = {
      Description: 0,
      "Multiple Choice": 0,
      "True/False": 0,
      Matching: 0,
      "Short Answer": 0,
      Numerical: 0,
      Essay: 0,
    };

    // Loop through all the filePaths that were given as input.
    this.inputFiles.forEach((filePath) => {
      const file = fs.readFileSync(filePath, "utf-8");

      // Remove the comments and the categories.
      const withoutCategories = this._removeCategories(file);
      const withoutComments = this._removeComments(withoutCategories);

      const typesCount = this.findQuestionsTypes(withoutComments);

      examCount++;
      for (let key in typesCount) {
        typesAverage[key] =
          (typesAverage[key] * (examCount - 1) + typesCount[key]) / examCount;
      }
    });

    return typesAverage;
  }

  findQuestionById(id, raw = false) {
    const outputQuestions = [];

    // Loop through all the filePaths that were given as input.
    this.inputFiles.forEach((filePath) => {
      // Read the contents of the file
      const file = fs.readFileSync(filePath, "utf-8");

      // Remove the comments and the categories. We don't tokenize because we can directly look for the
      // specific question id we want, and we need only 1 result because id's are
      // supposed to be unique.
      const withoutCategories = this._removeCategories(file);
      const withoutComments = this._removeComments(withoutCategories);

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

    // Initialyze count of every type of question
    const typesCount = {
      Description: 0,
      "Multiple Choice": 0,
      "True/False": 0,
      Numerical: 0,
      Matching: 0,
      "Short Answer": 0,
      Essay: 0,
    };

    // For each question, check its type
    questions.forEach((question) => {
      const type = this._findQuestionType(question);
      typesCount[type]++;
    });

    return typesCount;
  }

  _findQuestionType(rawQuestion) {
    // Regex patterns for each question type
    // Note: the order in which the regex are checked is very important. Do not
    // change the order of properties unless you know what you're doing.
    const patterns = {
      "True/False": /\{[TF]\}/s,
      Numerical: /\{#.*\}/s,
      Matching: /\{.*->.*}/s,
      "Short Answer": /\{[^~]*=+[^~]*\}/s,
      "Multiple Choice": /\{(?!.*->).*([~=]).*}/s,
      Essay: /\{\}/s,
    };

    for (const [type, regex] of Object.entries(patterns)) {
      if (regex.test(rawQuestion)) {
        return type;
      }
    }
    return "Description";
  }

  validateAnswers(testContent, studentAnswers) {
    // Tokenize the GIFT file content into individual questions
    const rawQuestions = this._tokenizeIntoQuestions(testContent);

    // Assign a type to each question and store it in an object.
    const questions = rawQuestions.map((question) => {
      const type = this._findQuestionType(question);
      return { type, text: question };
    });

    // Filter out the Essay and description questions because they cannot be validated.
    const questionsToValidate = questions.filter((question) => {
      const type = this._findQuestionType(question.text);
      return type !== "Essay" && type !== "Description";
    });

    // Check that there as many answers as there are questions to validate.
    if (questionsToValidate.length !== studentAnswers.length) {
      throw new Error(
        `The number of answers (${studentAnswers.length}) does not match the number of questions (${questionsToValidate.length}).`,
      );
    }

    // Extract every answer from each question, put them all in one array, with
    // the type included so that we know how to extract the correct answer later on.
    const answerRegex = /\{([^{}]*)\}/gs;
    const answers = [];
    questionsToValidate.forEach((question) => {
      const matches = [...question.text.matchAll(answerRegex)].map(
        (match) => match[1],
      );
      if (matches)
        answers.push(
          ...matches.map((match) => ({ type: question.type, text: match })),
        );
    });

    // Check that there as many answers as there are answers to validate.
    if (answers.length !== studentAnswers.length) {
      throw new Error(
        `The number of answers (${studentAnswers.length}) does not match the number of questions (${answers.length}).`,
      );
    }

    // Validate each answer against the student answer that was given. Put the 
    // boolean results in an array and return it.
    const validatedAnswers = [];
    answers.forEach((answer, index) => {
      validatedAnswers.push(
        this._validateAnswer(answer.type, answer.text, studentAnswers[index]),
      );
    });

    return validatedAnswers;
  }

  _validateAnswer(type, answer, studentAnswer) {
    switch (type) {
      // Check if the user provided the same answer as the correct answer.
      case "Multiple Choice": {
        const multiChoiceRegex = /(?<==)[^~]+/;
        return multiChoiceRegex.exec(answer)[0].trim() === studentAnswer;
      }

      // Extract all variations of the correct answer and check if the student answer
      // is amongst those.
      case "Short Answer": {
        const shortAnswerRegex = /(?<==)[^=]+/gs;
        const matches = [...answer.matchAll(shortAnswerRegex)].map((match) =>
          match[0].trim(),
        );
        return matches.includes(studentAnswer);
      }

      // Here we know it's one letter and the user has to provide the same letter,
      // so we can directly compare for equality. No more parsing to do for this step.
      case "True/False": {
        return answer === studentAnswer;
      }

      case "Matching": {
        // TODO: implement matching parsing.
        return null;
      }

      case "Numerical": {
        //TODO: implement numerical parsing.
        return null;
      }

      // Failed to extract an answer so validity is unknown.
      default: {
        return null;
      }
    }
  }

  _tokenizeIntoQuestions(file) {
    // Transform the raw GIFT file into an array of GIFT questions.
    // Remove comments and categories in the process.
    const withoutCategories = this._removeCategories(file);
    const withoutComments = this._removeComments(withoutCategories);
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

  _removeCategories(file) {
    // Remove all categories (line starting with '$CATEGORY:')
    return file
      .split("\n")
      .filter((line) => !line.trim().startsWith("$CATEGORY:"))
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

  // Extract the correct answer for a question
  _extractCorrectAnswer(question) {
    // Regex patterns for answer types
    const patterns = {
      "True/False": /{(T|F)}/,
      Numerical: /{#(.*?)}/,
      "Short Answer": /{=(.*?)}/,
      "Multiple Choice": /{~?=.*?(=.*?)}/,
      Matching: /{(.*?)}/, // ça ne va pas fonctionner du premier coup ce truc je le sens
    };

    for (const [type, regex] of Object.entries(patterns)) {
      const match = regex.exec(question);
      if (match) {
        return match[1].trim();
      }
    }

    throw new Error("Unable to extract the correct answer from question.");
  }
}

module.exports = GiftParser;
