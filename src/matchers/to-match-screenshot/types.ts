export type MatcherResult = {
    pass: boolean;
    message: () => string;
};

export type ExpectThis = {
    isNot: boolean;
};
