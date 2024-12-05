class VCard {
  constructor(name, email, tel) {
    this.name = name;
    this.email = email;
    this.tel = tel;
  }

  generateVCardString() {
    // We are sure to always have at least a name. A VCard in 4.0 version must
    // always begin with 'BEGIN:VCARD' followed by 'VERSION:4.0'.
    let generatedString = `BEGIN:VCARD\nVERSION:4.0\nFN:${this.name}\n`;


    // Conditionnally add other info if the user provided it.
    if (this.email) generatedString += "EMAIL:" + this.email + "\n";
    if (this.tel) generatedString += "TEL:" + this.tel + "\n";

    // VCards must always end with 'END:VCARD'.
    generatedString += "END:VCARD";

    return generatedString;
  }
}

module.exports = VCard;
