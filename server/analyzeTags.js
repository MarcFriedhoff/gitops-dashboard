const path = require('path');
const simpleGit = require('simple-git');

async function analyzeTags(repoPath, tagFilter) {

    console.log(`Analyzing tags in repo ${repoPath} with filter ${tagFilter}`);
    const git = simpleGit(repoPath);
    const tags = await git.tags();
    const tagToFileMap = {};

    let filter = new RegExp(tagFilter);

    const filteredTags = tags.all.filter(tag => filter.test(tag));

    console.log(`Filtered tags: ${filteredTags}`);

    console.log(JSON.stringify(tags));

    for (const tag of filteredTags) {
        const filePath = path.join('build', 'packages.yaml');
        console.log(`Reading file ${filePath} from tag ${tag}`);
        try {
            const fileContent = await git.show([`${tag}:${filePath}`]);
            tagToFileMap[tag] = fileContent;
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error.message}`);
        }
    }

    return tagToFileMap;
}

function transformConfig(inputConfig, tag) {
    // Create the repositories array
    let repositories = inputConfig.repositories.map(repo => ({
        name: repo.name,
        tag: repo.tag,
        packages: []
    }));

    // iterate over repositories
    for (let repo of repositories) {
        // Find the packages for repo.name from inputConfig.packages
        const packages = inputConfig.packages.filter(pkg => pkg.repo === repo.name);
        // Add the package names to the repo object
        for (let pkg of packages) {
            repo.packages.push(...pkg.names);
        }
    }

    // Create the output object
    const output = {
        tag: tag,
        repositories: repositories
    };

    console.log(`Transformed config: ${JSON.stringify(output)}`);

    return output;
}

exports.analyzeTags = analyzeTags;
exports.transformConfig = transformConfig;
