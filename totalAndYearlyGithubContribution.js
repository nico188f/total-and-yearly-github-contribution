const axios = require("axios");

const githubData = {
   token: Bun.env.GITHUB_TOKEN,
   username: "nico188f",
};

const startYear = 2022;
const endYear = new Date().getFullYear() + 1;

const queryParameters = [
   "totalCommitContributions",
   "totalIssueContributions",
   "totalPullRequestContributions",
   "totalPullRequestReviewContributions",
];
const queryParametersText = new Map([
   ["totalCommitContributions", "Commits"],
   ["totalIssueContributions", "Issues"],
   ["totalPullRequestContributions", "Pull Requests"],
   ["totalPullRequestReviewContributions", "Pull Request Reviews"],
]);

const yearlyContributionsCollections = new Map();
const totalContributions = new Map(queryParameters.map(param => [param, 0]));

const apiCalls = [];

// makes api calls for each year
// and stores the response in a map
for (let year = startYear; year < endYear; year++) {
   apiCalls.push(
      axios
         .post(
            "https://api.github.com/graphql",
            {
               query: `
         query {
            user(login: "${githubData.username}") {
               contributionsCollection(from: "${year}-01-01T00:00:00+0000", to: "${
                  year + 1
               }-01-01T00:00:00+0000") {
                  ${queryParameters.join("\n")}
               }
            }
         }
   `,
            },
            {
               headers: {
                  Authorization: `Bearer ${githubData.token}`,
               },
            }
         )
         .then(res => handleResponse(res, year))
         .catch(error => {
            console.log("Error: " + error.response.data.errors[0].message);
         })
   );
}

function handleResponse(response, year) {
   const contributionsCollection =
      response.data.data.user.contributionsCollection;
   yearlyContributionsCollections.set(year, contributionsCollection);
}

// run after all api calls are resolved
// and then print the results
Promise.all(apiCalls).then(() => {
   for (let year = startYear; year < endYear; year++) {
      console.log(`####### ${year}: #######`);
      for (const queryParameter of queryParameters) {
         const value = yearlyContributionsCollections.get(year)[queryParameter];
         if (value !== 0) {
            console.log(`${queryParametersText.get(queryParameter)}: ${value}`);
            totalContributions.set(
               queryParameter,
               totalContributions.get(queryParameter) + value
            );
         }
      }
   }
   console.log(`####### Total: #######`);
   for (const [queryParameter, value] of totalContributions) {
      console.log(`${queryParametersText.get(queryParameter)}: ${value}`);
   }
});
