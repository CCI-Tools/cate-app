/**
 * Encodes UTF-8 strings into lowercase hexadecimal representation and
 * decodes hexadecimal representation into UTF-8.
 */
class Base16 {
    static encode(value: string): string {
        let result = '';
        for (let i = 0; i < value.length; i++) {
            let part = value.codePointAt(i).toString(16);
            if (part.length === 1) {
                result += '0' + part;
            } else if (part.length === 2) {
                result += part;
            } else {
                throw new Error('string value must comprise utf-8 values only');
            }
        }
        return result.toUpperCase();
    }

    static decode(value: string): string {
        if (value.length % 2 !== 0) {
            throw new Error('string value length must be a multiple of two');
        }
        let result = '';
        for (let i = 0; i < value.length; i += 2) {
            let code = parseInt(value.substr(i, 2), 16);
            if (Number.isNaN(code)) {
                throw new Error('string value must comprise hexadecimal values only');
            }
            result += String.fromCharCode(code);
        }
        return result;
    }
}

export default Base16;