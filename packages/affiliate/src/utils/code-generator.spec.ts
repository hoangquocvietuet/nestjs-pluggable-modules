import { generate, generateOne, charset, Charset, Config } from './code-generator';

describe('code-generator', () => {
  describe('charset', () => {
    it('should return numbers charset', () => {
      expect(charset(Charset.NUMBERS)).toBe('0123456789');
    });

    it('should return alphabetic charset', () => {
      expect(charset(Charset.ALPHABETIC)).toBe(
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      );
    });

    it('should return alphanumeric charset', () => {
      expect(charset(Charset.ALPHANUMERIC)).toBe(
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      );
    });
  });

  describe('generateOne', () => {
    it('should generate code with given pattern', () => {
      const config = {
        pattern: 'TEST-####',
        charset: '0123456789',
        prefix: '',
        postfix: '',
      };
      const code = generateOne(config);
      expect(code).toMatch(/^TEST-\d{4}$/);
    });

    it('should apply prefix and postfix', () => {
      const config = {
        pattern: '##',
        charset: 'AB',
        prefix: 'PRE-',
        postfix: '-POST',
      };
      const code = generateOne(config);
      expect(code).toMatch(/^PRE-[AB]{2}-POST$/);
    });

    it('should preserve non-placeholder characters', () => {
      const config = {
        pattern: 'A-#-B-#-C',
        charset: '0123456789',
        prefix: '',
        postfix: '',
      };
      const code = generateOne(config);
      expect(code).toMatch(/^A-\d-B-\d-C$/);
    });
  });

  describe('generate', () => {
    it('should generate single code by default', () => {
      const codes = generate({});
      expect(codes).toHaveLength(1);
      expect(codes[0]).toHaveLength(8);
    });

    it('should generate specified number of codes', () => {
      const codes = generate({ count: 5, length: 6 });
      expect(codes).toHaveLength(5);
      codes.forEach((code) => {
        expect(code).toHaveLength(6);
      });
    });

    it('should generate unique codes', () => {
      const codes = generate({ count: 100, length: 10 });
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(100);
    });

    it('should respect length option', () => {
      const codes = generate({ length: 12 });
      expect(codes[0]).toHaveLength(12);
    });

    it('should apply prefix', () => {
      const codes = generate({ prefix: 'REF-', length: 4 });
      expect(codes[0]).toMatch(/^REF-.{4}$/);
    });

    it('should apply postfix', () => {
      const codes = generate({ postfix: '-2024', length: 4 });
      expect(codes[0]).toMatch(/^.{4}-2024$/);
    });

    it('should use custom charset', () => {
      const codes = generate({ charset: '0123456789', length: 8 });
      expect(codes[0]).toMatch(/^\d{8}$/);
    });

    it('should use custom pattern', () => {
      const codes = generate({ pattern: 'CODE-####-####' });
      expect(codes[0]).toMatch(/^CODE-.{4}-.{4}$/);
    });

    it('should throw error when not feasible to generate unique codes', () => {
      expect(() =>
        generate({ charset: 'AB', length: 2, count: 10 }),
      ).toThrow('Not possible to generate requested number of codes.');
    });

    it('should generate codes with numbers only charset', () => {
      const codes = generate({
        charset: charset(Charset.NUMBERS),
        length: 6,
      });
      expect(codes[0]).toMatch(/^\d{6}$/);
    });

    it('should generate codes with alphabetic charset', () => {
      const codes = generate({
        charset: charset(Charset.ALPHABETIC),
        length: 6,
      });
      expect(codes[0]).toMatch(/^[a-zA-Z]{6}$/);
    });
  });
});
