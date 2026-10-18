export const normalizeClass = (name: string): string => {
  const value = name.trim().toUpperCase();

  const map: Record<string, string> = {
    "NURSERY": "NURSERY",
    "LKG": "LKG",
    "UKG": "UKG",

    "1": "1",
    "I": "1",
    "CLASS 1": "1",
    "GRADE 1": "1",

    "2": "2",
    "II": "2",
    "CLASS 2": "2",
    "GRADE 2": "2",

    "3": "3",
    "III": "3",
    "CLASS 3": "3",

    "4": "4",
    "IV": "4",
    "CLASS 4": "4",

    "5": "5",
    "V": "5",
    "CLASS 5": "5",

    "6": "6",
    "VI": "6",
    "CLASS 6": "6",

    "7": "7",
    "VII": "7",
    "CLASS 7": "7",

    "8": "8",
    "VIII": "8",
    "CLASS 8": "8",

    "9": "9",
    "IX": "9",
    "CLASS 9": "9",

    "10": "10",
    "X": "10",
    "CLASS 10": "10",

    "11": "11",
    "XI": "11",
    "CLASS 11": "11",

    "12": "12",
    "XII": "12",
    "CLASS 12": "12"
  };

  return map[value] || value;
};


export const isSameClass = (a: string, b: string): boolean => {
  return normalizeClass(a) === normalizeClass(b);
};