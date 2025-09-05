import {
  findOrThrowNotFound,
  throwConflictIfFound,
  parseISODateParamToUTC,
  parseStringArrayParam
} from "@utils";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

describe("Utils", () => {
  describe("findOrThrowNotFound", () => {
    const testArray = [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
      { id: 3, name: "Bob" }
    ];

    it("should return the found item when predicate matches", () => {
      const result = findOrThrowNotFound(
        testArray,
        (item) => item.id === 2,
        "User not found"
      );
      expect(result).toEqual({ id: 2, name: "Jane" });
    });

    it("should throw NotFoundError when no item matches predicate", () => {
      expect(() => {
        findOrThrowNotFound(
          testArray,
          (item) => item.id === 999,
          "User with ID 999 not found"
        );
      }).toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message when no item matches", () => {
      expect(() => {
        findOrThrowNotFound(
          testArray,
          (item) => item.id === 999,
          "Custom error message"
        );
      }).toThrow("Custom error message");
    });

    it("should work with empty array", () => {
      expect(() => {
        findOrThrowNotFound(
          [],
          (item: any) => item.id === 1,
          "No items in empty array"
        );
      }).toThrow(NotFoundError);
    });

    it("should work with different types", () => {
      const stringArray = ["apple", "banana", "cherry"];
      const result = findOrThrowNotFound(
        stringArray,
        (item) => item.startsWith("ban"),
        "Fruit not found"
      );
      expect(result).toBe("banana");
    });
  });

  describe("throwConflictIfFound", () => {
    const testArray = [
      { id: 1, email: "john@example.com" },
      { id: 2, email: "jane@example.com" },
      { id: 3, email: "bob@example.com" }
    ];

    it("should not throw when no item matches predicate", () => {
      expect(() => {
        throwConflictIfFound(
          testArray,
          (item) => item.email === "new@example.com",
          "Email already exists"
        );
      }).not.toThrow();
    });

    it("should throw ConflictError when item matches predicate", () => {
      expect(() => {
        throwConflictIfFound(
          testArray,
          (item) => item.email === "john@example.com",
          "Email already exists"
        );
      }).toThrow(ConflictError);
    });

    it("should throw ConflictError with correct message", () => {
      expect(() => {
        throwConflictIfFound(
          testArray,
          (item) => item.email === "jane@example.com",
          "Custom conflict message"
        );
      }).toThrow("Custom conflict message");
    });

    it("should work with empty array", () => {
      expect(() => {
        throwConflictIfFound(
          [],
          (item: any) => item.id === 1,
          "Should not throw on empty array"
        );
      }).not.toThrow();
    });

    it("should work with different types", () => {
      const numberArray = [1, 2, 3, 4, 5];
      expect(() => {
        throwConflictIfFound(
          numberArray,
          (item) => item > 3,
          "Number greater than 3 exists"
        );
      }).toThrow(ConflictError);
    });
  });

  describe("parseISODateParamToUTC", () => {
    it("should return undefined for non-string input", () => {
      expect(parseISODateParamToUTC(null)).toBeUndefined();
      expect(parseISODateParamToUTC(undefined)).toBeUndefined();
      expect(parseISODateParamToUTC(123)).toBeUndefined();
      expect(parseISODateParamToUTC({})).toBeUndefined();
      expect(parseISODateParamToUTC([])).toBeUndefined();
      expect(parseISODateParamToUTC(true)).toBeUndefined();
    });

    it("should parse valid ISO date string", () => {
      const isoString = "2023-12-25T10:30:00Z";
      const result = parseISODateParamToUTC(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date(isoString).getTime());
    });

    it("should parse valid ISO date string with timezone", () => {
      const isoString = "2023-12-25T10:30:00+01:00";
      const result = parseISODateParamToUTC(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date(isoString).getTime());
    });

    it("should handle URL encoded date string", () => {
      const encodedDate = encodeURIComponent("2023-12-25T10:30:00+01:00");
      const result = parseISODateParamToUTC(encodedDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date("2023-12-25T10:30:00+01:00").getTime());
    });

    it("should return undefined for invalid date string", () => {
      expect(parseISODateParamToUTC("invalid-date")).toBeUndefined();
      expect(parseISODateParamToUTC("")).toBeUndefined();
      expect(parseISODateParamToUTC("not-a-date")).toBeUndefined();
      expect(parseISODateParamToUTC("2023-13-45")).toBeUndefined();
    });

    it("should handle edge case dates", () => {
      // Valid leap year date
      const leapYearDate = "2024-02-29T00:00:00Z";
      const result = parseISODateParamToUTC(leapYearDate);
      expect(result).toBeInstanceOf(Date);
      
      // Invalid leap year date
      const invalidLeapYear = "2023-02-29T00:00:00Z";
      expect(parseISODateParamToUTC(invalidLeapYear)).toBeUndefined();
    });
  });

  describe("parseStringArrayParam", () => {
    describe("Array input", () => {
      it("should handle array of strings", () => {
        const input = ["apple", "banana", "cherry"];
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle array with mixed types", () => {
        const input = ["apple", 123, null, "banana", undefined, "cherry"];
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle array with empty strings and whitespace", () => {
        const input = ["  apple  ", "", "  ", "banana", "   cherry   "];
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle array with strings containing commas", () => {
        const input = ["apple,orange", "banana", "cherry,grape"];
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "orange", "banana", "cherry", "grape"]);
      });

      it("should handle empty array", () => {
        const result = parseStringArrayParam([]);
        expect(result).toEqual([]);
      });

      it("should handle array with only empty strings", () => {
        const input = ["", "  ", ""];
        const result = parseStringArrayParam(input);
        expect(result).toEqual([]);
      });

      it("should handle array with only non-string values", () => {
        const input = [123, null, undefined, {}];
        const result = parseStringArrayParam(input);
        expect(result).toEqual([]);
      });
    });

    describe("String input", () => {
      it("should handle comma-separated string", () => {
        const input = "apple,banana,cherry";
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle string with spaces around commas", () => {
        const input = "apple, banana , cherry";
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle single string without commas", () => {
        const input = "apple";
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple"]);
      });

      it("should handle empty string", () => {
        const result = parseStringArrayParam("");
        expect(result).toEqual([]);
      });

      it("should handle string with only commas and spaces", () => {
        const input = " , , ";
        const result = parseStringArrayParam(input);
        expect(result).toEqual([]);
      });

      it("should handle string with trailing and leading commas", () => {
        const input = ",apple,banana,cherry,";
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });

      it("should handle string with multiple consecutive commas", () => {
        const input = "apple,,banana,,,cherry";
        const result = parseStringArrayParam(input);
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });
    });

    describe("Other input types", () => {
      it("should return undefined for null", () => {
        expect(parseStringArrayParam(null)).toBeUndefined();
      });

      it("should return undefined for undefined", () => {
        expect(parseStringArrayParam(undefined)).toBeUndefined();
      });

      it("should return undefined for number", () => {
        expect(parseStringArrayParam(123)).toBeUndefined();
      });

      it("should return undefined for object", () => {
        expect(parseStringArrayParam({})).toBeUndefined();
      });

      it("should return undefined for boolean", () => {
        expect(parseStringArrayParam(true)).toBeUndefined();
        expect(parseStringArrayParam(false)).toBeUndefined();
      });

      it("should return undefined for function", () => {
        expect(parseStringArrayParam(() => {})).toBeUndefined();
      });
    });
  });
});
