class Base16 {
  static encode(s: string): string {
    let result = '';
    for (let i = 0; i < s.length; i++) {
      result += s.codePointAt(i).toString(16);
    }
    return result;
  }

  static decode(s: string): string {
    let result = '';
    for (let i = 0; i < s.length; i += 2) {
      result += String.fromCharCode(parseInt(s.substr(i, 2), 16));
    }
    return result;
  }
}

export default Base16;